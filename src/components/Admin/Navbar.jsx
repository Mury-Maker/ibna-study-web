import React, { useState, useEffect } from 'react';
import { Bell, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../api/firebase'; 
import { ref, onValue, get, update } from 'firebase/database';

const Navbar = ({ onMenuClick, showHamburger }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigate = useNavigate();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Catatan: Jika tabel notifikasi Admin berbeda (misal: "NotifikasiAdmin"), 
      // silakan ubah path "Notifikasi/${user.uid}" di bawah ini.
      const notifRef = ref(db, `Notifikasi/${user.uid}`);
      const unsubscribe = onValue(notifRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Hanya mendeteksi data yang memiliki isRead === false
          const unreadExists = Object.values(data).some(n => n.isRead === false);
          setHasUnread(unreadExists);
        } else {
          setHasUnread(false);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleNotificationOpen = async () => {
    // 1. Arahkan ke route notifikasi Admin
    navigate('/Admin/Notifikasi');

    // 2. Ubah status isRead di database agar titik merah hilang
    const user = auth.currentUser;
    if (user) {
      const notifRef = ref(db, `Notifikasi/${user.uid}`);
      const snapshot = await get(notifRef);
      
      if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((child) => {
          if (child.val().isRead === false) {
            updates[`${child.key}/isRead`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          update(notifRef, updates);
        }
      }
    }
  };

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

          {/* Tombol Notifikasi */}
          <button 
            style={styles.btn} 
            onClick={handleNotificationOpen} 
            title="Lihat Notifikasi"
          >
            <Bell size={22} color={colors.textPrimary} />
            {/* Titik merah hanya dirender jika hasUnread bernilai true */}
            {hasUnread && <div style={styles.badge} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;