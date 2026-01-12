import React from 'react';
import { useNavigate } from 'react-router-dom';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, TrendingUp, AlertTriangle, Clock, CalendarDays, 
  ChevronRight, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const DashboardGuru = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  // DATA DUMMY GRAFIK
  const dataPerkembangan = [
    { name: 'Mng 1', nilai: 75 }, { name: 'Mng 2', nilai: 82 },
    { name: 'Mng 3', nilai: 79 }, { name: 'Mng 4', nilai: 88 },
  ];

  const dataKehadiran = [
    { name: 'Sen', hadir: 95 }, { name: 'Sel', hadir: 98 },
    { name: 'Rab', hadir: 90 }, { name: 'Kam', hadir: 96 }, { name: 'Jum', hadir: 92 },
  ];

  const dataStatusSiswa = [
    { name: 'Tuntas', value: 85, color: '#10B981' },
    { name: 'Remedial', value: 15, color: '#F87171' },
  ];

  const styles = {
    container: { padding: '20px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease' },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px',
      marginBottom: '25px'
    },
    card: { 
      backgroundColor: colors.cardBg, 
      padding: '20px', 
      borderRadius: '16px', 
      border: `1px solid ${colors.border}`, 
      color: colors.textPrimary,
      width: '100%',
      boxSizing: 'border-box',
      minWidth: 0 
    },
    labelHeader: {
      color: colors.textMuted,
      fontSize: '11px', 
      fontWeight: '800',
      letterSpacing: '1px',
      marginBottom: '10px',
      display: 'block'
    },
    sectionTitle: {
      fontSize: '15px', 
      fontWeight: '800', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      margin: '0 0 20px 0'
    }
  };

  return (
    <GuruLayout title="Dashboard Performa">
      <div style={styles.container}>
        
        {/* TOP METRICS */}
        <div style={styles.statsGrid}>
          <div style={styles.card}>
            <span style={styles.labelHeader}>TOTAL SISWA AKTIF</span>
            <div style={{fontSize: '24px', fontWeight: '900', color: colors.textPrimary}}>
              124 <span style={{fontSize: '14px', color: colors.textMuted, fontWeight: '500'}}>/ 4 Kelas</span>
            </div>
          </div>
          
          <div style={styles.card}>
            <span style={styles.labelHeader}>RATA-RATA UJIAN</span>
            <div style={{fontSize: '24px', fontWeight: '900', color: colors.primary}}>84.2</div>
            <div style={{fontSize: '12px', color: '#10B981', fontWeight: '700', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <TrendingUp size={14} /> +2.1% <span style={{fontWeight: '400', color: colors.textMuted}}>bln ini</span>
            </div>
          </div>

          <div style={styles.card}>
            <span style={styles.labelHeader}>SISWA REMEDIAL</span>
            <div style={{fontSize: '24px', fontWeight: '900', color: '#F87171'}}>08 <span style={{fontSize: '14px', fontWeight: '500'}}>Siswa</span></div>
          </div>
        </div>

        {/* GRAPHS SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '25px' }}>
          
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><LineChartIcon size={18} color={colors.primary}/> Perkembangan Nilai</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPerkembangan}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="nilai" stroke={colors.primary} strokeWidth={4} dot={{ r: 4, fill: colors.primary }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><BarChart3 size={18} color="#10B981"/> Presensi Mingguan (%)</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataKehadiran}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="hadir" fill="#10B981" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* JADWAL HARI INI - FULL WIDTH */}
        <div style={{...styles.card, marginBottom: '25px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
            <h3 style={{...styles.sectionTitle, marginBottom: 0}}>
              <CalendarDays size={18} color={colors.primary} /> Jadwal Mengajar Hari Ini
            </h3>
            <span style={{fontSize: '12px', fontWeight: '700', color: colors.textMuted, backgroundColor: colors.border + '50', padding: '5px 12px', borderRadius: '8px'}}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
            {[
              { jam: '08:00 - 09:30', kelas: 'XII IPA 1', status: 'Selesai', color: '#10B981' },
              { jam: '10:00 - 11:30', kelas: 'XII IPA 2', status: 'Sekarang', color: '#FACC15' },
              { jam: '13:00 - 14:30', kelas: 'XI IPS 1', status: 'Mendatang', color: colors.textMuted },
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '18px', borderRadius: '14px', 
                backgroundColor: item.status === 'Sekarang' ? colors.primary + '10' : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                border: `1px solid ${item.status === 'Sekarang' ? colors.primary : colors.border}`,
                transition: '0.3s'
              }}>
                <div style={{fontSize: '12px', fontWeight: '800', color: colors.primary}}>{item.jam}</div>
                <div style={{fontWeight: '900', fontSize: '16px', margin: '4px 0', color: colors.textPrimary}}>{item.kelas}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px'}}>
                  <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color}}></div>
                  <span style={{fontSize: '12px', fontWeight: '700', color: colors.textPrimary}}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CONTENT: TABLE & AGENDA */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px'}}>
          
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
              <h3 style={{...styles.sectionTitle, marginBottom: 0}}>Hasil Ujian Terakhir</h3>
              <button onClick={() => navigate('/Guru/RekapNilai')} style={{background: 'none', border: 'none', color: colors.primary, fontSize: '12px', fontWeight: '800', cursor: 'pointer'}}>LIHAT SEMUA</button>
            </div>
            
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontSize: '10px', color: colors.textMuted}}>
                    <th style={{padding: '12px 8px', letterSpacing: '1px'}}>KELAS</th>
                    <th style={{padding: '12px 8px', letterSpacing: '1px'}}>RERATA</th>
                    <th style={{padding: '12px 8px', letterSpacing: '1px'}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { kelas: 'XII IPA 1', score: 88, status: 'Stabil', color: '#10B981' },
                    { kelas: 'XII IPA 2', score: 76, status: 'Evaluasi', color: '#FACC15' },
                    { kelas: 'XI IPS 1', score: 82, status: 'Meningkat', color: colors.primary },
                  ].map((row, i) => (
                    <tr key={i} style={{borderBottom: `1px solid ${colors.border}`, fontSize: '14px'}}>
                      <td style={{padding: '15px 8px', fontWeight: '700', color: colors.textPrimary}}>{row.kelas}</td>
                      <td style={{padding: '15px 8px', fontWeight: '900', color: colors.textPrimary}}>{row.score}</td>
                      <td style={{padding: '15px 8px'}}>
                        <span style={{ 
                          fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px',
                          backgroundColor: row.color + '20', color: row.color, border: `1px solid ${row.color}40`
                        }}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><AlertTriangle size={18} color="#F59E0B"/> Agenda Perlu Rekap</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['XII IPA 2', 'XI IPS 1'].map((kelas, idx) => (
                <div key={idx} onClick={() => navigate('/Guru/RekapNilai')} style={{ 
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
              ))}
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dashboard-wrapper select:focus { border-color: ${colors.primary}; }
      `}</style>
    </GuruLayout>
  );
};

export default DashboardGuru;