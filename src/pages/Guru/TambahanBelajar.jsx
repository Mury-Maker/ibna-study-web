import React, { useState } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  MessageCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

const TambahanBelajar = () => {
  const { colors, isDarkMode } = useTheme();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reason, setReason] = useState("");
  
  // STATE FILTER
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");

  const [daftarPengajuan, setDaftarPengajuan] = useState([
    {
      id: 1,
      siswa: "Aditya Pratama",
      kelas: "XII-IPA-1",
      mapel: "Matematika",
      jamDiminta: "15:30 - 17:00",
      tglDiminta: "28 Des 2025",
      pesan: "Minta bahas ulang materi Logaritma yang kemarin belum paham prof.",
      status: "Pending"
    },
    {
      id: 2,
      siswa: "Budi Santoso",
      kelas: "XII-IPA-2",
      mapel: "Fisika",
      jamDiminta: "14:00 - 15:00",
      tglDiminta: "29 Des 2025",
      pesan: "Persiapan remedial ujian harian gerak lurus.",
      status: "Approved"
    },
    {
      id: 3,
      siswa: "Citra Lestari",
      kelas: "XII-IPA-1",
      mapel: "Biologi",
      jamDiminta: "10:00 - 11:00",
      tglDiminta: "30 Des 2025",
      pesan: "Konsultasi tugas praktikum.",
      status: "Rejected",
      alasan: "Jam tersebut saya ada rapat guru. Silakan ajukan di jam 13:00."
    }
  ]);

  const handleAction = (id, newStatus, rejectionReason = "") => {
    setDaftarPengajuan(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus, alasan: rejectionReason } : item
    ));
    setSelectedRequest(null);
    setReason("");
  };

  // LOGIKA FILTERING
  const filteredData = daftarPengajuan.filter(item => {
    const matchStatus = statusFilter === "Semua" || item.status === statusFilter;
    const matchSearch = item.siswa.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    filterSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
      gap: '15px',
      flexWrap: 'wrap'
    },
    searchGroup: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      padding: '8px 15px',
      minWidth: '280px',
      flex: 1
    },
    filterTabs: {
      display: 'flex',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      padding: '5px',
      borderRadius: '10px',
      gap: '5px'
    },
    tabBtn: (isActive) => ({
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      backgroundColor: isActive ? colors.cardBg : 'transparent',
      color: isActive ? colors.primary : colors.textMuted,
      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      transition: '0.2s'
    }),
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      padding: '20px',
      marginBottom: '15px',
    },
    badgeStatus: (status) => ({
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      backgroundColor: status === 'Approved' ? 'rgba(22, 163, 74, 0.1)' : status === 'Rejected' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      color: status === 'Approved' ? '#16a34a' : status === 'Rejected' ? '#dc2626' : '#f59e0b',
      border: `1px solid ${status === 'Approved' ? '#16a34a' : status === 'Rejected' ? '#dc2626' : '#f59e0b'}`
    }),
    modal: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }
  };

  return (
    <GuruLayout title="Pengajuan Jam Belajar Tambahan">
      <div style={styles.container}>
        
        {/* SECTION FILTER & SEARCH */}
        <div style={styles.filterSection}>
          <div style={styles.searchGroup}>
            <Search size={18} color={colors.textMuted} />
            <input 
              placeholder="Cari nama siswa..." 
              style={{ background: 'none', border: 'none', outline: 'none', color: colors.textPrimary, marginLeft: '10px', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={styles.filterTabs}>
            {["Semua", "Pending", "Approved", "Rejected"].map((status) => (
              <button 
                key={status}
                style={styles.tabBtn(statusFilter === status)}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* LIST PENGAJUAN */}
        {filteredData.length > 0 ? filteredData.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} />
                </div>
                <div>
                  <h4 style={{ color: colors.textPrimary, margin: 0, fontSize: '15px' }}>{item.siswa}</h4>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>{item.kelas} • {item.mapel}</span>
                </div>
              </div>
              <span style={styles.badgeStatus(item.status)}>{item.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textPrimary, fontSize: '13px' }}>
                <Calendar size={16} color={colors.primary} /> {item.tglDiminta}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textPrimary, fontSize: '13px' }}>
                <Clock size={16} color={colors.primary} /> {item.jamDiminta}
              </div>
            </div>

            <p style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '15px' }}>
              <MessageCircle size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> {item.pesan}
            </p>

            {item.status === "Pending" && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={{ flex: 1, backgroundColor: '#16a34a', color: '#fff', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  onClick={() => handleAction(item.id, 'Approved')}
                >
                  Terima
                </button>
                <button 
                  style={{ flex: 1, backgroundColor: '#dc2626', color: '#fff', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  onClick={() => setSelectedRequest(item)}
                >
                  Tolak / Saran Jam
                </button>
              </div>
            )}

            {item.status === "Rejected" && item.alasan && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>Alasan Guru:</span>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: colors.textPrimary }}>{item.alasan}</p>
              </div>
            )}
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '50px', color: colors.textMuted }}>
            <Filter size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>Tidak ada pengajuan ditemukan.</p>
          </div>
        )}

        {/* MODAL PENOLAKAN (SAMA SEPERTI SEBELUMNYA) */}
        {selectedRequest && (
          <div style={styles.modal}>
            <div style={{ backgroundColor: colors.cardBg, padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
              <h3 style={{ color: colors.textPrimary, marginTop: 0 }}>Tolak / Beri Saran Jam</h3>
              <textarea 
                placeholder="Tulis alasan atau saran jam belajar..."
                style={{ width: '100%', height: '100px', borderRadius: '8px', padding: '10px', backgroundColor: colors.contentBg, color: colors.textPrimary, border: `1px solid ${colors.border}`, resize: 'none' }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedRequest(null)}>Batal</button>
                <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#fff' }} onClick={() => handleAction(selectedRequest.id, 'Rejected', reason)} disabled={!reason}>Kirim</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </GuruLayout>
  );
};

export default TambahanBelajar;