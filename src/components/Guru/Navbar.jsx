import React, { useState, useEffect } from 'react';
import { Bell, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../api/firebase'; 
import { ref, onValue } from 'firebase/database';

const Navbar = ({ onMenuClick, showHamburger }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Listener real-time untuk menghitung notif yang belum dibaca
      const notifRef = ref(db, `Notifikasi/${user.uid}`);
      const unsubscribe = onValue(notifRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const count = Object.values(data).filter(n => n.isRead === false).length;
          setUnreadCount(count);
        } else {
          setUnreadCount(0);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const styles = {
    navbar: { 
      height: '64px', display: 'flex', alignItems: 'center', padding: '0 20px', 
      position: 'sticky', top: 0, zIndex: 10, backgroundColor: colors.navbarBg, 
      borderBottom: `1px solid ${colors.border}`, margin: 0 
    },
    navContent: { display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
    rightActions: { display: 'flex', alignItems: 'center', gap: '20px' },
    btn: { background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' },
    themeBtn: { 
      background: 'none', border: 'none', cursor: 'pointer', display: 'flex', 
      alignItems: 'center', padding: '8px', borderRadius: '50%', 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', transition: '0.3s ease' 
    },
    badge: { 
      position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#EF4444', 
      color: 'white', borderRadius: '50%', fontSize: '10px', minWidth: '18px', height: '18px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px solid ${colors.navbarBg}`, fontWeight: 'bold' 
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
          <button style={styles.themeBtn} onClick={toggleTheme} title="Ganti Tema">
            {isDarkMode ? <Sun size={20} color={colors.secondary} /> : <Moon size={20} color={colors.textMuted} />}
          </button>

          <button style={styles.btn} onClick={() => navigate('/Guru/Notifikasi')} title="Lihat Notifikasi">
            <Bell size={22} color={colors.textPrimary} />
            {unreadCount > 0 && <div style={styles.badge}>{unreadCount}</div>}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;