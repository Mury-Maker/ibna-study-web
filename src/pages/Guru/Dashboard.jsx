import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { db, auth } from '../../api/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { 
  Users, TrendingUp, AlertTriangle, Clock, CalendarDays, 
  ChevronRight, BarChart3, LineChart as LineChartIcon 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const DashboardGuru = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalSiswa: 0, rataRataUjian: 0, jumlahRemedial: 0, totalKelas: 0 });
  const [jadwalHariIni, setJadwalHariIni] = useState([]);
  const [dataWeeklyNilai, setDataWeeklyNilai] = useState([]);
  const [dataWeeklyPresensi, setDataWeeklyPresensi] = useState([]);
  const [tabelUjian, setTabelUjian] = useState([]);
  const [agendaRekap, setAgendaRekap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // --- HELPER ---
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const getWeekOfMonth = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.ceil((date.getDate() + firstDay) / 7);
    };

    const getStartOfCurrentWeek = () => {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };
    const startOfWeek = getStartOfCurrentWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // 1. QUERY UTAMA: KELAS & SISWA
    const kelasRef = query(ref(db, 'Kelas'), orderByChild('teacherId'), equalTo(user.uid));
    onValue(kelasRef, (snapKelas) => {
      const allKelas = snapKelas.val() || {};
      const listNamaKelas = Object.values(allKelas).map(k => k.nama_kelas);
      setStats(prev => ({ ...prev, totalKelas: listNamaKelas.length }));

      onValue(ref(db, 'Siswa'), (snapSiswa) => {
        const allSiswa = Object.values(snapSiswa.val() || {});
        const filteredSiswa = allSiswa.filter(s => listNamaKelas.includes(s.nama_kelas));
        const userIds = filteredSiswa.map(s => s.userId);
        setStats(prev => ({ ...prev, totalSiswa: filteredSiswa.length }));

        // 2. LOGIKA NILAI & UJIAN TERAKHIR
        onValue(ref(db, 'Konten'), (snapKonten) => {
          const allKonten = snapKonten.val() || {};
          onValue(ref(db, 'Nilai'), (snapNilai) => {
            const allNilai = Object.values(snapNilai.val() || {});
            const myNilai = allNilai.filter(n => userIds.includes(n.studentId));

            // Stats Ringkas
            const listSkor = myNilai.map(n => parseFloat(n.skor) || 0);
            const avg = listSkor.length > 0 ? (listSkor.reduce((a, b) => a + b, 0) / listSkor.length).toFixed(1) : 0;
            setStats(prev => ({ ...prev, rataRataUjian: avg, jumlahRemedial: listSkor.filter(s => s < 75).length }));

            // Grafik Weekly Nilai
            const weeklyData = [{ name: 'Mng 1', nilai: 0, c: 0 }, { name: 'Mng 2', nilai: 0, c: 0 }, { name: 'Mng 3', nilai: 0, c: 0 }, { name: 'Mng 4', nilai: 0, c: 0 }];
            myNilai.forEach(n => {
                const d = new Date(n.submittedAt || n.createdAt);
                if(d.getMonth() === now.getMonth()) {
                    const w = getWeekOfMonth(d) - 1;
                    if(w >= 0 && w < 4) { weeklyData[w].nilai += (parseFloat(n.skor)||0); weeklyData[w].c += 1; }
                }
            });
            setDataWeeklyNilai(weeklyData.map(d => ({ name: d.name, nilai: d.c > 0 ? Math.round(d.nilai / d.c) : 0 })));

            // TABEL: Rerata Ujian Terakhir Per Kelas
            const examTable = listNamaKelas.map(namaKls => {
                // Cari ID Konten Ujian terakhir untuk kelas ini
                const lastExam = Object.keys(allKonten).filter(kId => 
                    (allKonten[kId].tipeKonten === "Ujian Perbulan") && 
                    (allKonten[kId].nama_kelas === namaKls || allKonten[kId].kelasId === Object.keys(allKelas).find(key => allKelas[key].nama_kelas === namaKls))
                ).sort((a,b) => (allKonten[b].createdAt || 0) - (allKonten[a].createdAt || 0))[0];

                if(!lastExam) return { kelas: namaKls, rerata: '-', status: 'No Exam' };

                const nilaiExam = myNilai.filter(n => n.kontenId === lastExam);
                const rerata = nilaiExam.length > 0 ? (nilaiExam.reduce((a,b) => a + (parseFloat(b.skor)||0), 0) / nilaiExam.length).toFixed(1) : 0;
                return { kelas: namaKls, rerata, status: rerata >= 75 ? 'Stabil' : 'Evaluasi' };
            });
            setTabelUjian(examTable);
          });
        });

        // 3. AGENDA REKAP (Cek apakah sudah kunci laporan bulan ini)
        onValue(ref(db, 'Laporan'), (snapLap) => {
            const lapData = snapLap.val() || {};
            const needRekap = listNamaKelas.filter(namaKls => {
                return !lapData[namaKls] || !lapData[namaKls][currentMonthKey];
            });
            setAgendaRekap(needRekap);
        });

        // 4. PRESENSI MINGGU INI
        onValue(ref(db, 'Kehadiran'), (snapAbsen) => {
           const allAbsen = Object.values(snapAbsen.val() || {});
           const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
           const presensiData = days.map(d => ({ name: d, hadir: 0, total: 0 }));
           allAbsen.forEach(a => {
               const dA = new Date(a.createdAt);
               if(listNamaKelas.includes(a.nama_kelas) && dA >= startOfWeek && dA <= endOfWeek) {
                   const idx = dA.getDay() - 1;
                   if(idx >= 0 && idx < 5) {
                       presensiData[idx].total += 1;
                       if(a.status === 'Hadir') presensiData[idx].hadir += 1;
                   }
               }
           });
           setDataWeeklyPresensi(presensiData.map(p => ({ name: p.name, hadir: p.total > 0 ? Math.round((p.hadir / p.total) * 100) : 0 })));
        });
      });
    });

    // 5. JADWAL
    const hariIni = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now);
    onValue(query(ref(db, 'Jadwal'), orderByChild('teacherId'), equalTo(user.uid)), (snap) => {
      const list = Object.values(snap.val() || {}).filter(j => j.hari === hariIni);
      setJadwalHariIni(list.sort((a,b) => a.jamMulai.localeCompare(b.jamMulai)));
      setLoading(false);
    });
  }, []);

  const styles = {
    container: { padding: '20px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' },
    card: { backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}`, color: colors.textPrimary },
    labelHeader: { color: colors.textMuted, fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '10px', display: 'block' },
    sectionTitle: { fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }
  };

  return (
    <GuruLayout title="Dashboard">
      <div style={styles.container}>
        
        <div style={styles.statsGrid}>
          <div style={styles.card}>
            <span style={styles.labelHeader}>TOTAL SISWA AKTIF</span>
            <div style={{fontSize: '24px', fontWeight: '900'}}>{stats.totalSiswa} <span style={{fontSize: '14px', color: colors.textMuted, fontWeight: '500'}}>/ {stats.totalKelas} Kelas</span></div>
          </div>
          <div style={styles.card}>
            <span style={styles.labelHeader}>RERATA NILAI TOTAL</span>
            <div style={{fontSize: '24px', fontWeight: '900', color: colors.primary}}>{stats.rataRataUjian}</div>
          </div>
          <div style={styles.card}>
            <span style={styles.labelHeader}>SISWA REMEDIAL</span>
            <div style={{fontSize: '24px', fontWeight: '900', color: '#F87171'}}>{stats.jumlahRemedial} <span style={{fontSize: '14px', fontWeight: '500'}}>Siswa</span></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '25px' }}>
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><LineChartIcon size={18} color={colors.primary}/> Nilai Tugas (Bulan Ini)</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataWeeklyNilai}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} />
                  <YAxis stroke={colors.textMuted} fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="nilai" stroke={colors.primary} strokeWidth={4} dot={{ r: 4, fill: colors.primary }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><BarChart3 size={18} color="#10B981"/> Presensi Minggu Ini (%)</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataWeeklyPresensi}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} />
                  <YAxis stroke={colors.textMuted} fontSize={10} domain={[0, 100]} />
                  <Bar dataKey="hadir" fill="#10B981" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{...styles.card, marginBottom: '25px'}}>
          <h3 style={styles.sectionTitle}><CalendarDays size={18} color={colors.primary} /> Jadwal Mengajar Hari Ini</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
            {jadwalHariIni.length > 0 ? jadwalHariIni.map((item, idx) => (
              <div key={idx} style={{ padding: '18px', borderRadius: '14px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: `1px solid ${colors.border}` }}>
                <div style={{fontSize: '12px', fontWeight: '800', color: colors.primary}}>{item.jamMulai} - {item.jamSelesai}</div>
                <div style={{fontWeight: '900', fontSize: '16px', margin: '4px 0'}}>{item.nama_kelas}</div>
                <div style={{fontSize: '12px', color: colors.textMuted}}>{item.hari}</div>
              </div>
            )) : <div style={{color: colors.textMuted, fontSize: '13px'}}>Tidak ada jadwal hari ini.</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
          {/* TABEL RERATA UJIAN TERAKHIR */}
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
              <h3 style={{...styles.sectionTitle, marginBottom: 0}}>Rerata Ujian Terakhir per Kelas</h3>
              <button onClick={() => navigate('/Guru/Rekap-Nilai')} style={{background: 'none', border: 'none', color: colors.primary, fontSize: '12px', fontWeight: '800', cursor: 'pointer'}}>LIHAT SEMUA</button>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontSize: '10px', color: colors.textMuted}}>
                    <th style={{padding: '12px 8px'}}>KELAS</th>
                    <th style={{padding: '12px 8px'}}>RERATA</th>
                    <th style={{padding: '12px 8px'}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelUjian.map((row, i) => (
                    <tr key={i} style={{borderBottom: `1px solid ${colors.border}`, fontSize: '14px'}}>
                      <td style={{padding: '15px 8px', fontWeight: '700'}}>{row.kelas}</td>
                      <td style={{padding: '15px 8px', fontWeight: '900'}}>{row.rerata}</td>
                      <td style={{padding: '15px 8px'}}>
                        <span style={{ 
                          fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px',
                          backgroundColor: row.rerata === '-' ? '#94a3b820' : (row.rerata >= 75 ? '#10B98120' : '#F8717120'), 
                          color: row.rerata === '-' ? '#94a3b8' : (row.rerata >= 75 ? '#10B981' : '#F87171')
                        }}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AGENDA PERLU REKAP (DINAMIS) */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><AlertTriangle size={18} color="#F59E0B"/> Agenda Perlu Rekap</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {agendaRekap.length > 0 ? agendaRekap.map((kelas, idx) => (
                    <div key={idx} onClick={() => navigate('/Guru/Rekap-Nilai')} style={{ 
                      display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', borderRadius: '14px',
                      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : '#FFFBEB',
                      border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7'}`,
                      cursor: 'pointer', transition: '0.2s'
                    }}>
                      <div style={{ backgroundColor: '#F59E0B', padding: '10px', borderRadius: '10px', color: '#FFF' }}>
                        <AlertTriangle size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#B45309', letterSpacing: '0.5px' }}>BELUM REKAP NILAI</div>
                        <div style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '700' }}>{kelas}</div>
                      </div>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </div>
                )) : (
                    <div style={{padding: '20px', textAlign: 'center', color: '#10B981', fontWeight: '700', fontSize: '14px'}}>
                        Semua kelas sudah direkap bulan ini. ✨
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </GuruLayout>
  );
};

export default DashboardGuru;