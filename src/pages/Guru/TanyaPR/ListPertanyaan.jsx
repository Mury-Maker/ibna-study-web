import React, { useState, useEffect } from 'react';
import { Search, Loader2, ChevronRight, Clock, User, ChevronLeft } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const ListPertanyaan = ({ daftarPR, loading, onSelect, statusFilter, setStatusFilter }) => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset ke halaman 1 jika filter atau search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const styles = {
    topActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap', width: '100%' },
    searchGroup: { 
      display: 'flex', 
      alignItems: 'center', 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '8px', 
      padding: '10px 15px', 
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
    }),
    paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', paddingBottom: '20px' },
    pageBtn: { 
      padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, 
      backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: 'pointer',
      display: 'flex', alignItems: 'center', transition: '0.2s'
    }
  };

  // --- LOGIC: SORTING (TERBARU) & FILTERING ---
  const processedData = [...daftarPR]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(item => 
      (statusFilter === "Semua" || item.status === statusFilter) && 
      item.namaSiswa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // --- LOGIC: PAGINATION ---
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentItems = processedData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      <div style={styles.topActions}>
        <div style={styles.searchGroup}>
          <Search size={18} color={colors.textMuted} />
          <input 
            placeholder="Cari nama siswa..." 
            style={{ background: 'none', border: 'none', outline: 'none', color: colors.textPrimary, marginLeft: '10px', width: '100%', fontSize: '14px' }} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div style={styles.filterContainer}>
          {["Semua", "Menunggu", "Terjawab"].map((s) => (
            <button key={s} style={styles.filterBtn(statusFilter === s)} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin" color={colors.primary} /></div>
        ) : currentItems.length > 0 ? (
          currentItems.map((item) => (
            <div 
              key={item.id} 
              style={styles.card} 
              onClick={() => onSelect(item)} 
              onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary} 
              onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {item.namaSiswa?.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ color: colors.textPrimary, margin: 0, fontSize: '15px', fontWeight: '700' }}>{item.namaSiswa}</h4>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>{item.nama_kelas} • {item.jenjang}</span>
                  </div>
                </div>
                <span style={styles.badgeStatus(item.status)}>{item.status}</span>
              </div>

              {/* JUDUL PERTANYAAN */}
              <h3 style={{ color: colors.textPrimary, margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800' }}>
                {item.judulPertanyaan || item.judulPR || "Tanpa Judul"}
              </h3>

              {/* DESKRIPSI SINGKAT */}
              <p style={{ 
                color: colors.textMuted, 
                fontSize: '13.5px', 
                margin: '0 0 15px 0', 
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {item.deskripsiPR || item.pertanyaan}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: '12px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <div style={{ color: colors.primary, fontSize: '13px', fontWeight: '700', display:'flex', alignItems:'center', gap:'5px' }}>
                  Detail <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
            Tidak ada pertanyaan ditemukan.
          </div>
        )}
      </div>

      {/* --- UI PAGINATION --- */}
      {!loading && totalPages > 1 && (
        <div style={styles.paginationContainer}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <span style={{ color: colors.textPrimary, fontWeight: '700', fontSize: '14px' }}>
            {currentPage} / {totalPages}
          </span>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ListPertanyaan;