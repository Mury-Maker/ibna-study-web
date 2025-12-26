import React from 'react';
import { Bell, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Navbar = ({ onMenuClick, showHamburger }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigate = useNavigate(); // Inisialisasi navigate

  const styles = {
    navbar: { 
      height: '64px', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 20px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 10,
      backgroundColor: colors.navbarBg, 
      borderBottom: `1px solid ${colors.border}`,
      margin: 0
    },
    navContent: { display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
    rightActions: { display: 'flex', alignItems: 'center', gap: '20px' },
    btn: { background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' },
    themeBtn: { 
      background: 'none', 
      border: 'none', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '8px', 
      borderRadius: '50%', 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      transition: '0.3s ease'
    },
    badge: { 
      position: 'absolute', 
      top: '-2px', 
      right: '-2px', 
      width: '8px', 
      height: '8px', 
      backgroundColor: '#EF4444', 
      borderRadius: '50%', 
      border: `1.5px solid ${colors.navbarBg}` 
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        {showHamburger ? (
          <button style={styles.btn} onClick={onMenuClick}>
            <Menu size={24} color={colors.textPrimary} />
          </button>
        ) : <div />}
        
        <div style={styles.rightActions}>
          {/* Tombol Ganti Tema */}
          <button style={styles.themeBtn} onClick={toggleTheme} title="Ganti Tema">
            {isDarkMode ? <Sun size={20} color={colors.secondary} /> : <Moon size={20} color={colors.textMuted} />}
          </button>

          {/* Tombol Notifikasi - Sekarang menuju ke halaman Notifikasi */}
          <button 
            style={styles.btn} 
            onClick={() => navigate('/Guru/Notifikasi')} // Arahkan ke route notifikasi
            title="Lihat Notifikasi"
          >
            <Bell size={22} color={colors.textPrimary} />
            <div style={styles.badge} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;