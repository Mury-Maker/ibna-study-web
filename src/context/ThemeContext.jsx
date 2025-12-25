import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Pengaturan warna dengan kontras yang lebih kuat
  const colors = {
    // SIDEBAR: Mode Terang sekarang pakai Abu-abu Medium (#D1D5DB) agar terlihat beda dengan konten
    sidebarBg: isDarkMode ? '#0F172A' : '#CBD5E1', 
    
    // CONTENT: Background utama tetap Putih di mode terang
    contentBg: isDarkMode ? '#020617' : '#FFFFFF',
    
    // CARD & NAVBAR: Mengikuti background konten
    cardBg: isDarkMode ? '#1E293B' : '#FFFFFF',
    navbarBg: isDarkMode ? '#1E293B' : '#FFFFFF',
    
    // TEKS: Dibuat sangat kontras (Hitam pekat di mode terang)
    textPrimary: isDarkMode ? '#F9FAFB' : '#111827',
    textMuted: isDarkMode ? '#9CA3AF' : '#4B5563',
    
    // BRAND & BORDER: Border lebih tegas di mode terang
    border: isDarkMode ? '#334155' : '#9CA3AF',
    primary: '#0B3D59',  // Navy Logo IBNA
    secondary: '#E6A33E' // Gold Logo IBNA
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);