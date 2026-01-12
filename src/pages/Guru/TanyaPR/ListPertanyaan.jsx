import React, { useState } from 'react';
import { Search, Loader2, ChevronRight, Clock, User } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const ListPertanyaan = ({ daftarPR, loading, onSelect, statusFilter, setStatusFilter }) => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  const styles = {
    topActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap', width: '100%' },
    // Search Group Sinkron
    searchGroup: { 
      display: 'flex', 
      alignItems: 'center', 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '8px', 
      padding: '10px 15px', // Padding diseragamkan
      flex: 1, 
      minWidth: '280px', 
      boxSizing: 'border-box'
    },
    filterContainer: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' },
    filterBtn: (isActive) => ({
      padding: '8px 16px', borderRadius: '8px', border: `1px solid ${isActive ? colors.primary : colors.border}`,
      backgroundColor: isActive ? colors.primary : 'transparent', color: isActive ? '#fff' : colors.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap'
    }),
    card: { backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '20px', marginBottom: '15px', cursor: 'pointer', width: '100%', boxSizing: 'border-box', transition: '0.3s' },
    badgeStatus: (status) => ({
      padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
      backgroundColor: status === 'Terjawab' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      color: status === 'Terjawab' ? '#16a34a' : '#f59e0b',
      border: `1px solid ${status === 'Terjawab' ? '#16a34a' : '#f59e0b'}`
    })
  };

  const filtered = daftarPR.filter(item => (statusFilter === "Semua" || item.status === statusFilter) && item.namaSiswa?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      <div style={styles.topActions}>
        <div style={styles.searchGroup}>
          <Search size={18} color={colors.textMuted} />
          <input placeholder="Cari nama siswa..." style={{ background: 'none', border: 'none', outline: 'none', color: colors.textPrimary, marginLeft: '10px', width: '100%', fontSize: '14px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div style={styles.filterContainer}>
          {["Semua", "Menunggu", "Terjawab"].map((s) => (
            <button key={s} style={styles.filterBtn(statusFilter === s)} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? <div style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin" color={colors.primary} /></div> : filtered.map((item) => (
          <div key={item.id} style={styles.card} onClick={() => onSelect(item)} onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary} onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{item.namaSiswa?.charAt(0)}</div>
                <div><h4 style={{ color: colors.textPrimary, margin: 0, fontSize: '15px', fontWeight: '700' }}>{item.namaSiswa}</h4><span style={{ fontSize: '12px', color: colors.textMuted }}>{item.nama_kelas} • {item.jenjang}</span></div>
              </div>
              <span style={styles.badgeStatus(item.status)}>{item.status}</span>
            </div>
            <p style={{ color: colors.textPrimary, fontSize: '14px', margin: '0 0 15px 0' }}>{item.pertanyaan}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: '12px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(item.createdAt).toLocaleTimeString()}</span>
              <div style={{ color: colors.primary, fontSize: '13px', fontWeight: '700', display:'flex', alignItems:'center', gap:'5px' }}>Detail <ChevronRight size={16} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListPertanyaan;