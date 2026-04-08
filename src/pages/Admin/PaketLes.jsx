import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { 
  Plus, Edit, Trash2, X, Save, Package, Tag, 
  FileText, LayoutGrid, ChevronDown 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminPaketLes = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarPaket, setDaftarPaket] = useState([]);
  const [daftarKelas, setDaftarKelas] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama_paket: '',
    kelasId: '',
    harga: '',
    deskripsi: ''
  });

  useEffect(() => {
    // 1. Fetch Data Paket Les
    const paketRef = ref(db, 'PaketLes');
    const unsubPaket = onValue(paketRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarPaket(list);
      } else {
        setDaftarPaket([]);
      }
    });

    // 2. Fetch Data Kelas untuk Dropdown
    const kelasRef = ref(db, 'Kelas');
    const unsubKelas = onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarKelas(list);
      }
    });

    return () => {
      unsubPaket();
      unsubKelas();
    };
  }, []);

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    card: { 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '16px', 
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    },
    inputGroup: { marginBottom: '20px', width: '100%', boxSizing: 'border-box' },
    inputWrapper: { position: 'relative', width: '100%', boxSizing: 'border-box' },
    input: {
      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', 
      color: colors.textPrimary,
      marginTop: '5px',
      boxSizing: 'border-box',
      fontSize: '14px',
      transition: '0.3s'
    },
    select: {
      width: '100%', padding: '12px 40px 12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', 
      color: colors.textPrimary,
      marginTop: '5px',
      boxSizing: 'border-box',
      appearance: 'none',
      cursor: 'pointer',
      fontWeight: '600'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await update(ref(db, `PaketLes/${editId}`), formData);
        alert("Paket berhasil diperbarui!");
      } else {
        const newRef = push(ref(db, 'PaketLes'));
        await set(newRef, formData);
        alert("Paket baru berhasil ditambahkan!");
      }
      closeModal();
    } catch (error) {
      alert("Gagal menyimpan data paket.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus paket les ini secara permanen?")) {
      await remove(ref(db, `PaketLes/${id}`));
    }
  };

  const openModal = (paket = null) => {
    if (paket) {
      setEditId(paket.id);
      setFormData({ 
        nama_paket: paket.nama_paket, 
        kelasId: paket.kelasId, 
        harga: paket.harga, 
        deskripsi: paket.deskripsi 
      });
    } else {
      setEditId(null);
      setFormData({ nama_paket: '', kelasId: '', harga: '', deskripsi: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  return (
    <AdminLayout title="Manajemen Paket Les">
      <div style={styles.container}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Daftar Paket Les</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Kelola katalog harga dan deskripsi paket belajar</p>
          </div>
          <button 
            onClick={() => openModal()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
              backgroundColor: colors.primary, color: '#fff', border: 'none', 
              borderRadius: '12px', cursor: 'pointer', fontWeight: '700',
              boxShadow: `0 4px 15px ${colors.primary}40`
            }}
          >
            <Plus size={20} /> Tambah Paket
          </button>
        </div>

        {/* Data Table */}
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA PAKET</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>KELAS RELASI</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>HARGA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {daftarPaket.map((paket) => {
                  const infoKelas = daftarKelas.find(k => k.id === paket.kelasId);
                  return (
                    <tr key={paket.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{paket.nama_paket}</td>
                      <td style={{ padding: '18px 24px' }}>
                         <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: colors.primary + '10', color: colors.primary, fontSize: '12px', fontWeight: '700' }}>
                           {infoKelas ? `${infoKelas.nama_kelas} (${infoKelas.jenjang})` : 'N/A'}
                         </span>
                      </td>
                      <td style={{ padding: '18px 24px', color: '#10B981', fontWeight: '800' }}>
                        Rp {Number(paket.harga).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(paket)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', marginRight: '12px' }}><Edit size={18} /></button>
                        <button onClick={() => handleDelete(paket.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Paket Les */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxSizing: 'border-box', border: `1px solid ${colors.border}`, maxHeight: '90vh', overflowY: 'auto', position: 'relative', overflow: 'hidden' }}>
            
            {/* Watermark Dekorasi */}
            <Package size={160} style={{ position: 'absolute', right: '-30px', bottom: '-30px', color: colors.primary + '08', transform: 'rotate(-15deg)', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', backgroundColor: colors.primary + '15', borderRadius: '12px', color: colors.primary }}>
                    <Package size={24} />
                  </div>
                  <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>{editId ? 'Update Paket' : 'Tambah Paket Baru'}</h3>
                </div>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div style={styles.inputGroup}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>NAMA PAKET</label>
                  <div style={styles.inputWrapper}>
                    <Package size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                    <input style={styles.input} type="text" value={formData.nama_paket} onChange={(e) => setFormData({...formData, nama_paket: e.target.value})} placeholder="Contoh: Paket Intensif UN" required />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>PILIH KELAS TERSEDIA</label>
                  <div style={styles.inputWrapper}>
                    <LayoutGrid size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.primary }} />
                    <select 
                      style={styles.select} 
                      value={formData.kelasId} 
                      onChange={(e) => setFormData({...formData, kelasId: e.target.value})} 
                      required
                    >
                      <option value="" disabled>-- Pilih Kelas Terdaftar --</option>
                      {daftarKelas.map(k => (
                        <option key={k.id} value={k.id}>
                          🏫 {k.nama_kelas} — [{k.jenjang.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '18px', color: colors.textMuted, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>HARGA PAKET (RP)</label>
                  <div style={styles.inputWrapper}>
                    <Tag size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                    <input style={styles.input} type="number" value={formData.harga} onChange={(e) => setFormData({...formData, harga: e.target.value})} placeholder="Contoh: 500000" required />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>DESKRIPSI LENGKAP</label>
                  <div style={styles.inputWrapper}>
                    <FileText size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                    <textarea 
                      style={{ ...styles.input, paddingLeft: '40px', height: '100px', resize: 'none' }} 
                      value={formData.deskripsi} 
                      onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} 
                      placeholder="Jelaskan detail fasilitas paket..." 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px', boxShadow: `0 4px 15px ${colors.primary}30` }}>
                  <Save size={20} /> {editId ? 'Simpan Perubahan' : 'Publish Paket'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        tbody tr:hover { background-color: ${isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} }
      `}</style>
    </AdminLayout>
  );
};

export default AdminPaketLes;