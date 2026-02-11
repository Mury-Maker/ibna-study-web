import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { Plus, Edit, Trash2, X, Save, BookOpen, GraduationCap, Hash } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout'; // Penting: Agar sidebar tetap muncul

const AdminKelas = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama_kelas: '',
    jenjang: '',
    teacherId: ''
  });

  useEffect(() => {
    const kelasRef = ref(db, 'Kelas');
    const unsubscribe = onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarKelas(list);
      } else {
        setDaftarKelas([]);
      }
    });
    return () => unsubscribe();
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
    tableHeader: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderBottom: `2px solid ${colors.border}`,
      color: colors.textMuted,
      fontSize: '12px',
      fontWeight: '800',
      letterSpacing: '1px'
    },
    actionBtn: (color) => ({
      padding: '8px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: color + '15',
      color: color,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: '0.2s',
      margin: '0 4px'
    }),
    modalOverlay: {
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(4px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000,
        padding: '20px' // Tambahkan padding agar modal tidak menempel layar saat resize
    },
    modalContent: {
        backgroundColor: colors.cardBg, 
        padding: '30px', 
        borderRadius: '20px', 
        width: '100%',
        maxWidth: '450px', // Batas lebar maksimal
        boxSizing: 'border-box', // Penting agar padding tidak menambah lebar luar
        border: `1px solid ${colors.border}`, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        maxHeight: '90vh', // Batas tinggi maksimal agar tidak terpotong
        overflowY: 'auto'  // Tambahkan scroll jika konten form sangat panjang
    },
    inputGroup: {
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box'
    },
    inputWrapper: {
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
    },
    input: {
        width: '100%', 
        padding: '12px 12px 12px 40px', // Padding kiri dilebihkan untuk ikon
        borderRadius: '10px', 
        border: `1px solid ${colors.border}`, 
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', 
        color: colors.textPrimary,
        marginTop: '5px',
        boxSizing: 'border-box', // Penting agar lebar tetap 100% card
        fontSize: '14px'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await update(ref(db, `Kelas/${editId}`), formData);
      } else {
        const newKelasRef = push(ref(db, 'Kelas'));
        await set(newKelasRef, formData);
      }
      closeModal();
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  const openModal = (kelas = null) => {
    if (kelas) {
      setEditId(kelas.id);
      setFormData({ nama_kelas: kelas.nama_kelas, jenjang: kelas.jenjang, teacherId: kelas.teacherId || '' });
    } else {
      setEditId(null);
      setFormData({ nama_kelas: '', jenjang: '', teacherId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  return (
    <AdminLayout title="Manajemen Kelas">
      <div style={styles.container}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Data Master Kelas</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Kelola seluruh kelas aktif di IBNA Study</p>
          </div>
          <button 
            onClick={() => openModal()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
              backgroundColor: colors.primary, color: '#fff', border: 'none', 
              borderRadius: '12px', cursor: 'pointer', fontWeight: '700', boxShadow: `0 4px 15px ${colors.primary}40`
            }}
          >
            <Plus size={20} /> Tambah Kelas
          </button>
        </div>

        {/* Table Card */}
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA KELAS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>JENJANG</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>ID TEACHER</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {daftarKelas.map((kelas) => (
                  <tr key={kelas.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                    <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{kelas.nama_kelas}</td>
                    <td style={{ padding: '18px 24px' }}>
                       <span style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: colors.primary + '10', color: colors.primary, fontSize: '12px', fontWeight: '700' }}>
                         {kelas.jenjang}
                       </span>
                    </td>
                    <td style={{ padding: '18px 24px', color: colors.textMuted, fontFamily: 'monospace' }}>{kelas.teacherId || '-'}</td>
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <button onClick={() => openModal(kelas)} style={styles.actionBtn('#3B82F6')} title="Edit"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(kelas.id)} style={styles.actionBtn('#EF4444')} title="Hapus"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Design */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>
                {editId ? 'Update Data Kelas' : 'Registrasi Kelas Baru'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                <X size={24} color={colors.textMuted}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>NAMA KELAS</label>
                <div style={styles.inputWrapper}>
                  <BookOpen size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={formData.nama_kelas} 
                    onChange={(e) => setFormData({...formData, nama_kelas: e.target.value})} 
                    placeholder="Contoh: 10 IPA 1" 
                    required 
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>JENJANG PENDIDIKAN</label>
                <div style={styles.inputWrapper}>
                  <GraduationCap size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={formData.jenjang} 
                    onChange={(e) => setFormData({...formData, jenjang: e.target.value})} 
                    placeholder="Contoh: SMA / SMP" 
                    required 
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>ASSIGN TEACHER ID</label>
                <div style={styles.inputWrapper}>
                  <Hash size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={formData.teacherId} 
                    onChange={(e) => setFormData({...formData, teacherId: e.target.value})} 
                    placeholder="Masukkan UID Guru" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  backgroundColor: colors.primary, 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontWeight: '700', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '10px', 
                  marginTop: '10px',
                  boxShadow: `0 4px 15px ${colors.primary}30` 
                }}
              >
                <Save size={20} /> {editId ? 'Simpan Perubahan' : 'Publish Kelas'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminKelas;