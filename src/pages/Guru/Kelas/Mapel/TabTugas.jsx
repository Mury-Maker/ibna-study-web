import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ClipboardList, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react'; 
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, onValue, remove } from 'firebase/database';
import FormBuatKonten from './FormBuatKonten'; 

const TabTugas = ({ mapelId, kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [daftarKonten, setDaftarKonten] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Terbit");
  const [filterTipe, setFilterTipe] = useState("Semua"); // Filter tipe baru
  const [selectedData, setSelectedData] = useState(null);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!mapelId) return;
    const kontenRef = ref(db, 'Konten');
    const unsubscribe = onValue(kontenRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filtered = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(item => item.mapelId === mapelId)
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

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterTipe]);

  // --- LOGIC FILTERING ---
  const dataSetelahFilter = daftarKonten.filter(item => {
    const matchStatus = item.status === filterStatus;
    const matchTipe = filterTipe === "Semua" || 
                     (filterTipe === "Kuis" && item.tipeKonten === "Tugas") || 
                     (filterTipe === "Materi" && item.tipeKonten === "Materi");
    return matchStatus && matchTipe;
  });

  // --- LOGIC PAGINATION ---
  const totalPages = Math.ceil(dataSetelahFilter.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataSetelahFilter.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus konten ini? Data pengerjaan siswa juga akan terhapus.")) {
      remove(ref(db, `Konten/${id}`))
        .then(() => alert("Konten berhasil dihapus."))
        .catch((err) => alert("Gagal menghapus: " + err.message));
    }
  };

  const handleEdit = (item) => {
    setSelectedData(item);
    setIsCreating(true);
  };

  if (isCreating) {
    return <FormBuatKonten mapelId={mapelId} kelasId={kelasId} onBack={() => { setIsCreating(false); setSelectedData(null); }} editData={selectedData} />;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Tombol Buat & Filter Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }} 
          onClick={() => setIsCreating(true)}
        >
          <Plus size={18} /> Buat Baru
        </button>

        <div style={{ display: 'flex', backgroundColor: colors.border + '30', padding: '4px', borderRadius: '10px' }}>
          {["Terbit", "Draft"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: filterStatus === s ? colors.cardBg : 'transparent', color: filterStatus === s ? colors.primary : colors.textMuted, transition: '0.2s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tipe (Kuis / Materi) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textMuted, fontSize: '13px', fontWeight: '700', marginRight: '10px' }}>
          <Filter size={16} /> TIPE:
        </div>
        {["Semua", "Kuis", "Materi"].map(tipe => (
          <button
            key={tipe}
            onClick={() => setFilterTipe(tipe)}
            style={{
              padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filterTipe === tipe ? colors.primary : colors.border}`,
              backgroundColor: filterTipe === tipe ? colors.primary + '15' : 'transparent',
              color: filterTipe === tipe ? colors.primary : colors.textMuted,
              fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
            }}
          >
            {tipe.toUpperCase()}
          </button>
        ))}
      </div>

      {currentItems.length > 0 ? (
        <>
          {currentItems.map((item) => (
            <div key={item.id} style={{ backgroundColor: colors.cardBg, padding: '18px 24px', borderRadius: '16px', border: `1px solid ${colors.border}`, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: (item.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981') + '15', color: item.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981' }}>
                  {item.tipeKonten === 'Materi' ? <FileText size={24} /> : <ClipboardList size={24} />}
                </div>
                <div>
                  <h4 style={{ color: colors.textPrimary, margin: 0, fontSize: '16px', fontWeight: '800' }}>{item.judul}</h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: colors.textMuted, marginTop: '6px', fontWeight: '600' }}>
                    <span style={{ color: item.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981' }}>
                      {item.tipeKonten === 'Tugas' ? '● KUIS' : '● MATERI'}
                    </span>
                    {item.tenggat && <span>• TENGGAT: {new Date(item.tenggat).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleEdit(item)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.cardBg, color: colors.textPrimary, cursor: 'pointer' }}><Edit3 size={18}/></button>
                <button onClick={() => handleDelete(item.id)} style={{ padding: '10px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18}/></button>
              </div>
            </div>
          ))}

          {/* UI PAGINATION */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px', borderRadius: '50%', border: `1px solid ${colors.border}`, cursor: 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: '13px', fontWeight: '800', color: colors.textPrimary }}>{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px', borderRadius: '50%', border: `1px solid ${colors.border}`, cursor: 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}><ChevronRight size={18} /></button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted, border: `2px dashed ${colors.border}`, borderRadius: '20px' }}>
          <p>Tidak ada data {filterTipe !== 'Semua' ? filterTipe : ''} dengan status {filterStatus}.</p>
        </div>
      )}
    </div>
  );
};

export default TabTugas;