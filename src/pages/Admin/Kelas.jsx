import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { 
  Plus, Edit, Trash2, X, Save, BookOpen, GraduationCap, 
  UserCheck, Users, Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react'; 
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminKelas = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [daftarGuru, setDaftarGuru] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // --- STATE FILTER & PENCARIAN ---
  const [searchKelas, setSearchKelas] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); 
  
  // --- STATE NOTIFIKASI & KONFIRMASI HAPUS ---
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    nama_kelas: '',
    jenjang: '',
    teacherId: '',
    maxSiswa: '' 
  });

  // Fungsi Pemicu Notifikasi Melayang (Toast)
  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    const kelasRef = ref(db, 'Kelas');
    const unsubscribeKelas = onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarKelas(list);
      } else {
        setDaftarKelas([]);
      }
    });

    const usersRef = ref(db, 'Users');
    const unsubscribeGuru = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map(key => ({ 
            id: key, 
            nama: data[key].username || data[key].nama || 'Tanpa Nama', 
            role: data[key].role 
          }))
          .filter(user => user.role === 'Guru'); 
        setDaftarGuru(list);
      } else {
        setDaftarGuru([]);
      }
    });

    return () => {
      unsubscribeKelas();
      unsubscribeGuru();
    };
  }, []);

  const getTeacherName = (id) => {
    const guru = daftarGuru.find(g => g.id === id);
    return guru ? guru.nama : (id || 'Tidak ada Guru');
  };

  const filteredKelas = daftarKelas.filter((kelas) => {
    const matchKelas = kelas.nama_kelas?.toLowerCase().includes(searchKelas.toLowerCase());
    const matchJenjang = filterJenjang === '' || kelas.jenjang?.toLowerCase() === filterJenjang.toLowerCase();
    return matchKelas && matchJenjang;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKelas, filterJenjang]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentKelas = filteredKelas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredKelas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Fungsi Tambah / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await update(ref(db, `Kelas/${editId}`), formData);
        pemicuNotif("Data kelas berhasil diperbarui!", "success");
      } else {
        const newKelasRef = push(ref(db, 'Kelas'));
        await set(newKelasRef, formData);
        pemicuNotif("Kelas baru berhasil ditambahkan!", "success");
      }
      closeModal();
    } catch (error) {
      pemicuNotif("Terjadi kesalahan sistem.", "error");
    }
  };

  // Memicu Modal Konfirmasi Hapus
  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id: id });
  };

  // Eksekusi Hapus Setelah Dikonfirmasi
  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    
    try {
      await remove(ref(db, `Kelas/${confirmDelete.id}`));
      pemicuNotif("Kelas berhasil dihapus.", "success");
      
      if (currentKelas.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      pemicuNotif("Gagal menghapus data kelas.", "error");
    } finally {
      setConfirmDelete({ show: false, id: null });
    }
  };

  const openModal = (kelas = null) => {
    if (kelas) {
      setEditId(kelas.id);
      setFormData({ 
        nama_kelas: kelas.nama_kelas, 
        jenjang: kelas.jenjang, 
        teacherId: kelas.teacherId || '',
        maxSiswa: kelas.maxSiswa || '' 
      });
    } else {
      setEditId(null);
      setFormData({ nama_kelas: '', jenjang: '', teacherId: '', maxSiswa: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const uniqueJenjang = [...new Set(daftarKelas.map(k => k.jenjang))].filter(Boolean);

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
      padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: color + '15',
      color: color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', transition: '0.2s', margin: '0 4px'
    }),
    modalOverlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', zIndex: 1000, padding: '20px'
    },
    modalContent: {
        backgroundColor: colors.cardBg, padding: '30px', borderRadius: '20px', 
        width: '100%', maxWidth: '450px', boxSizing: 'border-box', 
        border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto'
    },
    inputGroup: { marginBottom: '20px', width: '100%', boxSizing: 'border-box' },
    inputWrapper: { position: 'relative', width: '100%', boxSizing: 'border-box' },
    input: {
        width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
        border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', 
        color: colors.textPrimary, marginTop: '5px', boxSizing: 'border-box', fontSize: '14px',
        appearance: 'none'
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
    <AdminLayout title="Manajemen Kelas">
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
              Apakah Anda yakin ingin menghapus kelas ini? Data terkait kelas akan dihapus permanen.
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
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
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

        {/* BAGIAN FILTER & PENCARIAN */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: colors.textMuted }} />
            <input 
              type="text"
              placeholder="Cari nama kelas..."
              value={searchKelas}
              onChange={(e) => setSearchKelas(e.target.value)}
              style={{ ...styles.input, marginTop: 0 }}
            />
          </div>

          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: colors.textMuted }} />
            <select 
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              style={{ ...styles.input, marginTop: 0 }}
            >
              <option value="">Semua Jenjang</option>
              {uniqueJenjang.map((jenjang, idx) => (
                <option key={idx} value={jenjang}>{jenjang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TABEL DATA */}
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA KELAS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>JENJANG</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>MAX SISWA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>GURU</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {currentKelas.length > 0 ? (
                  currentKelas.map((kelas) => (
                    <tr key={kelas.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{kelas.nama_kelas}</td>
                      <td style={{ padding: '18px 24px' }}>
                         <span style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: colors.primary + '10', color: colors.primary, fontSize: '12px', fontWeight: '700' }}>
                           {kelas.jenjang}
                         </span>
                      </td>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary }}>
                         {kelas.maxSiswa || '-'} Siswa
                      </td>
                      <td style={{ padding: '18px 24px', color: colors.textMuted }}>
                          {getTeacherName(kelas.teacherId)}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(kelas)} style={styles.actionBtn('#3B82F6')} title="Edit"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(kelas.id)} style={styles.actionBtn('#EF4444')} title="Hapus"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: colors.textMuted }}>
                      {searchKelas || filterJenjang ? 'Data kelas tidak ditemukan untuk filter tersebut.' : 'Belum ada data kelas.'}
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
                Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredKelas.length)} dari {filteredKelas.length} data
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

      {/* MODAL TAMBAH/EDIT */}
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
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>MAKSIMAL SISWA</label>
                <div style={styles.inputWrapper}>
                  <Users size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input 
                    style={styles.input} 
                    type="number" 
                    value={formData.maxSiswa} 
                    onChange={(e) => setFormData({...formData, maxSiswa: e.target.value})} 
                    placeholder="Masukkan Kapasitas Kelas" 
                    required 
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>PILIH GURU (TEACHER)</label>
                <div style={styles.inputWrapper}>
                  <UserCheck size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <select 
                    style={styles.input} 
                    value={formData.teacherId} 
                    onChange={(e) => setFormData({...formData, teacherId: e.target.value})} 
                    required
                  >
                    <option value="">-- Pilih Guru --</option>
                    {daftarGuru.map((guru) => (
                      <option key={guru.id} value={guru.id}>
                        {guru.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                style={{ 
                  width: '100%', padding: '14px', backgroundColor: colors.primary, 
                  color: '#fff', border: 'none', borderRadius: '12px', 
                  cursor: 'pointer', fontWeight: '700', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', gap: '10px', 
                  marginTop: '10px', boxShadow: `0 4px 15px ${colors.primary}30` 
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