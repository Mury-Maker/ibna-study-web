import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const styles = {
    container: {
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.contentBg,
      color: colors.textPrimary,
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    },
    errorCode: {
      fontSize: '120px',
      fontWeight: '900',
      margin: 0,
      lineHeight: '1',
      color: colors.primary,
      letterSpacing: '-5px',
      opacity: isDarkMode ? 0.8 : 1
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: '10px 0 20px 0'
    },
    description: {
      fontSize: '16px',
      color: colors.textMuted,
      maxWidth: '400px',
      lineHeight: '1.6',
      marginBottom: '30px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px'
    },
    btnHome: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '10px',
      backgroundColor: colors.primary,
      color: '#ffffff',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '700',
      transition: '0.3s ease'
    },
    btnBack: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '10px',
      backgroundColor: 'transparent',
      color: colors.textPrimary,
      border: `2px solid ${colors.border}`,
      cursor: 'pointer',
      fontWeight: '700',
      transition: '0.3s ease'
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <h1 style={styles.errorCode}>404</h1>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: colors.contentBg,
          padding: '5px'
        }}>
          <AlertTriangle size={40} color="#f59e0b" />
        </div>
      </div>

      <h2 style={styles.title}>Halaman Tidak Ditemukan</h2>
      <p style={styles.description}>
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan ke alamat lain.
      </p>

      <div style={styles.buttonGroup}>
        <button 
          style={styles.btnBack} 
          onClick={() => navigate(-1)}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        
        <button 
          style={styles.btnHome} 
          onClick={() => navigate('/')}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Home size={18} /> Beranda
        </button>
      </div>

      <style>{`
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        h1 { animation: floating 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default NotFound;