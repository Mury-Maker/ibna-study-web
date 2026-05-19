import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { 
  Plus, Edit, Trash2, X, Save, Clock, 
  LayoutGrid, Calendar as CalendarIcon, User, UserCheck,
  Filter, ChevronLeft, ChevronRight, ChevronDown,
  CheckCircle, AlertCircle, AlertTriangle, BookOpen
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminJadwal = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarJadwal, setDaftarJadwal] = useState([]);
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [daftarGuru, setDaftarGuru] = useState([]);
  const [daftarMapelKeseluruhan, setDaftarMapelKeseluruhan] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- STATE FILTER & PAGINATION ---
  const [filterKelas, setFilterKelas] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [filterGuru, setFilterGuru] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // --- STATE NOTIFIKASI & KONFIRMASI HAPUS ---
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    classId: '',     
    teacherId: '',   
    mapel: [],
    hari: '',
    jamMulai: '',
    jamSelesai: ''
  });

  const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    const unsubscribeJadwal = onValue(ref(db, 'Jadwal'), (snapshot) => {
      const data = snapshot.val();
      setDaftarJadwal(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    const unsubscribeKelas = onValue(ref(db, 'Kelas'), (snapshot) => {
      const data = snapshot.val();
      setDaftarKelas(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    const unsubscribeGuru = onValue(ref(db, 'Users'), (snapshot) => {
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

    const unsubscribeMapel = onValue(ref(db, 'Mapel'), (snapshot) => {
      const data = snapshot.val();
      setDaftarMapelKeseluruhan(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    return () => {
      unsubscribeJadwal();
      unsubscribeKelas();
      unsubscribeGuru();
      unsubscribeMapel();
    };
  }, []);

  // --- LOGIKA PENCARIAN & FILTER ---
  const filteredJadwal = daftarJadwal.filter((j) => {
    const matchKelas = filterKelas === '' || j.classId === filterKelas;
    const matchHari = filterHari === '' || j.hari === filterHari;
    const matchGuru = filterGuru === '' || j.teacherId === filterGuru;
    return matchKelas && matchHari && matchGuru;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterKelas, filterHari, filterGuru]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJadwal = filteredJadwal.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJadwal.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleKelasChange = (idKelas) => {
    const selectedKelas = daftarKelas.find(k => k.id === idKelas);
    if (selectedKelas) {
      setFormData({
        ...formData,
        classId: idKelas,
        teacherId: selectedKelas.teacherId || '',
        mapel: [] 
      });
    } else {
      setFormData({ ...formData, classId: idKelas, teacherId: '', mapel: [] });
    }
  };

  const mapelTersediaDiKelas = daftarMapelKeseluruhan.filter(m => m.classId === formData.classId);

  const getLabel = (list, id, type = 'nama') => {
    const item = list.find(i => i.id === id);
    if (!item) return '-';
    return type === 'kelas' ? item.nama_kelas : item.nama;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mapel || formData.mapel.length === 0) {
      pemicuNotif("Pilih minimal satu mata pelajaran.", "error");
      return;
    }

    let errorMessage = '';

    const isInvalid = daftarJadwal.some((jadwal) => {
      if (editId && jadwal.id === editId) return false;
      
      // Jika di Kelas yang sama dan Hari yang sama
      if (jadwal.classId === formData.classId && jadwal.hari === formData.hari) {
        
        // 1. CEK OVERLAP WAKTU
        const isOverlap = (formData.jamMulai < jadwal.jamSelesai) && (formData.jamSelesai > jadwal.jamMulai);
        if (isOverlap) {
          errorMessage = `Gagal! Terdapat jadwal kelas yang bentrok / tumpang tindih waktu di hari ${formData.hari}.`;
          return true; // Hentikan pengecekan, kembalikan error
        }

        // 2. CEK DUPLIKASI MAPEL (Mapel tidak boleh sama di hari yang sama)
        // Format mapel lama (string) jadi array agar aman saat dicek
        const jadwalMapelArray = Array.isArray(jadwal.mapel) 
          ? jadwal.mapel 
          : (typeof jadwal.mapel === 'string' && jadwal.mapel.trim() !== '' ? [jadwal.mapel] : []);
          
        // Cek apakah ada mapel di form yang sudah ada di jadwalMapelArray
        const duplicateMapels = formData.mapel.filter(m => jadwalMapelArray.includes(m));
        
        if (duplicateMapels.length > 0) {
          errorMessage = `Gagal! Mapel (${duplicateMapels.join(', ')}) sudah memiliki jadwal di hari ${formData.hari}.`;
          return true; // Hentikan pengecekan, kembalikan error
        }
      }
      return false;
    });

    if (isInvalid) {
      pemicuNotif(errorMessage, "error");
      return; 
    }

    try {
      const dbRef = editId ? ref(db, `Jadwal/${editId}`) : push(ref(db, 'Jadwal'));
      await set(dbRef, formData);
      pemicuNotif(editId ? "Jadwal berhasil diperbarui!" : "Jadwal baru berhasil ditambahkan!", "success");
      closeModal();
    } catch (error) { 
      pemicuNotif("Gagal menyimpan data jadwal.", "error"); 
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDelete({ show: true, id: id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await remove(ref(db, `Jadwal/${confirmDelete.id}`));
      pemicuNotif("Jadwal berhasil dihapus.", "success");
      
      if (currentJadwal.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      pemicuNotif("Gagal menghapus jadwal.", "error");
    } finally {
      setConfirmDelete({ show: false, id: null });
    }
  };

  const openModal = (jadwal = null) => {
    if (jadwal) {
      setEditId(jadwal.id);
      
      const mapelArray = Array.isArray(jadwal.mapel) 
        ? jadwal.mapel 
        : (typeof jadwal.mapel === 'string' && jadwal.mapel.trim() !== '' ? [jadwal.mapel] : []);

      setFormData({ ...jadwal, mapel: mapelArray });
    } else {
      setEditId(null);
      setFormData({ classId: '', teacherId: '', mapel: [], hari: '', jamMulai: '', jamSelesai: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    card: { 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '24px', 
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    },
    tableHeader: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
      borderBottom: `2px solid ${colors.border}`,
      color: colors.textMuted,
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    select: {
      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', color: colors.textPrimary, 
      marginTop: '5px', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' 
    },
    input: {
      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', 
      border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', 
      color: colors.textPrimary, marginTop: '5px', boxSizing: 'border-box'
    },
    filterContainer: {
      marginBottom: '25px', padding: '20px', 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.015)' : '#f8fafc', 
      borderRadius: '16px', border: `1px solid ${colors.border}`,
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end'
    },
    labelFilter: {
      fontSize: '11px', fontWeight: '800', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.5px'
    },
    filterDropdown: { 
      width: '100%', padding: '12px 36px 12px 38px', borderRadius: '12px', 
      border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', 
      color: colors.textPrimary, fontSize: '13px', fontWeight: '600', appearance: 'none', cursor: 'pointer', outline: 'none',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
    },
    infoBox: {
      padding: '15px', borderRadius: '12px', backgroundColor: colors.primary + '10',
      border: `1px dashed ${colors.primary}`, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px'
    },
    paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', borderTop: `1px solid ${colors.border}` },
    pageBtn: { padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' },
    pageNumber: (active) => ({ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.textPrimary, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }),
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
    <AdminLayout title="Manajemen Jadwal">
      
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
              Apakah Anda yakin ingin menghapus jadwal ini?
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '900', fontSize: '26px' }}>Jadwal Belajar</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '4px' }}>Atur alokasi waktu pengajaran berdasarkan data Kelas</p>
          </div>
          <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', boxShadow: `0 8px 20px ${colors.primary}40` }}>
            <Plus size={20} strokeWidth={3} /> Tambah Jadwal
          </button>
        </div>

        {/* CONTAINER FILTER */}
        <div style={styles.filterContainer}>
          <div>
            <div style={styles.labelFilter}>PILIH KELAS</div>
            <div style={{ position: 'relative' }}>
              <LayoutGrid size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
              <select 
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                style={styles.filterDropdown}
              >
                <option value="">Semua Kelas</option>
                {daftarKelas.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kelas} ({k.jenjang})</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <div style={styles.labelFilter}>PILIH HARI</div>
            <div style={{ position: 'relative' }}>
              <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
              <select 
                value={filterHari}
                onChange={(e) => setFilterHari(e.target.value)}
                style={styles.filterDropdown}
              >
                <option value="">Semua Hari</option>
                {daftarHari.map((hari) => (
                  <option key={hari} value={hari}>{hari}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <div style={styles.labelFilter}>GURU PENGAMPU</div>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
              <select 
                value={filterGuru}
                onChange={(e) => setFilterGuru(e.target.value)}
                style={styles.filterDropdown}
              >
                <option value="">Semua Guru</option>
                {daftarGuru.map((guru) => (
                  <option key={guru.id} value={guru.id}>{guru.nama}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>

          {(filterKelas || filterHari || filterGuru) && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => { setFilterKelas(''); setFilterHari(''); setFilterGuru(''); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #EF444450', backgroundColor: '#EF444410', color: '#EF4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}
              >
                <X size={16} /> Reset Filter
              </button>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '20px 24px', textAlign: 'left' }}>KELAS</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left' }}>MATA PELAJARAN</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left' }}>HARI & WAKTU</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left' }}>GURU PENGAMPU</th>
                  <th style={{ padding: '20px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {currentJadwal.length > 0 ? (
                  currentJadwal.map((j) => (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                      <td style={{ padding: '20px 24px', color: colors.textPrimary, fontWeight: '700' }}>
                        {getLabel(daftarKelas, j.classId, 'kelas')}
                      </td>
                      <td style={{ padding: '20px 24px', color: colors.textPrimary }}>
                        <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ padding: '6px', backgroundColor: colors.primary + '15', borderRadius: '8px' }}>
                             <BookOpen size={14} color={colors.primary} />
                           </div>
                           {Array.isArray(j.mapel) ? j.mapel.join(', ') : (j.mapel || '-')}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', color: colors.textPrimary }}>
                        <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarIcon size={14} color={colors.primary}/> {j.hari}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12}/> {j.jamMulai} - {j.jamSelesai}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', color: colors.textMuted, fontWeight: '600' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ padding: '6px', backgroundColor: colors.border, borderRadius: '8px' }}><User size={14}/></div>
                              {getLabel(daftarGuru, j.teacherId)}
                          </div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(j)} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#3B82F615', border: 'none', color: '#3B82F6', marginRight: '8px', cursor: 'pointer' }}><Edit size={18} /></button>
                        <button onClick={() => handleDeleteClick(j.id)} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#EF444415', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: colors.textMuted, fontWeight: '600' }}>
                      {filterKelas || filterHari || filterGuru ? 'Jadwal tidak ditemukan untuk filter tersebut.' : 'Belum ada data jadwal.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: '600' }}>
                Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredJadwal.length)} dari {filteredJadwal.length} jadwal
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '32px', borderRadius: '28px', width: '100%', maxWidth: '480px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '900', fontSize: '20px' }}>{editId ? 'Edit Jadwal' : 'Buat Jadwal Baru'}</h3>
              <button onClick={closeModal} style={{ background: colors.border, border: 'none', borderRadius: '10px', padding: '5px', cursor: 'pointer' }}><X size={20} color={colors.textPrimary}/></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>PILIH KELAS</label>
                <div style={{ position: 'relative' }}>
                  <LayoutGrid size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                  <select style={styles.select} value={formData.classId} onChange={(e) => handleKelasChange(e.target.value)} required>
                    <option value="">-- Pilih Kelas --</option>
                    {daftarKelas.map(k => <option key={k.id} value={k.id}>{k.nama_kelas} ({k.jenjang})</option>)}
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>MATA PELAJARAN</label>
                <div style={{ 
                  ...styles.input, 
                  height: 'auto', 
                  maxHeight: '160px', 
                  overflowY: 'auto', 
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {!formData.classId ? (
                    <span style={{ color: colors.textMuted, fontSize: '13px' }}>Pilih Kelas Terlebih Dahulu</span>
                  ) : mapelTersediaDiKelas.length === 0 ? (
                    <span style={{ color: colors.textMuted, fontSize: '13px' }}>Belum Ada Mapel di Kelas Ini</span>
                  ) : (
                    mapelTersediaDiKelas.map(m => (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: colors.textPrimary }}>
                        <input
                          type="checkbox"
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: colors.primary }}
                          checked={formData.mapel.includes(m.nama)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            let currentMapel = [...formData.mapel];
                            
                            if (isChecked) {
                              currentMapel.push(m.nama);
                            } else {
                              currentMapel = currentMapel.filter(item => item !== m.nama);
                            }
                            setFormData({...formData, mapel: currentMapel});
                          }}
                        />
                        {m.nama}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {formData.classId && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: colors.primary }}>GURU PENGAMPU OTOMATIS</label>
                  <div style={styles.infoBox}>
                    <UserCheck size={18} color={colors.primary}/>
                    <span style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '700' }}>
                      {getLabel(daftarGuru, formData.teacherId)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '1px' }}>HARI BELAJAR</label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                  <select style={styles.select} value={formData.hari} onChange={(e) => setFormData({...formData, hari: e.target.value})} required>
                    <option value="">-- Pilih Hari --</option>
                    {daftarHari.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                <div>
                   <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>JAM MULAI</label>
                   <div style={{ position: 'relative' }}>
                     <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }}/>
                     <input style={styles.input} type="time" value={formData.jamMulai} onChange={(e) => setFormData({...formData, jamMulai: e.target.value})} required />
                   </div>
                </div>
                <div>
                   <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>JAM SELESAI</label>
                   <div style={{ position: 'relative' }}>
                     <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }}/>
                     <input style={styles.input} type="time" value={formData.jamSelesai} onChange={(e) => setFormData({...formData, jamSelesai: e.target.value})} required />
                   </div>
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '16px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', boxShadow: `0 10px 20px ${colors.primary}40` }}>
                <Save size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> {editId ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminJadwal;