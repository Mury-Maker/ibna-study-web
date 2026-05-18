import React, { useState, useEffect } from 'react';
import { db, auth } from '../../api/firebase'; 
import { ref, onValue, update, remove, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { 
  Plus, Edit, Trash2, X, Save, User, MapPin, 
  Phone, Mail, Lock, Loader2, Eye, EyeOff, 
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminGuru = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarGuru, setDaftarGuru] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); 
  
  // State Notifikasi Melayang (Toast)
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  
  // State Konfirmasi Hapus (Custom Confirm)
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    noHp: '',
    email: '',
    password: ''
  });

  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    const usersRef = ref(db, 'Users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(user => user.role === 'Guru');
        setDaftarGuru(list);
      } else {
        setDaftarGuru([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGuru = daftarGuru.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(daftarGuru.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editId) {
        await update(ref(db, `Users/${editId}`), {
          nama: formData.nama,
          email: formData.email,
          password: formData.password,
          noHp: formData.noHp,
          alamat: formData.alamat,
          role: 'Guru'
        });
        pemicuNotif("Data guru berhasil diperbarui!", "success");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        const user = userCredential.user;

        await set(ref(db, `Users/${user.uid}`), {
          uid: user.uid,
          nama: formData.nama,
          email: formData.email,
          password: formData.password,
          noHp: formData.noHp,
          alamat: formData.alamat,
          role: 'Guru',
          createdAt: new Date().toISOString()
        });

        pemicuNotif("Akun Guru berhasil dibuat dan didaftarkan!", "success");
      }
      closeModal();
    } catch (error) {
      let errorMessage = "Terjadi kesalahan: " + error.message;
      if (error.code === 'auth/email-already-in-use') errorMessage = "Email sudah terdaftar di sistem!";
      if (error.code === 'auth/weak-password') errorMessage = "Password terlalu lemah (min. 6 karakter)!";
      
      pemicuNotif(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Fungsi memicu modal konfirmasi hapus
  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id: id });
  };

  // 2. Fungsi eksekusi hapus setelah dikonfirmasi "Ya"
  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    
    try {
      await remove(ref(db, `Users/${confirmDelete.id}`));
      pemicuNotif("Data guru berhasil dihapus.", "success");
      if (currentGuru.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      pemicuNotif("Gagal menghapus data.", "error");
    } finally {
      setConfirmDelete({ show: false, id: null }); // Tutup modal konfirmasi
    }
  };

  const openModal = (guru = null) => {
    if (guru) {
      setEditId(guru.id);
      setFormData({ 
        nama: guru.nama || '', 
        alamat: guru.alamat || '', 
        noHp: guru.noHp || '',
        email: guru.email || '',
        password: guru.password || ''
      });
    } else {
      setEditId(null);
      setFormData({ nama: '', alamat: '', noHp: '', email: '', password: '' });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => { 
    setIsModalOpen(false); 
    setEditId(null); 
    setShowPassword(false);
  };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    card: { backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    tableHeader: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '12px', fontWeight: '800' },
    actionBtn: (color) => ({ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: color + '15', color: color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', margin: '0 4px' }),
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalContent: { backgroundColor: colors.cardBg, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '450px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' },
    inputGroup: { marginBottom: '15px', width: '100%' },
    inputWrapper: { position: 'relative', width: '100%' },
    input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', color: colors.textPrimary, marginTop: '5px', boxSizing: 'border-box', fontSize: '14px' },
    paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', borderTop: `1px solid ${colors.border}` },
    pageBtn: { padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' },
    pageNumber: (active) => ({ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.textPrimary, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }),
    toastNotification: (type) => ({
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: '600',
      fontSize: '14px',
      animation: 'slideIn 0.3s ease-out'
    }),
    btnCancel: { padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', flex: 1 },
    btnConfirmDelete: { padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: '#fff', cursor: 'pointer', fontWeight: '700', flex: 1 }
  };

  return (
    <AdminLayout title="Manajemen Guru">
      {/* TOAST NOTIFICATION */}
      {notif.show && (
        <div style={styles.toastNotification(notif.type)}>
          {notif.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notif.message}</span>
          <button 
            onClick={() => setNotif({ ...notif, show: false })} 
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '10px', padding: 0, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* CUSTOM MODAL KONFIRMASI HAPUS */}
      {confirmDelete.show && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#EF444415', borderRadius: '50%' }}>
                <AlertTriangle size={40} color="#EF4444" />
              </div>
            </div>
            <h3 style={{ color: colors.textPrimary, margin: '0 0 10px 0', fontWeight: '800' }}>Konfirmasi Hapus</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin menghapus akun guru ini? Data yang dihapus tidak dapat dikembalikan. <br />
              <span style={{ fontSize: '12px', color: '#EF4444', display: 'block', marginTop: '8px' }}>
                (Catatan: Data di Authentication harus dihapus manual)
              </span>
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete({ show: false, id: null })} style={styles.btnCancel}>
                Batal
              </button>
              <button onClick={executeDelete} style={styles.btnConfirmDelete}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Master Data Guru</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Kelola kredensial login dan profil pengajar</p>
          </div>
          <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>
            <Plus size={20} /> Tambah Guru
          </button>
        </div>

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA GURU</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>EMAIL (AUTH)</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>TELEPON</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {currentGuru.length > 0 ? (
                  currentGuru.map((guru) => (
                    <tr key={guru.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{guru.nama}</td>
                      <td style={{ padding: '18px 24px', color: colors.textMuted }}>{guru.email}</td>
                      <td style={{ padding: '18px 24px', color: colors.textMuted }}>{guru.noHp}</td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(guru)} style={styles.actionBtn('#3B82F6')}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(guru.id)} style={styles.actionBtn('#EF4444')}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: colors.textMuted }}>
                      Tidak ada data guru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <span style={{ fontSize: '13px', color: colors.textMuted }}>
                Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, daftarGuru.length)} dari {daftarGuru.length} data
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={prevPage} disabled={currentPage === 1} style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                  <ChevronLeft size={16} /> Prev
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button key={index + 1} onClick={() => paginate(index + 1)} style={styles.pageNumber(currentPage === index + 1)}>
                    {index + 1}
                  </button>
                ))}
                <button onClick={nextPage} disabled={currentPage === totalPages} style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit Data Guru */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>
                {editId ? 'Update Data Guru' : 'Registrasi Guru & Akun Auth'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>NAMA LENGKAP</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input style={styles.input} type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} placeholder="Nama Guru" required />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>EMAIL LOGIN (AUTH)</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input style={styles.input} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@guru.com" required disabled={!!editId} />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>PASSWORD</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input 
                    style={{...styles.input, paddingRight: '40px'}} 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Password Akun" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>NOMOR HP</label>
                <div style={styles.inputWrapper}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input style={styles.input} type="tel" value={formData.noHp} onChange={(e) => setFormData({...formData, noHp: e.target.value})} placeholder="08xxxx" required />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>ALAMAT</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input style={styles.input} type="text" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} placeholder="Alamat Domisili" required />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  width: '100%', padding: '14px', 
                  backgroundColor: isSubmitting ? colors.textMuted : colors.primary, 
                  color: '#fff', border: 'none', borderRadius: '12px', 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                  fontWeight: '700', marginTop: '10px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <><Save size={20} /> {editId ? 'Simpan Perubahan' : 'Buat Akun & Simpan'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGuru;