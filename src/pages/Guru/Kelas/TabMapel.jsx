import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

const TabMapel = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const listMapel = ['Matematika', 'IPA', 'IPS', 'Bahasa', 'PKN'];

  const styles = {
    card: {
      backgroundColor: colors.cardBg,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      marginBottom: '15px'
    }
  };

  return (
    <div>
      {listMapel.map((mapel, idx) => (
        <div key={idx} style={styles.card}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: isDarkMode ? '#60A5FA' : colors.primary }}>
            {mapel}
          </div>
          <p style={{ fontSize: '13px', color: colors.textMuted, marginTop: '5px' }}>
            nama materi / tugas baru - {kelasId}
          </p>
          <div style={{ height: '1px', backgroundColor: colors.border, marginTop: '15px' }} />
        </div>
      ))}
    </div>
  );
};

export default TabMapel;