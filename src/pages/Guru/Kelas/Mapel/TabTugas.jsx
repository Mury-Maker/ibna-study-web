import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ClipboardList, FileText } from 'lucide-react'; 
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, onValue, remove } from 'firebase/database';
import FormBuatKonten from './FormBuatKonten'; 

const TabTugas = ({ mapelId, kelasId }) => {
  const { colors } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [daftarKonten, setDaftarKonten] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Terbit");
  const [selectedData, setSelectedData] = useState(null); // State untuk menyimpan data yang akan diedit

  useEffect(() => {
    if (!mapelId) return;
    const kontenRef = ref(db, 'Konten');
    const unsubscribe = onValue(kontenRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filtered = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(item => item.mapelId === mapelId)
          // Urutkan yang terbaru di atas
          .sort((a, b) => {
            const getTime = (val) => {
              if (!val) return 0;
              if (typeof val === 'number') return val;
              if (typeof val === 'object' && val.seconds) return val.seconds * 1000;
              return new Date(val).getTime() || 0;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
          });
        setDaftarKonten(filtered);
      } else { setDaftarKonten([]); }
    });
    return () => unsubscribe();
  }, [mapelId]);

  // FIX: Fungsi Hapus dengan Konfirmasi
  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus konten ini? Data pengerjaan siswa (jika ada) juga akan terhapus secara permanen.")) {
      remove(ref(db, `Konten/${id}`))
        .then(() => alert("Konten berhasil dihapus."))
        .catch((err) => alert("Gagal menghapus: " + err.message));
    }
  };

  // FIX: Fungsi Edit untuk membuka Form dengan data lama
  const handleEdit = (item) => {
    setSelectedData(item);
    setIsCreating(true);
  };

  // Reset data saat keluar dari form
  const handleBack = () => {
    setIsCreating(false);
    setSelectedData(null);
  };

  if (isCreating) {
    return (
      <FormBuatKonten 
        mapelId={mapelId} 
        kelasId={kelasId} 
        onBack={handleBack} 
        editData={selectedData} // Kirim data lama ke form
      />
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <button 
          style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }} 
          onClick={() => setIsCreating(true)}
        >
          <Plus size={18} /> Buat Kuis / Materi
        </button>

        <div style={{ display: 'flex', backgroundColor: colors.border + '30', padding: '4px', borderRadius: '10px' }}>
          {["Terbit", "Draft"].map(s => (
            <button 
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '8px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                backgroundColor: filterStatus === s ? colors.cardBg : 'transparent',
                color: filterStatus === s ? colors.primary : colors.textMuted,
                transition: '0.2s',
                boxShadow: filterStatus === s ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {s} ({daftarKonten.filter(item => item.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {daftarKonten.filter(item => item.status === filterStatus).length > 0 ? (
        daftarKonten.filter(item => item.status === filterStatus).map((item) => (
          <div key={item.id} style={{ backgroundColor: colors.cardBg, padding: '18px 24px', borderRadius: '16px', border: `1px solid ${colors.border}`, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: (item.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981') + '15', color: item.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981' }}>
                {item.tipeKonten === 'Materi' ? <FileText size={24} /> : <ClipboardList size={24} />}
              </div>
              <div>
                <h4 style={{ color: colors.textPrimary, margin: 0, fontSize: '16px', fontWeight: '800' }}>{item.judul}</h4>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
                  <span style={{ fontWeight: '700', color: colors.primary }}>{item.tipeKonten === 'Tugas' ? 'KUIS' : 'MATERI'}</span>
                  {item.tenggat && <span>• Tenggat: {new Date(item.tenggat).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleEdit(item)} // Jalankan fungsi Edit
                style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.cardBg, color: colors.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Edit Konten"
              >
                <Edit3 size={18}/>
              </button>
              <button 
                onClick={() => handleDelete(item.id)} // Jalankan fungsi Hapus
                style={{ padding: '10px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Hapus Konten"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: colors.textMuted, border: `2px dashed ${colors.border}`, borderRadius: '20px', backgroundColor: colors.cardBg + '50' }}>
          <p style={{ fontSize: '15px' }}>Tidak ada {filterStatus.toLowerCase()} untuk mapel ini.</p>
        </div>
      )}
    </div>
  );
};

export default TabTugas;