import React from 'react';
import { 
  User, LayoutDashboard, Calendar, Users, 
  FileText, MessageSquare, PlusCircle, X, LogOut 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../api/firebase';
import { signOut } from 'firebase/auth';
import logoSidebar from '../../assets/logoSidebar.png';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, colors } = useTheme();

  // Fungsi Logout dengan Konfirmasi
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari IBNA STUDY?");
    if (confirmLogout) {
      try {
        await signOut(auth);
        navigate('/Login');
      } catch (error) {
        alert("Gagal keluar: " + error.message);
      }
    }
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

  // Styles didefinisikan di dalam agar responsif terhadap tema
  const styles = {
    sidebar: { 
      width: '280px', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      left: 0,
      backgroundColor: colors.sidebarBg, 
      borderRight: `1px solid ${colors.border}`,
      transform: isOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'all 0.3s ease', 
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column' // Mengaktifkan layout kolom
    },
    overlay: { 
      position: 'fixed', 
      inset: 0, 
      backgroundColor: 'rgba(0,0,0,0.4)', 
      zIndex: 90 
    },
    logoArea: { 
      height: '64px', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 20px', 
      marginBottom: '10px',
      borderBottom: `1px solid ${colors.border}` // Garis pembatas logo
    },
    sidebarLogo: { 
      height: '120%', 
      width: 'auto', 
      filter: isDarkMode //? 'brightness(1.5)' : 'none' 
        ? 'drop-shadow(0 0 2px #ffffff)'
        : 'drop-shadow(0 0 0px #000000)'
    },
    menuContainer: {
      flex: 1, // Mengambil ruang utama
      overflowY: 'auto',
      paddingTop: '10px'
    },
    menuItem: { 
      display: 'flex', 
      alignItems: 'center', 
      padding: '12px 16px', 
      margin: '4px 12px', 
      borderRadius: '8px', 
      cursor: 'pointer',
      transition: '0.2s'
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      margin: '20px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
      color: '#EF4444', // Warna merah standar logout
      fontWeight: '600',
      transition: '0.2s'
    }
  };

  return (
    <>
      {isMobile && isOpen && <div style={styles.overlay} onClick={toggleSidebar} />}
      
      <aside style={styles.sidebar}>
        {/* Logo Section */}
        <div style={styles.logoArea}>
          <img src={logoSidebar} alt="Logo" style={styles.sidebarLogo} />
          {isMobile && (
            <button onClick={toggleSidebar} style={{marginLeft: 'auto', background: 'none', border: 'none'}}>
              <X color={colors.textPrimary} size={24} />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <div style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <div 
                key={index} 
                style={{
                  ...styles.menuItem, 
                  backgroundColor: isActive ? colors.primary : 'transparent'
                }} 
                onClick={() => {
                  navigate(item.path);
                  if(isMobile) toggleSidebar();
                }}
              >
                <div style={{marginRight: '12px', color: isActive ? colors.secondary : colors.textMuted}}>
                  {item.icon}
                </div>
                <span style={{
                  color: isActive ? '#FFF' : colors.textPrimary, 
                  fontWeight: isActive ? '600' : '400'
                }}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Logout Section - Selalu di dasar */}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} style={{ marginRight: '12px' }} />
          <span>Keluar Aplikasi</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;