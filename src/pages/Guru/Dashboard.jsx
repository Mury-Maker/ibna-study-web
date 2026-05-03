import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { db, auth } from '../../api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { 
  Users, TrendingUp, AlertTriangle, Clock, CalendarDays, 
  ChevronRight, BarChart3, PieChart, MessageSquare, Loader2, Bell, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const DashboardGuru = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalSiswa: 0, rataRataNilai: 0, totalRemedial: 0 });
  const [interaksiPending, setInteraksiPending] = useState({ pr: 0, tambahan: 0 });
  const [jadwalHariIni, setJadwalHariIni] = useState([]);
  const [dataPresensiSemester, setDataPresensiSemester] = useState([]);
  const [topSiswaPerhatian, setTopSiswaPerhatian] = useState([]);
  const [agendaRekap, setAgendaRekap] = useState([]);
  const [filterTriwulan, setFilterTriwulan] = useState("T4");
  const [loading, setLoading] = useState(true);

  const prevPeriodeKey = "2026_T3"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) loadDashboard(user.uid);
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [filterTriwulan]);

  const loadDashboard = async (uid) => {
    const kelasRef = query(ref(db, 'Kelas'), orderByChild('teacherId'), equalTo(uid));
    
    onValue(kelasRef, (snapKelas) => {
      const kelasObj = snapKelas.val() || {};
      const listNamaKelas = Object.values(kelasObj).map(k => k.nama_kelas);
      
      onValue(ref(db, 'Siswa'), (snapSiswa) => {
        const allSiswa = snapSiswa.val() || {};
        const filteredSiswaKeys = Object.keys(allSiswa).filter(key => listNamaKelas.includes(allSiswa[key].nama_kelas));
        
        onValue(ref(db, 'Laporan'), (snapLap) => {
          const lapData = snapLap.val() || {};
          let aggregatedSiswa = [];

          listNamaKelas.forEach(namaKls => {
            if (lapData[namaKls] && lapData[namaKls][prevPeriodeKey]) {
              const dataSiswaLap = lapData[namaKls][prevPeriodeKey].dataSiswa || [];
              aggregatedSiswa = [...aggregatedSiswa, ...dataSiswaLap];
            }
          });

          const totalSiswaLap = aggregatedSiswa.length;
          const avgTotal = totalSiswaLap > 0 
            ? (aggregatedSiswa.reduce((acc, curr) => acc + (curr.rataAkhir || 0), 0) / totalSiswaLap).toFixed(1) 
            : 0;
          const remedialCount = aggregatedSiswa.filter(s => (s.rataAkhir || 0) < 75).length;

          setStats({
            totalSiswa: filteredSiswaKeys.length,
            rataRataNilai: avgTotal,
            totalRemedial: remedialCount
          });

          const top5 = aggregatedSiswa
            .sort((a, b) => (a.rataAkhir || 0) - (b.rataAkhir || 0))
            .slice(0, 5)
            .map(s => ({ nama: s.nama, avg: (s.rataAkhir || 0).toFixed(1) }));
          setTopSiswaPerhatian(top5);

          const periodeCek = `2026_${filterTriwulan}`;
          setAgendaRekap(listNamaKelas.filter(nama => !lapData[nama] || !lapData[nama][periodeCek]));
        });

        onValue(ref(db, 'Kehadiran'), (snapAbsen) => {
          const allAbsen = Object.values(snapAbsen.val() || {}).filter(a => listNamaKelas.includes(a.nama_kelas));
          const count = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
          allAbsen.forEach(a => { if(count[a.status] !== undefined) count[a.status]++ });
          
          setDataPresensiSemester([
            { status: 'Hadir', jumlah: count.Hadir, color: '#10B981' },
            { status: 'Izin', jumlah: count.Izin, color: '#F59E0B' },
            { status: 'Sakit', jumlah: count.Sakit, color: '#6366F1' },
            { status: 'Alpa', jumlah: count.Alpa, color: '#EF4444' }
          ]);
        });

        onValue(ref(db, 'TanyaPR'), (snapPR) => {
          const prs = Object.values(snapPR.val() || {}).filter(p => p.teacherId === uid && p.status === "Menunggu").length;
          onValue(ref(db, 'TambahanBelajar'), (snapAdd) => {
            const adds = Object.values(snapAdd.val() || {}).filter(a => a.teacherId === uid && a.status === "Menunggu").length;
            setInteraksiPending({ pr: prs, tambahan: adds });
          });
        });

        setLoading(false);
      });

      const hariIni = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
      onValue(query(ref(db, 'Jadwal'), orderByChild('teacherId'), equalTo(uid)), (snap) => {
        const list = Object.values(snap.val() || {}).filter(j => j.hari === hariIni);
        setJadwalHariIni(list.sort((a,b) => a.jamMulai.localeCompare(b.jamMulai)));
      });
    });
  };

  if (loading) return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <Loader2 className="animate-spin" size={40} color={colors.primary}/>
    </div>
  );

  return (
    <GuruLayout title="Dashboard">
      <div style={{ padding: '16px 24px', animation: 'fadeIn 0.5s ease' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <StatCard label="TOTAL SISWA" value={stats.totalSiswa} icon={<Users size={18}/>} color={colors.primary} />
          <StatCard label={`AVG NILAI (${prevPeriodeKey})`} value={`${stats.rataRataNilai}`} icon={<TrendingUp size={18}/>} color="#10B981" />
          <StatCard label={`REMEDIAL (${prevPeriodeKey})`} value={stats.totalRemedial} icon={<AlertTriangle size={18}/>} color="#F87171" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={cardStyle(colors, '15px')}>
                <h3 style={titleStyle}><CalendarDays size={16} color={colors.primary}/> Jadwal Hari Ini</h3>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {jadwalHariIni.length > 0 ? jadwalHariIni.map((j, i) => (
                        <div key={i} style={{ minWidth: '160px', padding: '10px 15px', borderRadius: '12px', background: isDarkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${colors.border}` }}>
                            <div style={{fontWeight:'900', fontSize:'13px'}}>{j.nama_kelas}</div>
                            <div style={{fontSize:'11px', color:colors.textMuted}}>{j.jamMulai}</div>
                        </div>
                    )) : <p style={{fontSize:'12px', color:colors.textMuted}}>Tidak ada jadwal.</p>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
               <InteraksiCard label="TANYA PR" count={interaksiPending.pr} icon={<MessageSquare size={16}/>} onClick={() => navigate('/Guru/Tanya-PR')} color="#F59E0B" />
               <InteraksiCard label="BELAJAR BARU" count={interaksiPending.tambahan} icon={<Clock size={16}/>} onClick={() => navigate('/Guru/Tambahan-Belajar')} color="#8B5CF6" />
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={cardStyle(colors, '15px')}>
            <h3 style={titleStyle}><BarChart3 size={16}/> Presensi Semester</h3>
            <ResponsiveContainer width="99%" height={180}>
              <BarChart data={dataPresensiSemester} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                <XAxis dataKey="status" stroke={colors.textMuted} fontSize={10} fontWeight="700" />
                <YAxis fontSize={10} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="jumlah" radius={[4,4,0,0]} barSize={35}>
                  {dataPresensiSemester.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle(colors, '15px')}>
            <h3 style={titleStyle}><PieChart size={16}/> Top 5 Perhatian ({prevPeriodeKey})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {topSiswaPerhatian.length > 0 ? topSiswaPerhatian.map((s, i) => (
                        <tr key={i} style={{ borderBottom: i !== 4 ? `1px solid ${colors.border}` : 'none' }}>
                            <td style={{ padding: '8px 0', fontSize: '13px', fontWeight: '700' }}>{s.nama}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right', color: '#EF4444', fontWeight: '900', fontSize: '13px' }}>{s.avg}</td>
                        </tr>
                    )) : <tr><td style={{padding:'10px', textAlign:'center', fontSize:'11px', color:colors.textMuted}}>Kosong.</td></tr>}
                </tbody>
            </table>
          </div>
        </div>

        <div style={cardStyle(colors, '15px')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={titleStyle}><Bell size={16} color="#EF4444"/> Agenda Belum Rekap</h3>
            <select value={filterTriwulan} onChange={(e) => setFilterTriwulan(e.target.value)} style={{ border: `1px solid ${colors.border}`, background: isDarkMode ? '#1e293b' : '#fff', fontWeight: '800', fontSize: '11px', padding: '4px 8px', borderRadius: '8px', color: colors.textPrimary, cursor: 'pointer' }}>
                <option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option><option value="T4">T4</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {agendaRekap.length > 0 ? agendaRekap.map((kls, i) => (
              <div key={i} onClick={() => navigate('/Guru/Rekap-Nilai')} style={{ padding: '8px 15px', borderRadius: '10px', border: `1px solid #EF444430`, backgroundColor: '#EF444408', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '800', fontSize: '13px', color: isDarkMode ? '#FCA5A5' : '#B91C1C' }}>{kls}</span>
                <ChevronRight size={12} color="#EF4444" />
              </div>
            )) : <div style={{fontSize:'12px', color:'#10B981', fontWeight:'700'}}>✅ Lengkap.</div>}
          </div>
        </div>

      </div>
    </GuruLayout>
  );
};

const cardStyle = (colors, pad) => ({ backgroundColor: colors.cardBg, padding: pad, borderRadius: '16px', border: `1px solid ${colors.border}` });
const titleStyle = { fontSize: '14px', fontWeight: '900', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' };

const StatCard = ({ label, value, icon, color }) => {
  const { colors } = useTheme();
  return (
    <div style={{ backgroundColor: colors.cardBg, padding: '15px 20px', borderRadius: '16px', border: `1px solid ${colors.border}`, borderTop: `4px solid ${color}` }}>
      <div style={{ color: colors.textMuted, fontSize: '9px', fontWeight: '900', marginBottom: '5px', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: '1000' }}>{value}</span>
        <div style={{ color: color, opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
};

const InteraksiCard = ({ label, count, icon, onClick, color }) => (
  <div onClick={onClick} style={{ padding: '10px 15px', borderRadius: '14px', backgroundColor: color + '10', border: `1px solid ${color}20`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ backgroundColor: color, padding: '6px', borderRadius: '8px', color: '#fff' }}>{icon}</div>
        <div style={{ fontSize: '11px', color: color, fontWeight: '900' }}>{label}</div>
    </div>
    <div style={{ fontSize: '14px', fontWeight: '1000' }}>{count}</div>
  </div>
);

export default DashboardGuru;