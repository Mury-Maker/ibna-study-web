import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { Plus, Edit, Trash2, X, Save, Package, Tag, FileText, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminPaketLes = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarPaket, setDaftarPaket] = useState([]);
  const [daftarKelas, setDaftarKelas] = useState([]); // Untuk dropdown pilih kelas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama_paket: '',
    kelasId: '',
    harga: '',
    deskripsi: ''
  });

  useEffect(() => {
    // 1. Ambil Data Paket Les
    const paketRef = ref(db, 'PaketLes');
    onValue(paketRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarPaket(list);
      } else {
        setDaftarPaket([]);
      }
    });

    // 2. Ambil Data Kelas untuk Pilihan Dropdown
    const kelasRef = ref(db, 'Kelas');
    onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarKelas(list);
      }
    });
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
    input: {
      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', 
      color: colors.textPrimary,
      marginTop: '5px',
      boxSizing: 'border-box',
      fontSize: '14px'
    },
    select: {
      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', 
      color: colors.textPrimary,
      marginTop: '5px',
      boxSizing: 'border-box',
      appearance: 'none'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await update(ref(db, `PaketLes/${editId}`), formData);
      } else {
        const newRef = push(ref(db, 'PaketLes'));
        await set(newRef, formData);
      }
      closeModal();
    } catch (error) {
      alert("Gagal menyimpan data paket.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus paket les ini?")) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Daftar Paket Les</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Kelola harga dan deskripsi paket belajar</p>
          </div>
          <button 
            onClick={() => openModal()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
              backgroundColor: colors.primary, color: '#fff', border: 'none', 
              borderRadius: '12px', cursor: 'pointer', fontWeight: '700'
            }}
          >
            <Plus size={20} /> Tambah Paket
          </button>
        </div>

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA PAKET</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>KELAS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>HARGA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {daftarPaket.map((paket) => {
                  const infoKelas = daftarKelas.find(k => k.id === paket.kelasId);
                  return (
                    <tr key={paket.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{paket.nama_paket}</td>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary }}>
                        {infoKelas ? `${infoKelas.nama_kelas} (${infoKelas.jenjang})` : 'Kelas tidak ditemukan'}
                      </td>
                      <td style={{ padding: '18px 24px', color: '#10B981', fontWeight: '700' }}>
                        Rp {Number(paket.harga).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(paket)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', marginRight: '10px' }}><Edit size={18} /></button>
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
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', boxSizing: 'border-box', border: `1px solid ${colors.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>{editId ? 'Update Paket' : 'Tambah Paket Baru'}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>NAMA PAKET</label>
                <div style={{ position: 'relative' }}>
                  <Package size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input style={styles.input} type="text" value={formData.nama_paket} onChange={(e) => setFormData({...formData, nama_paket: e.target.value})} placeholder="Contoh: Paket Intensif UN" required />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>PILIH KELAS</label>
                <div style={{ position: 'relative' }}>
                  <LayoutGrid size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <select 
                    style={styles.select} 
                    value={formData.kelasId} 
                    onChange={(e) => setFormData({...formData, kelasId: e.target.value})} 
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {daftarKelas.map(k => (
                      <option key={k.id} value={k.id}>{k.nama_kelas} ({k.jenjang})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>HARGA (RP)</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input style={styles.input} type="number" value={formData.harga} onChange={(e) => setFormData({...formData, harga: e.target.value})} placeholder="Contoh: 500000" required />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>DESKRIPSI PAKET</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <textarea 
                    style={{ ...styles.input, paddingLeft: '40px', height: '100px', resize: 'none' }} 
                    value={formData.deskripsi} 
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} 
                    placeholder="Jelaskan detail paket..." 
                    required 
                  />
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Save size={20} /> Simpan Paket
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPaketLes;