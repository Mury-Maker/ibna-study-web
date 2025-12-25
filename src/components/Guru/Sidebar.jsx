import React from 'react';
import { User, LayoutDashboard, Calendar, Users, FileText, MessageSquare, PlusCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import logoSidebar from '../../assets/logoSidebar.png';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, colors } = useTheme();

  // PINDAHKAN STYLES KE DALAM AGAR TEMA BISA BERUBAH
  const styles = {
    sidebar: { 
      width: '280px', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      backgroundColor: colors.sidebarBg, // Sekarang ini akan berubah!
      borderRight: `1px solid ${colors.border}`,
      transform: isOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
      left: isOpen || !isMobile ? '0' : '-280px',
      transition: 'all 0.3s ease',
      zIndex: 100 
    },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 90 },
    
    // AREA LOGO DENGAN GARIS BAWAH
    logoArea: { 
      height: '64px', 
      display: 'flex', 
      alignItems: 'center', 
      justifycontent: 'left',
      padding: '0 20px', 
      marginBottom: '10px',
      borderBottom: `1px solid ${colors.border}` // GARIS BAWAH LOGO
    },
    
    sidebarLogo: { width: 'auto', height: '120%', maxWidth: '100%', objectFit: 'contain' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' },
    menuList: { display: 'flex', flexDirection: 'column' },
    menuItem: { display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', transition: '0.2s' }
  };

  const menuItems = [
    { name: 'Profile', icon: <User size={20} />, path: '/Guru/Profile' },
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/Guru/Dashboard' },
    { name: 'Jadwal', icon: <Calendar size={20} />, path: '/Guru/Jadwal' },
    { name: 'Kelas', icon: <Users size={20} />, path: '/Guru/Kelas' },
    { name: 'Rekap Nilai', icon: <FileText size={20} />, path: '/Guru/Rekap-Nilai' },
    { name: 'Tanya PR', icon: <MessageSquare size={20} />, path: '/Guru/Tanya-PR' },
    { name: 'Tambahan Belajar', icon: <PlusCircle size={20} />, path: '/Guru/Tambahan-Belajar' },
  ];

  return (
    <>
      {isMobile && isOpen && <div style={styles.overlay} onClick={toggleSidebar} />}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <img 
            src={logoSidebar} 
            alt="IBNA STUDY" 
            style={{...styles.sidebarLogo, filter: isDarkMode ? 'brightness(1.5)' : 'none'}} 
          />
          {isMobile && <button style={styles.closeBtn} onClick={toggleSidebar}><X size={24} color={colors.textPrimary} /></button>}
        </div>

        <div style={styles.menuList}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={index} 
                style={{
                  ...styles.menuItem, 
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  margin: '4px 12px',
                  borderRadius: '8px'
                }}
                onClick={() => { navigate(item.path); if(isMobile) toggleSidebar(); }}>
                <div style={{marginRight: '12px', color: isActive ? colors.secondary : colors.textMuted}}>{item.icon}</div>
                <span style={{color: isActive ? '#FFF' : colors.textPrimary, fontSize: '15px', fontWeight: isActive ? '600' : '500'}}>{item.name}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;