import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { 
  Plus, Edit, Trash2, X, Save, Book, School, 
  Filter, LayoutGrid, ChevronDown, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminMapel = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarMapel, setDaftarMapel] = useState([]);
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // --- STATE FILTER & PAGINATION ---
  const [filterKelas, setFilterKelas] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 
  
  // --- STATE CUSTOM DROPDOWN (FILTER & FORM) ---
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);
  const filterRef = useRef(null);
  const formRef = useRef(null);
  
  // --- STATE NOTIFIKASI & KONFIRMASI HAPUS ---
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    nama: '',
    classId: ''
  });

  // Menutup dropdown (Filter maupun Form) jika diklik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (formRef.current && !formRef.current.contains(event.target)) {
        setIsFormDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fungsi Pemicu Notifikasi Melayang (Toast)
  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    // 1. Fetch Data Mapel
    const mapelRef = ref(db, 'Mapel');
    const unsubscribeMapel = onValue(mapelRef, (snapshot) => {
      const data = snapshot.val();
      setDaftarMapel(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    // 2. Fetch Data Kelas untuk Dropdown
    const kelasRef = ref(db, 'Kelas');
    const unsubscribeKelas = onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      setDaftarKelas(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    return () => {
      unsubscribeMapel();
      unsubscribeKelas();
    };
  }, []);

  // --- SORTING DATA BERDASARKAN ABJAD (A-Z) ---
  const sortedDaftarKelas = [...daftarKelas].sort((a, b) => 
    a.nama_kelas.localeCompare(b.nama_kelas)
  );

  // --- LOGIKA FILTER ---
  const filteredMapel = daftarMapel.filter((mapel) => {
    return filterKelas === '' || mapel.classId === filterKelas;
  });

  // Reset pagination ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKelas]);

  // --- LOGIKA PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMapel = filteredMapel.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMapel.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Helper untuk mendapatkan nama kelas berdasarkan ID
  const getClassName = (id) => {
    const kelas = daftarKelas.find(k => k.id === id);
    return kelas ? `${kelas.nama_kelas} (${kelas.jenjang})` : 'Kelas tidak ditemukan';
  };

  // --- HANDLER SUBMIT (TAMBAH / EDIT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi Manual: Pastikan kelas sudah dipilih (Karena custom div tidak punya atribut required native)
    if (!formData.classId) {
      pemicuNotif("Silakan pilih kelas terlebih dahulu!", "error");
      return;
    }

    // 1. Cek Duplikasi Data
    const isDuplicate = daftarMapel.some((mapel) => {
      if (editId && mapel.id === editId) return false;
      const isSameMapel = mapel.nama.toLowerCase().trim() === formData.nama.toLowerCase().trim();
      const isSameClass = mapel.classId === formData.classId;
      return isSameMapel && isSameClass;
    });

    if (isDuplicate) {
      pemicuNotif(`Mapel "${formData.nama}" sudah ada di kelas yang dipilih!`, "error");
      return; 
    }

    // 2. Eksekusi Simpan ke Firebase
    try {
      if (editId) {
        await update(ref(db, `Mapel/${editId}`), formData);
        pemicuNotif("Mata pelajaran berhasil diperbarui!", "success");
      } else {
        const newMapelRef = push(ref(db, 'Mapel'));
        await set(newMapelRef, formData);
        pemicuNotif("Mata pelajaran baru berhasil ditambahkan!", "success");
      }
      closeModal();
    } catch (error) {
      pemicuNotif("Terjadi kesalahan sistem saat menyimpan.", "error");
    }
  };

  // --- HANDLER HAPUS ---
  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id: id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await remove(ref(db, `Mapel/${confirmDelete.id}`));
      pemicuNotif("Mata pelajaran berhasil dihapus.", "success");
      
      if (currentMapel.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      pemicuNotif("Gagal menghapus mata pelajaran.", "error");
    } finally {
      setConfirmDelete({ show: false, id: null });
    }
  };

  const openModal = (mapel = null) => {
    setIsFormDropdownOpen(false); // Pastikan dropdown tertutup saat modal pertama kali dibuka
    if (mapel) {
      setEditId(mapel.id);
      setFormData({ 
        nama: mapel.nama, 
        classId: mapel.classId
      });
    } else {
      setEditId(null);
      setFormData({ nama: '', classId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    card: { 
      backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, 
      borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    },
    tableHeader: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderBottom: `2px solid ${colors.border}`, color: colors.textMuted,
      fontSize: '12px', fontWeight: '800', letterSpacing: '1px'
    },
    actionBtn: (color) => ({
      padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: color + '15',
      color: color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: '0 4px', transition: '0.2s'
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
        maxHeight: '90vh', overflowY: 'visible' // Diubah ke visible agar dropdown form tidak terpotong (jika modalnya kecil)
    },
    inputGroup: { marginBottom: '20px', width: '100%' },
    inputWrapper: { position: 'relative', width: '100%' },
    input: {
        width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
        border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', 
        color: colors.textPrimary, marginTop: '5px', boxSizing: 'border-box', fontSize: '14px',
        appearance: 'none'
    },
    filterSelect: {
      width: '100%', padding: '8px 30px 8px 32px', borderRadius: '8px', border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: colors.textPrimary, 
      fontSize: '13px', fontWeight: '600', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' 
    },
    // --- STYLES UNTUK CUSTOM DROPDOWN MENU ---
    customSelectMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '100%',
      maxHeight: '250px', /* Disesuaikan agar muat +- 8-10 item */
      overflowY: 'auto', 
      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      zIndex: 100, /* Z-index tinggi agar tampil di atas elemen lain */
      marginTop: '6px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    },
    customSelectItem: (isActive) => ({
      padding: '10px 15px',
      cursor: 'pointer',
      fontSize: '13px',
      color: isActive ? colors.primary : colors.textPrimary,
      backgroundColor: isActive ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') : 'transparent',
      borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
      fontWeight: isActive ? '700' : '500',
      transition: 'background-color 0.2s ease'
    }),
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
    <AdminLayout title="Manajemen Mata Pelajaran">
      
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
              Apakah Anda yakin ingin menghapus mata pelajaran ini?
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
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Data Mata Pelajaran</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Kelola daftar mata pelajaran berdasarkan kelas</p>
          </div>
          <button 
            onClick={() => openModal()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
              backgroundColor: colors.primary, color: '#fff', border: 'none', 
              borderRadius: '12px', cursor: 'pointer', fontWeight: '700'
            }}
          >
            <Plus size={20} /> Tambah Mapel
          </button>
        </div>

        {/* FILTER SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textMuted }}>
            <Filter size={16} />
            <span style={{ fontSize: '12px', fontWeight: '800' }}>FILTER :</span>
          </div>

          {/* CUSTOM DROPDOWN FILTER KELAS */}
          <div ref={filterRef} style={{ position: 'relative', width: '250px' }}>
            <LayoutGrid size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none', zIndex: 2 }} />
            
            <div 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              style={{ ...styles.filterSelect, display: 'flex', alignItems: 'center', paddingLeft: '32px' }}
            >
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {filterKelas === '' ? 'Semua Kelas' : getClassName(filterKelas)}
              </span>
              <ChevronDown 
                size={14} 
                style={{ 
                  color: colors.textMuted, 
                  transition: 'transform 0.2s', 
                  transform: isFilterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
                }} 
              />
            </div>

            {isFilterDropdownOpen && (
              <div style={styles.customSelectMenu}>
                <div 
                  onClick={() => { setFilterKelas(''); setIsFilterDropdownOpen(false); }}
                  style={styles.customSelectItem(filterKelas === '')}
                  onMouseEnter={(e) => e.target.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = filterKelas === '' ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') : 'transparent'}
                >
                  Semua Kelas
                </div>
                {sortedDaftarKelas.map((k) => (
                  <div 
                    key={k.id}
                    onClick={() => { setFilterKelas(k.id); setIsFilterDropdownOpen(false); }}
                    style={styles.customSelectItem(filterKelas === k.id)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = filterKelas === k.id ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') : 'transparent'}
                  >
                    {k.nama_kelas} ({k.jenjang})
                  </div>
                ))}
              </div>
            )}
          </div>

          {filterKelas && (
            <button 
              onClick={() => setFilterKelas('')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#EF444415', color: '#EF4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>

        {/* TABLE SECTION */}
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA MAPEL</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>KELAS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {currentMapel.length > 0 ? (
                  currentMapel.map((mapel) => (
                    <tr key={mapel.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{mapel.nama}</td>
                      <td style={{ padding: '18px 24px', color: colors.textMuted }}>{getClassName(mapel.classId)}</td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(mapel)} style={styles.actionBtn('#3B82F6')} title="Edit"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(mapel.id)} style={styles.actionBtn('#EF4444')} title="Hapus"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: colors.textMuted }}>
                      {filterKelas ? 'Mata pelajaran tidak ditemukan untuk kelas ini.' : 'Belum ada data mata pelajaran.'}
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
                Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMapel.length)} dari {filteredMapel.length} data
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

      {/* MODAL SECTION (TAMBAH / EDIT) */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>
                {editId ? 'Edit Mapel' : 'Tambah Mapel'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color={colors.textMuted}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>NAMA MATA PELAJARAN</label>
                <div style={styles.inputWrapper}>
                  <Book size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={formData.nama} 
                    onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                    placeholder="Contoh: Matematika" required 
                  />
                </div>
              </div>

              {/* CUSTOM DROPDOWN FORM KELAS */}
              <div style={styles.inputGroup}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>PILIH KELAS</label>
                <div ref={formRef} style={{ ...styles.inputWrapper, marginTop: '5px' }}>
                  <School size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, zIndex: 2 }} />
                  
                  <div 
                    onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)}
                    style={{ 
                      ...styles.input, marginTop: 0, display: 'flex', alignItems: 'center', 
                      paddingLeft: '40px', paddingRight: '40px', cursor: 'pointer' 
                    }}
                  >
                    <span style={{ 
                      flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      color: formData.classId === '' ? colors.textMuted : colors.textPrimary 
                    }}>
                      {formData.classId === '' ? '-- Pilih Kelas --' : getClassName(formData.classId)}
                    </span>
                  </div>

                  <ChevronDown size={18} style={{ 
                      position: 'absolute', right: '12px', top: '50%', 
                      transform: `translateY(-50%) ${isFormDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`, 
                      color: colors.textMuted, pointerEvents: 'none', transition: 'transform 0.2s' 
                    }} 
                  />

                  {/* Menu Dropdown Modal Form */}
                  {isFormDropdownOpen && (
                    <div style={{ ...styles.customSelectMenu, bottom: 'auto' }}>
                      <div 
                        onClick={() => { setFormData({...formData, classId: ''}); setIsFormDropdownOpen(false); }}
                        style={styles.customSelectItem(formData.classId === '')}
                        onMouseEnter={(e) => e.target.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = formData.classId === '' ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') : 'transparent'}
                      >
                        -- Pilih Kelas --
                      </div>
                      {sortedDaftarKelas.map((kelas) => (
                        <div 
                          key={kelas.id}
                          onClick={() => { setFormData({...formData, classId: kelas.id}); setIsFormDropdownOpen(false); }}
                          style={styles.customSelectItem(formData.classId === kelas.id)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = formData.classId === kelas.id ? (isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF') : 'transparent'}
                        >
                          {kelas.nama_kelas} ({kelas.jenjang})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', marginTop: '10px' }}>
                <Save size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> {editId ? 'Simpan Perubahan' : 'Simpan Mapel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMapel;