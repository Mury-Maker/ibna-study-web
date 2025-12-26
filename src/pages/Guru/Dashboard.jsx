import React from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  CalendarDays,
} from 'lucide-react';

const DashboardGuru = () => {
  const { colors, isDarkMode } = useTheme(); // Tambahkan isDarkMode untuk logika warna manual

  const styles = {
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
      gap: '15px',
      marginBottom: '25px'
    },
    card: { 
      backgroundColor: colors.cardBg, 
      padding: '20px', 
      borderRadius: '12px', 
      border: `1px solid ${colors.border}`, 
      color: colors.textPrimary,
      boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
      height: 'fit-content',
      width: '100%',
      boxSizing: 'border-box'
    },
    // Optimasi warna teks muted agar lebih terang di mode gelap
    labelMuted: {
      color: isDarkMode ? '#CBD5E1' : colors.textMuted, // Abu-abu terang di dark mode
      fontSize: '11px', 
      fontWeight: '600',
      letterSpacing: '0.5px'
    },
    statusBadge: (bg, color) => ({
      backgroundColor: bg,
      color: color,
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '10px',
      fontWeight: '700',
      whiteSpace: 'nowrap'
    })
  };

  return (
    <GuruLayout title="Dashboard">
      <div className="dashboard-wrapper" style={{ width: '100%', overflowX: 'hidden' }}>
        
        {/* KEY METRICS */}
        <div style={styles.statsGrid}>
          <div style={styles.card}>
            <div style={styles.labelMuted}>TOTAL SISWA</div>
            <div style={{fontSize: '24px', fontWeight: '800', margin: '5px 0'}}>124 <span style={{fontSize: '14px', color: isDarkMode ? '#94A3B8' : colors.textMuted}}>/ 4 Kelas</span></div>
          </div>
          
          <div style={styles.card}>
            <div style={styles.labelMuted}>RATA-RATA UJIAN</div>
            <div style={{fontSize: '24px', fontWeight: '800', margin: '5px 0', color: isDarkMode ? '#60A5FA' : colors.primary}}>84.2</div>
            <div style={{fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <TrendingUp size={12} /> +2.1%
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.labelMuted}>REMEDIAL</div>
            <div style={{fontSize: '24px', fontWeight: '800', margin: '5px 0', color: '#F87171'}}>8 <span style={{fontSize: '14px'}}>Siswa</span></div>
          </div>
        </div>

        {/* JADWAL HARI INI */}
        <div style={{...styles.card, marginBottom: '25px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px'}}>
            <h3 style={{fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
              <CalendarDays size={18} color={isDarkMode ? '#60A5FA' : colors.primary} /> Jadwal Hari Ini
            </h3>
            <span style={{fontSize: '12px', color: isDarkMode ? '#CBD5E1' : colors.textMuted}}>Kamis, 25 Des 2025</span>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px'}}>
            {[
              { jam: '08:00 - 09:30', kelas: 'Kelas 7A', status: 'Selesai' },
              { jam: '10:00 - 11:30', kelas: 'Kelas 8C', status: 'Sekarang' },
              { jam: '13:00 - 14:30', kelas: 'Kelas 9B', status: 'Mendatang' },
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '12px', 
                borderRadius: '10px', 
                backgroundColor: item.status === 'Sekarang' ? (isDarkMode ? '#1E293B' : `${colors.primary}10`) : (isDarkMode ? '#0F172A' : colors.sidebarBg),
                border: item.status === 'Sekarang' ? `1px solid ${isDarkMode ? '#60A5FA' : colors.primary}` : `1px solid ${colors.border}`
              }}>
                <div style={{fontSize: '11px', fontWeight: '700', color: isDarkMode ? '#60A5FA' : colors.primary}}>{item.jam}</div>
                <div style={{fontWeight: '700', fontSize: '15px', margin: '2px 0'}}>{item.kelas}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px'}}>
                  <div style={{width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.status === 'Selesai' ? '#10B981' : item.status === 'Sekarang' ? '#FACC15' : '#94A3B8'}}></div>
                  <span style={{fontSize: '11px', fontWeight: '600', color: isDarkMode ? '#CBD5E1' : colors.textPrimary}}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="dashboard-content-grid" style={{display: 'grid', gap: '20px', width: '100%'}}>
          
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center'}}>
              <h3 style={{fontSize: '15px', fontWeight: '700'}}>Hasil Ujian Paket</h3>
              <button style={{background: 'none', border: 'none', color: isDarkMode ? '#60A5FA' : colors.primary, fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>Detail</button>
            </div>
            
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '350px'}}>
                <thead>
                  <tr style={{textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', color: isDarkMode ? '#CBD5E1' : colors.textMuted}}>
                    <th style={{padding: '12px 4px'}}>KELAS</th>
                    <th style={{padding: '12px 4px'}}>RATA-RATA</th>
                    <th style={{padding: '12px 4px'}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { kelas: 'Kelas 7A', score: 88, status: 'Selesai', color: '#10B981' },
                    { kelas: 'Kelas 8C', score: 76, status: 'Evaluasi', color: '#FACC15' },
                    { kelas: 'Kelas 9B', score: 82, status: 'Proses', color: '#60A5FA' },
                  ].map((row, i) => (
                    <tr key={i} style={{borderBottom: `1px solid ${colors.border}`, fontSize: '14px'}}>
                      <td style={{padding: '14px 4px', fontWeight: '600'}}>{row.kelas}</td>
                      <td style={{padding: '14px 4px', fontWeight: '700'}}>{row.score}</td>
                      <td style={{padding: '14px 4px'}}>
                        <span style={styles.statusBadge(`${row.color}25`, row.color)}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={styles.card}>
              <h3 style={{fontSize: '15px', fontWeight: '700', marginBottom: '15px'}}>Agenda</h3>
              <div style={{display: 'flex', gap: '12px', marginBottom: '15px'}}>
                <div style={{backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px'}}><AlertTriangle size={20} color="#F87171" /></div>
                <div>
                  <div style={{fontSize: '13px', fontWeight: '700'}}>Input Nilai</div>
                  <div style={{fontSize: '11px', color: isDarkMode ? '#CBD5E1' : colors.textMuted}}>Deadline: Besok</div>
                </div>
              </div>
              <div style={{display: 'flex', gap: '12px'}}>
                <div style={{backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '8px'}}><Clock size={20} color="#60A5FA" /></div>
                <div>
                  <div style={{fontSize: '13px', fontWeight: '700'}}>Rapat Evaluasi</div>
                  <div style={{fontSize: '11px', color: isDarkMode ? '#CBD5E1' : colors.textMuted}}>Kamis, 14:00 WIB</div>
                </div>
              </div>
            </div>

            <div style={{...styles.card, backgroundColor: isDarkMode ? '#1E293B' : colors.primary, border: 'none', textAlign: 'center'}}>
               <div style={{fontSize: '13px', fontWeight: '600', color: '#fff'}}>Kirim laporan sekarang?</div>
               <button style={{width: '100%', padding: '12px', backgroundColor: '#fff', color: isDarkMode ? '#1E293B' : colors.primary, border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '12px', fontSize: '13px'}}>Kirim Rapor Bulanan</button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dashboard-content-grid { grid-template-columns: 1.6fr 1fr !important; }
        }
        @media (max-width: 1023px) {
          .dashboard-content-grid { grid-template-columns: 1fr !important; }
          main { padding: 15px !important; } 
        }
      `}</style>
    </GuruLayout>
  );
};

export default DashboardGuru;