import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PlusCircle, FileText, ClipboardList, Edit3, Trash2 } from 'lucide-react';
import { db } from '../../../api/firebase';
import { ref, onValue, remove } from 'firebase/database';
import FormBuatUjian from './FormBuatUjian'; // Import form khusus ujian pilgan

const TabUjian = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [daftarUjian, setDaftarUjian] = useState([]);
  const [selectedUjian, setSelectedUjian] = useState(null);

  useEffect(() => {
    if (!kelasId) return;
    
    // Ambil data ujian khusus kelas ini dari Firebase
    const ujianRef = ref(db, `UjianPerbulan/${kelasId}`);
    const unsubscribe = onValue(ujianRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setDaftarUjian(list);
      } else { 
        setDaftarUjian([]); 
      }
    });
    
    return () => unsubscribe();
  }, [kelasId]);

  const handleDelete = (id) => {
    if (window.confirm("Hapus data ujian ini? File soal dan kunci jawaban akan terhapus permanen.")) {
      remove(ref(db, `UjianPerbulan/${kelasId}/${id}`));
    }
  };

  const handleEdit = (ujian) => {
    setSelectedUjian(ujian);
    setIsCreating(true);
  };

  const styles = {
    container: { color: colors.textPrimary, animation: 'fadeIn 0.3s ease' },
    headerSection: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '25px', 
      flexWrap: 'wrap', 
      gap: '15px' 
    },
    title: { margin: 0, fontSize: '20px', fontWeight: '800', color: colors.textPrimary },
    addButton: {
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      backgroundColor: colors.primary, 
      color: '#ffffff',
      padding: '10px 18px', 
      borderRadius: '10px', 
      border: 'none', 
      cursor: 'pointer', 
      fontSize: '14px',
      fontWeight: '700', 
      transition: '0.2s', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    card: {
      backgroundColor: colors.cardBg, 
      padding: '18px 20px', 
      borderRadius: '16px', 
      border: `1px solid ${colors.border}`,
      marginBottom: '15px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      transition: '0.2s'
    },
    iconBox: { 
      padding: '12px', 
      borderRadius: '12px', 
      backgroundColor: colors.primary + '15', 
      color: colors.primary 
    },
    actionBtn: {
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: '0.2s'
    }
  };

  if (isCreating) {
    return (
      <FormBuatUjian 
        kelasId={kelasId} 
        onBack={() => { 
          setIsCreating(false); 
          setSelectedUjian(null); 
        }}
        editData={selectedUjian}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h3 style={styles.title}>Ujian Perbulan ({kelasId})</h3>
        <button style={styles.addButton} onClick={() => setIsCreating(true)}>
          <PlusCircle size={18} /> Buat Ujian Baru
        </button>
      </div>

      {daftarUjian.length > 0 ? (
        daftarUjian.map((item) => (
          <div key={item.id} style={styles.card} className="ujian-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={styles.iconBox}>
                <ClipboardList size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{item.judul}</h4>
                <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px', display: 'flex', gap: '10px' }}>
                   <span>{item.pertanyaan?.length || 0} Nomor Pilgan</span>
                   <span>•</span>
                   <span>Skor Maks: {item.poinMaksimal}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleEdit(item)} 
                style={{ ...styles.actionBtn, border: `1px solid ${colors.border}`, background: 'none', color: colors.textPrimary }}
                title="Edit Ujian"
              >
                <Edit3 size={18}/>
              </button>
              <button 
                onClick={() => handleDelete(item.id)} 
                style={{ ...styles.actionBtn, border: 'none', background: '#fee2e2', color: '#ef4444' }}
                title="Hapus Ujian"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px', 
          backgroundColor: colors.cardBg, 
          borderRadius: '16px', 
          border: `2px dashed ${colors.border}` 
        }}>
          <FileText size={48} color={colors.textMuted} style={{ marginBottom: '15px', opacity: 0.5 }} />
          <p style={{ color: colors.textMuted, fontSize: '15px', fontWeight: '500' }}>
            Belum ada ujian bulanan yang dijadwalkan.
          </p>
        </div>
      )}

      <style>{`
        .ujian-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.05);
          border-color: ${colors.primary}40 !important;
        }
      `}</style>
    </div>
  );
};

export default TabUjian;