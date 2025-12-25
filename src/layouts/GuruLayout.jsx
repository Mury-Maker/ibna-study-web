import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Guru/Sidebar';
import Navbar from '../components/Guru/Navbar';
import { useTheme } from '../context/ThemeContext';

const GuruLayout = ({ children, title }) => {
  const { colors } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: colors.contentBg, // Paksa background gelap di sini
      position: 'relative'
    }}>
      <Sidebar isOpen={isSidebarOpen} isMobile={isMobile} toggleSidebar={() => setIsSidebarOpen(false)} />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: isMobile ? '0' : '280px', // Angka harus sama persis dengan lebar Sidebar
        backgroundColor: colors.contentBg, // Pastikan background konten sama
        minWidth: 0 // Mencegah konten meluber
      }}>
        <Navbar showHamburger={isMobile} onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Tambahkan background-color di main agar menutupi sela bawah */}
        <main style={{ 
          padding: '25px', 
          backgroundColor: colors.contentBg, 
          flex: 1 
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: colors.textPrimary }}>
            {title}
          </h2>
          {children}
        </main>
      </div>
    </div>
  );
};

export default GuruLayout;