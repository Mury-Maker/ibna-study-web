import React, { useState, useEffect } from 'react';
import { 
  User, LayoutDashboard, Calendar, Users, 
  FileText, MessageSquare, PlusCircle, X, LogOut, ChevronDown, ChevronRight 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { auth, db } from '../../api/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import logoSidebar from '../../assets/logoSidebar.png';

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, colors } = useTheme();
  
  const [isKelasOpen, setIsKelasOpen] = useState(false);
  const [daftarKelas, setDaftarKelas] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const kelasRef = query(ref(db, 'Kelas'), orderByChild('teacherId'), equalTo(user.uid));
        onValue(kelasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setDaftarKelas(list);
          }
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari IBNA STUDY?")) {
      await signOut(auth);
      navigate('/Login');
    }
  };

  const styles = {
    sidebar: { 
      width: '280px', height: '100vh', position: 'fixed', top: 0, left: 0,
      backgroundColor: colors.sidebarBg, borderRight: `1px solid ${colors.border}`,
      transform: isOpen || !isMobile ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'all 0.3s ease', zIndex: 100, display: 'flex', flexDirection: 'column'
    },
    menuItem: (isActive) => ({ 
      display: 'flex', alignItems: 'center', padding: '12px 16px', margin: '4px 12px', 
      borderRadius: '8px', cursor: 'pointer', transition: '0.2s',
      backgroundColor: isActive ? colors.primary : 'transparent',
      color: isActive ? '#FFF' : colors.textPrimary
    }),
    // FIX: subMenuItem disamakan stylenya agar konsisten
    subMenuItem: (isActive) => ({
      display: 'flex', alignItems: 'center', padding: '10px 16px 10px 48px', margin: '2px 12px',
      borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: '0.2s',
      backgroundColor: isActive ? colors.primary : 'transparent',
      color: isActive ? '#FFF' : colors.textMuted,
      fontWeight: isActive ? '700' : '400'
    })
  };

  // Helper NavLink dengan Ikon Kuning saat aktif
  const NavLink = ({ path, icon, name }) => {
    const isActive = location.pathname === path;
    return (
      <div style={styles.menuItem(isActive)} onClick={() => { navigate(path); if(isMobile) toggleSidebar(); }}>
        <div style={{ marginRight: '12px', color: isActive ? colors.secondary : colors.textMuted }}>
          {icon}
        </div>
        <span style={{ fontWeight: isActive ? '600' : '400' }}>{name}</span>
      </div>
    );
  };

  return (
    <>
      {isMobile && isOpen && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 90 }} onClick={toggleSidebar} />}
      
      <aside style={styles.sidebar}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${colors.border}`, marginBottom: '10px' }}>
          <img src={logoSidebar} alt="Logo" style={{ height: '120%', filter: isDarkMode ? 'drop-shadow(0 0 2px #fff)' : 'none' }} />
          {isMobile && <button onClick={toggleSidebar} style={{ marginLeft: 'auto', background: 'none', border: 'none' }}><X color={colors.textPrimary} size={24} /></button>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <NavLink path="/Admin/Profile" icon={<User size={20} />} name="Profile" />
          <NavLink path="/Admin/Dashboard" icon={<LayoutDashboard size={20} />} name="Dashboard" />
          <NavLink path="/Admin/Kelas" icon={<Calendar size={20} />} name="Kelas" />
          <NavLink path="/Admin/PaketLes" icon={<FileText size={20} />} name="Paket Les" />
          <NavLink path="/Admin/Jadwal" icon={<MessageSquare size={20} />} name="Jadwal Les" />
          <NavLink path="/Admin/Mapel" icon={<PlusCircle size={20} />} name="Mapel" />
        </div>

        <button 
          style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', margin: '20px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: '600', cursor: 'pointer' }} 
          onClick={handleLogout}
        >
          <LogOut size={20} style={{ marginRight: '12px' }} /> <span>Keluar Aplikasi</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;