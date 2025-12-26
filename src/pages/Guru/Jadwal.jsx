import React from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { Clock, CalendarDays, ChevronRight, AlertCircle } from 'lucide-react';

const JadwalGuru = () => {
  const { colors, isDarkMode } = useTheme();

  const dataJadwal = [
    { hari: 'Senin', kelas: 'Kelas 7A', jam: '08:00 - 09:30' },
    { hari: 'Senin', kelas: 'Kelas 8C', jam: '10:00 - 11:30' },
    { hari: 'Selasa', kelas: 'Kelas 9B', jam: '08:00 - 09:30' },
    { hari: 'Selasa', kelas: 'Kelas 10-IPA', jam: '10:00 - 11:30' },
    { hari: 'Rabu', kelas: 'Kelas 7A', jam: '13:00 - 14:30' },
    { hari: 'Kamis', kelas: 'Kelas 10-IPA', jam: '10:00 - 11:30' },
  ];

  const styles = {
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '25px',
      width: '100%'
    },
    dayTitle: {
      fontSize: '18px',
      fontWeight: '800',
      color: isDarkMode ? '#60A5FA' : colors.primary,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '15px',
      paddingBottom: '8px',
      borderBottom: `2px solid ${colors.border}`
    },
    jadwalCard: {
      backgroundColor: colors.cardBg,
      padding: '18px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    // Note ditaruh di atas agar langsung terlihat
    noteUjianAtas: {
      marginBottom: '25px',
      padding: '12px 18px',
      borderRadius: '10px',
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
      border: `1px solid ${isDarkMode ? '#F87171' : '#FCA5A5'}`,
      color: isDarkMode ? '#FCA5A5' : '#B91C1C',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  };

  const hariUnik = [...new Set(dataJadwal.map(item => item.hari))];

  return (
    <GuruLayout title="Jadwal Mengajar">
      
      {/* 1. Note Ujian (Paling Atas) */}
      <div style={styles.noteUjianAtas}>
        <AlertCircle size={18} />
        <span>
          <strong>Ujian Bulanan:</strong> Dilaksanakan setiap tanggal 25 s/d 30. Harap siapkan soal tepat waktu.
        </span>
      </div>

      {/* 2. Banner Info */}
      <div style={{ ...styles.jadwalCard, borderLeft: `5px solid ${colors.secondary}`, marginBottom: '30px' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>Semester Ganjil 2025</div>
          <div style={{ fontSize: '13px', color: colors.textMuted }}>Sistem Paket Ujian Bulanan</div>
        </div>
        <CalendarDays size={24} color={colors.secondary} />
      </div>

      {/* 3. Grid Jadwal */}
      <div className="schedule-grid" style={styles.gridContainer}>
        {hariUnik.map((hari) => (
          <div key={hari} style={{ marginBottom: '10px' }}>
            <div style={styles.dayTitle}>
              <div style={{ width: '4px', height: '20px', backgroundColor: colors.secondary, borderRadius: '2px' }} />
              {hari}
            </div>

            {dataJadwal.filter(j => j.hari === hari).map((item, idx) => (
              <div key={idx} style={styles.jadwalCard}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '16px' }}>{item.kelas}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginTop: '5px', color: colors.textMuted }}>
                    <Clock size={14} color={isDarkMode ? '#60A5FA' : colors.primary} />
                    {item.jam}
                  </div>
                </div>
                <ChevronRight size={18} color={colors.border} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .schedule-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </GuruLayout>
  );
};

export default JadwalGuru;