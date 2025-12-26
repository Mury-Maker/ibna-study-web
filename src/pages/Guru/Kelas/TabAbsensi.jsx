import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Save } from 'lucide-react';

const TabAbsensi = () => {
  const { colors, isDarkMode } = useTheme();

  return (
    <div style={{ backgroundColor: colors.cardBg, padding: '24px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
        <select style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary }}>
          <option>Timestamp</option>
        </select>
        <button style={{ backgroundColor: isDarkMode ? '#60A5FA' : colors.primary, color: '#fff', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
          Simpan
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: '13px', color: colors.textMuted }}>
              <th style={{ padding: '12px', border: `1px solid ${colors.border}` }}>No</th>
              <th style={{ padding: '12px', border: `1px solid ${colors.border}` }}>Nama</th>
              <th style={{ padding: '12px', border: `1px solid ${colors.border}` }}>jumlah absensi</th>
              <th style={{ padding: '12px', border: `1px solid ${colors.border}` }}>Absensi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', border: `1px solid ${colors.border}` }}>1</td>
              <td style={{ padding: '12px', border: `1px solid ${colors.border}` }}>Siswa Contoh</td>
              <td style={{ padding: '12px', border: `1px solid ${colors.border}` }}>0</td>
              <td style={{ padding: '12px', border: `1px solid ${colors.border}` }}>
                <input type="checkbox" /> Hadir
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabAbsensi;