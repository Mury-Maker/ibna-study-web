import React, { useState } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { MessageSquare, Image as ImageIcon, Send, Search, CheckCircle2, Clock } from 'lucide-react';

const TanyaPR = () => {
  const { colors, isDarkMode } = useTheme();
  const [filter, setFilter] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");

  // Data Dummy Pertanyaan PR dari Siswa
  const daftarPR = [
    {
      id: 1,
      siswa: "Aditya Pratama",
      kelas: "XII-IPA-1",
      mapel: "Matematika",
      pertanyaan: "Bagaimana cara menyelesaikan soal logaritma dengan basis yang berbeda?",
      status: "Belum Dijawab",
      waktu: "10 Menit yang lalu",
      hasImage: true
    },
    {
      id: 2,
      siswa: "Budi Santoso",
      kelas: "XII-IPA-2",
      mapel: "Fisika",
      pertanyaan: "Mohon penjelasan tentang hukum kekekalan energi mekanik pada bidang miring.",
      status: "Sudah Dijawab",
      waktu: "2 Jam yang lalu",
      hasImage: false
    }
  ];

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    topActions: {
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
      borderRadius: '8px',
      padding: '8px 15px',
      minWidth: '300px'
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      marginBottom: '15px',
      transition: '0.3s'
    },
    badgeStatus: (status) => ({
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      backgroundColor: status === "Sudah Dijawab" ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      color: status === "Sudah Dijawab" ? '#16a34a' : '#f59e0b',
      border: `1px solid ${status === "Sudah Dijawab" ? '#16a34a' : '#f59e0b'}`
    }),
    replyBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: colors.primary,
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
    }
  };

  return (
    <GuruLayout title="Tanya PR Siswa">
      <div style={styles.container}>
        
        {/* Header & Filter */}
        <div style={styles.topActions}>
          <div style={styles.searchGroup}>
            <Search size={18} color={colors.textMuted} />
            <input 
              placeholder="Cari PR atau siswa..." 
              style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', color: colors.textPrimary, marginLeft: '10px', width: '100%' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {["Semua", "Belum Dijawab", "Sudah Dijawab"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${filter === f ? colors.primary : colors.border}`,
                  backgroundColor: filter === f ? colors.primary : 'transparent',
                  color: filter === f ? '#fff' : colors.textMuted,
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: '0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List Pertanyaan PR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {daftarPR
            .filter(item => (filter === "Semua" || item.status === filter))
            .filter(item => item.siswa.toLowerCase().includes(searchTerm.toLowerCase()) || item.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((pr) => (
            <div key={pr.id} style={styles.card} className="pr-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {pr.siswa.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: colors.textPrimary, fontSize: '15px' }}>{pr.siswa}</h4>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>{pr.kelas} • {pr.mapel}</span>
                  </div>
                </div>
                <span style={styles.badgeStatus(pr.status)}>{pr.status}</span>
              </div>

              <p style={{ color: colors.textPrimary, fontSize: '14px', lineHeight: '1.6', margin: '0 0 15px 0' }}>
                {pr.pertanyaan}
              </p>

              {pr.hasImage && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', color: colors.primary, marginBottom: '15px', cursor: 'pointer', fontSize: '12px' }}>
                  <ImageIcon size={16} /> Lihat Lampiran Foto
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: '12px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {pr.waktu}
                </span>
                
                <button style={styles.replyBtn} onClick={() => alert(`Menjawab PR ${pr.siswa}`)}>
                  <MessageSquare size={16} />
                  {pr.status === "Sudah Dijawab" ? "Edit Jawaban" : "Berikan Jawaban"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .pr-card:hover { border-color: ${colors.primary}; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      `}</style>
    </GuruLayout>
  );
};

export default TanyaPR;