import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import GuruLayout from '../../../layouts/GuruLayout';
import { useTheme } from '../../../context/ThemeContext';

// Import komponen tab
import TabMapel from './TabMapel';
import TabAbsensi from './TabAbsensi';
import TabAnggota from './TabAnggota';
import TabUjian from './TabUjian'; 

const KelasDetail = () => {
  const { kelasId } = useParams();
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('Mapel');

  const styles = {
    tabHeader: {
      display: 'flex',
      gap: '25px',
      borderBottom: `2px solid ${colors.border}`,
      marginBottom: '25px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      paddingBottom: '2px'
    },
    tabItem: (isActive) => ({
      padding: '12px 5px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '700',
      color: isActive ? (isDarkMode ? '#60A5FA' : colors.primary) : colors.textMuted,
      borderBottom: isActive ? `3px solid ${isDarkMode ? '#60A5FA' : colors.primary}` : '3px solid transparent',
      transition: '0.2s',
      flexShrink: 0,
      userSelect: 'none'
    })
  };

  const menuTabs = [
    { id: 'Mapel', label: 'Mapel' },
    { id: 'Absensi', label: 'Absensi' },
    { id: 'Anggota', label: 'Anggota' },
    { id: 'Ujian', label: 'Ujian Perbulan' }
  ];

  return (
    <GuruLayout title={`Kelas ${kelasId} (SMA)`}>
      <div style={styles.tabHeader}>
        {menuTabs.map((tab) => (
          <div 
            key={tab.id} 
            style={styles.tabItem(activeTab === tab.id)} 
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div style={{ width: '100%' }}>
        {activeTab === 'Mapel' && <TabMapel kelasId={kelasId} />}
        {activeTab === 'Absensi' && <TabAbsensi />}
        {activeTab === 'Anggota' && <TabAnggota />}
        {activeTab === 'Ujian' && <TabUjian kelasId={kelasId} />}
      </div>
    </GuruLayout>
  );
};

export default KelasDetail;