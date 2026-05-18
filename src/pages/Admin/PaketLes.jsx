import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { 
  Plus, Edit, Trash2, X, Save, Package, Tag, 
  FileText, LayoutGrid, ChevronDown, GraduationCap,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminPaketLes = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarPaket, setDaftarPaket] = useState([]);
  const [daftarKelas, setDaftarKelas] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); 
  
  // --- STATE NOTIFIKASI & KONFIRMASI HAPUS ---
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  // formData menyimpan 'jenjang'
  const [formData, setFormData] = useState({
    nama_paket: '',
    jenjang: '',
    harga: '',
    deskripsi: ''
  });

  // Fungsi Pemicu Notifikasi Melayang (Toast)
  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

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

    // 2. Fetch Data Kelas untuk mengambil daftar jenjang unik
    const kelasRef = ref(db, 'Kelas');
    const unsubKelas = onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Mengambil jenjang unik agar tidak ada duplikat di dropdown
        const uniqueJenjang = [...new Set(list.map(item => item.jenjang))];
        setDaftarKelas(uniqueJenjang);
      }
    });

    return () => {
      unsubPaket();
      unsubKelas();
    };
  }, []);

  // --- LOGIKA PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPaket = daftarPaket.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(daftarPaket.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // --- HANDLER SUBMIT (TAMBAH / EDIT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await update(ref(db, `PaketLes/${editId}`), formData);
        pemicuNotif("Paket berhasil diperbarui!", "success");
      } else {
        const newRef = push(ref(db, 'PaketLes'));
        await set(newRef, formData);
        pemicuNotif("Paket baru berhasil ditambahkan!", "success");
      }
      closeModal();
    } catch (error) {
      pemicuNotif("Gagal menyimpan data paket.", "error");
    }
  };

  // --- HANDLER HAPUS ---
  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id: id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    
    try {
      await remove(ref(db, `PaketLes/${confirmDelete.id}`));
      pemicuNotif("Paket les berhasil dihapus.", "success");
      
      // Mundur 1 halaman jika item terakhir di halaman saat ini dihapus
      if (currentPaket.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      pemicuNotif("Gagal menghapus paket les.", "error");
    } finally {
      setConfirmDelete({ show: false, id: null });
    }
  };

  const openModal = (paket = null) => {
    if (paket) {
      setEditId(paket.id);
      setFormData({ 
        nama_paket: paket.nama_paket, 
        jenjang: paket.jenjang, 
        harga: paket.harga, 
        deskripsi: paket.deskripsi 
      });
    } else {
      setEditId(null);
      setFormData({ nama_paket: '', jenjang: '', harga: '', deskripsi: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

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
      width: '100%', padding: '12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', 
      color: colors.textPrimary,
      marginTop: '5px',
      boxSizing: 'border-box',
      appearance: 'none',
      cursor: 'pointer'
    },
    paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', borderTop: `1px solid ${colors.border}` },
    pageBtn: { padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' },
    pageNumber: (active) => ({ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.textPrimary, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }),
    toastNotification: (type) => ({
      position: 'fixed', top: '20px', right: '20px',
      backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
      color: '#fff', padding: '16px 24px', borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1100,
      display: 'flex', alignItems: 'center', gap: '12px',
      fontWeight: '600', fontSize: '14px', animation: 'slideIn 0.3s ease-out'
    }),
    btnCancel: { padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', flex: 1 },
    btnConfirmDelete: { padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: '#fff', cursor: 'pointer', fontWeight: '700', flex: 1 }
  };

  return (
    <AdminLayout title="Manajemen Paket Les">
      
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '30px 20px', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center', border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#EF444415', borderRadius: '50%' }}>
                <AlertTriangle size={40} color="#EF4444" />
              </div>
            </div>
            <h3 style={{ color: colors.textPrimary, margin: '0 0 10px 0', fontWeight: '800' }}>Konfirmasi Hapus</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin menghapus paket les ini secara permanen?
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
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Daftar Paket Les</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Kelola katalog berdasarkan jenjang pendidikan</p>
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

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA PAKET</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>JENJANG</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>HARGA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {currentPaket.length > 0 ? (
                  currentPaket.map((paket) => (
                    <tr key={paket.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{paket.nama_paket}</td>
                      <td style={{ padding: '18px 24px' }}>
                         <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: colors.primary + '10', color: colors.primary, fontSize: '12px', fontWeight: '700' }}>
                           {paket.jenjang || 'N/A'}
                         </span>
                      </td>
                      <td style={{ padding: '18px 24px', color: '#10B981', fontWeight: '800' }}>
                        Rp {Number(paket.harga).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(paket)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', marginRight: '12px' }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(paket.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: colors.textMuted }}>
                      Belum ada data paket les.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <span style={{ fontSize: '13px', color: colors.textMuted }}>
                Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, daftarPaket.length)} dari {daftarPaket.length} data
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  onClick={prevPage} 
                  disabled={currentPage === 1}
                  style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button 
                    key={index + 1} 
                    onClick={() => paginate(index + 1)}
                    style={styles.pageNumber(currentPage === index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}

                <button 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages}
                  style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH / UPDATE */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxSizing: 'border-box', border: `1px solid ${colors.border}`, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>{editId ? 'Update Paket' : 'Tambah Paket Baru'}</h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div style={styles.inputGroup}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>NAMA PAKET</label>
                  <div style={styles.inputWrapper}>
                    <Package size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                    <input style={styles.input} type="text" value={formData.nama_paket} onChange={(e) => setFormData({...formData, nama_paket: e.target.value})} placeholder="Contoh: Paket Intensif" required />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>JENJANG PENDIDIKAN</label>
                  <div style={styles.inputWrapper}>
                    <GraduationCap size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.primary }} />
                    <select 
                      style={styles.select} 
                      value={formData.jenjang} 
                      onChange={(e) => setFormData({...formData, jenjang: e.target.value})} 
                      required
                    >
                      <option value="" disabled>-- Pilih Jenjang --</option>
                      {daftarKelas.map((jenjang, idx) => (
                        <option key={idx} value={jenjang}>{jenjang.toUpperCase()}</option>
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
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>DESKRIPSI</label>
                  <div style={styles.inputWrapper}>
                    <FileText size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                    <textarea 
                      style={{ ...styles.input, paddingLeft: '40px', height: '100px', resize: 'none' }} 
                      value={formData.deskripsi} 
                      onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} 
                      placeholder="Fasilitas paket..." 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                  <Save size={20} /> Simpan Paket
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPaketLes;