import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PlusCircle, FileText } from 'lucide-react';

const TabUjian = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();

  const styles = {
    container: {
      color: colors.textPrimary,
      animation: 'fadeIn 0.3s ease'
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '700',
      color: colors.textPrimary
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: colors.primary,
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: isDarkMode ? '0 4px 14px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      backgroundColor: colors.cardBg,
      borderRadius: '12px',
      border: `2px dashed ${colors.border}`,
      textAlign: 'center'
    }
  };

  const handleAddUjian = () => {
    // Logika untuk buka modal atau navigasi ke halaman buat ujian
    alert(`Tambah ujian baru untuk kelas ${kelasId}`);
  };

  return (
    <div style={styles.container}>
      {/* Header dengan Tombol Tambah */}
      <div style={styles.headerSection}>
        <h3 style={styles.title}>Daftar Ujian Perbulan - {kelasId}</h3>
        <button 
          style={styles.addButton} 
          onClick={handleAddUjian}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <PlusCircle size={18} />
          Tambah Ujian
        </button>
      </div>

      {/* Tampilan jika data kosong */}
      <div style={styles.emptyState}>
        <FileText size={48} color={colors.textMuted} style={{ marginBottom: '15px', opacity: 0.5 }} />
        <p style={{ color: colors.textMuted, margin: 0, fontSize: '15px' }}>
          Belum ada data ujian yang dijadwalkan untuk bulan ini.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TabUjian;