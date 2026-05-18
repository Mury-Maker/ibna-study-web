import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { 
  UserCheck, UserPlus, Mail, Calendar, UserX, 
  Info, CreditCard, X, CheckCircle, ChevronLeft, ChevronRight,
  Filter, ChevronDown, AlertCircle, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const ManajemenUser = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarUser, setDaftarUser] = useState([]);
  const [daftarSiswa, setDaftarSiswa] = useState([]); 
  const [activeTab, setActiveTab] = useState('not student'); 
  const [loading, setLoading] = useState(true);

  // State untuk Modal Pembayaran
  const [paymentModalData, setPaymentModalData] = useState(null);

  // --- STATE PAGINATION & FILTER ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); 
  const [filterJenjang, setFilterJenjang] = useState('');

  // --- STATE NOTIFIKASI & KONFIRMASI HAPUS/NONAKTIF ---
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  const [confirmDisable, setConfirmDisable] = useState({ show: false, id: null });

  // Fungsi Pemicu Notifikasi Melayang (Toast)
  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    // 1. Ambil Data Auth Users
    const userRef = ref(db, 'Users');
    const unsubscribeUsers = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarUser(list);
      } else {
        setDaftarUser([]);
      }
      setLoading(false);
    });

    // 2. Ambil Data Detail Siswa (Untuk Kelas & Tanggal Bergabung)
    const siswaRef = ref(db, 'Siswa');
    const unsubscribeSiswa = onValue(siswaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarSiswa(list);
      } else {
        setDaftarSiswa([]);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSiswa();
    };
  }, []);

  const getSiswaData = (userId) => {
    return daftarSiswa.find(s => s.userId === userId) || null;
  };

  // --- LOGIKA FILTER TAB & JENJANG ---
  const filteredUsers = daftarUser.filter(user => {
    // Filter berdasarkan Tab
    if (activeTab === 'not student') {
      if (user.role !== 'not student' && !!user.role) return false;
    } else {
      if (user.role !== activeTab) return false;
    }

    // Filter berdasarkan Jenjang (Hanya berlaku di tab Siswa Aktif)
    if (activeTab === 'Siswa' && filterJenjang !== '') {
      const siswaData = getSiswaData(user.id);
      if (!siswaData || String(siswaData.jenjang || '').toLowerCase() !== filterJenjang.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Reset pagination ke halaman pertama jika berpindah Tab atau Filter diubah
  useEffect(() => {
    setCurrentPage(1);
    // Reset filter jenjang jika keluar dari tab Siswa Aktif
    if (activeTab !== 'Siswa') setFilterJenjang('');
  }, [activeTab, filterJenjang]);

  // --- LOGIKA PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // --- HANDLER KONFIRMASI NONAKTIFKAN PENGGUNA ---
  const handleDisableClick = (id) => {
    setConfirmDisable({ show: true, id: id });
  };

  const executeDisable = async () => {
    if (!confirmDisable.id) return;
    try {
      await update(ref(db, `Users/${confirmDisable.id}`), { role: 'inactive' });
      pemicuNotif("Pengguna berhasil dipindahkan ke daftar Inactive.", "success");
      
      // Jika data terakhir di halaman saat ini dipindahkan, mundur 1 halaman
      if (currentUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      pemicuNotif("Gagal memperbarui status pengguna.", "error");
    } finally {
      setConfirmDisable({ show: false, id: null });
    }
  };

  // --- FUNGSI MENGAMBIL RIWAYAT SPP BULANAN ---
  const openPaymentModal = async (user) => {
    setPaymentModalData({ user, loading: true, payments: [] });
    
    try {
      const snap = await get(ref(db, 'PembayaranLes'));
      
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }))
          .filter(p => p.userId === user.id)
          .filter(p => {
             const jenis = String(p.jenis || '').toLowerCase();
             const status = String(p.status || '').toLowerCase();
             const isVerified = status === 'diterima' || status === 'lunas' || status === 'sukses' || status === '';
             return jenis === 'bulanan' && isVerified;
          })
          .sort((a, b) => {
             const dateA = new Date(a.tanggal_upload || a.tanggal_pembayaran || 0).getTime();
             const dateB = new Date(b.tanggal_upload || b.tanggal_pembayaran || 0).getTime();
             return dateB - dateA;
          });
        
        setPaymentModalData({ user, loading: false, payments: list });
      } else {
        setPaymentModalData({ user, loading: false, payments: [] });
      }
    } catch (error) {
      console.error("Gagal mengambil data pembayaran:", error);
      setPaymentModalData({ user, loading: false, payments: [] });
    }
  };

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return '-';
    if (typeof dateVal === 'string' && isNaN(Number(dateVal)) && !dateVal.includes('T')) return dateVal;
    
    const date = new Date(typeof dateVal === 'string' && !isNaN(Number(dateVal)) ? Number(dateVal) : dateVal);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString('id-ID', { dateStyle: 'medium' });
  };

  // Dapatkan daftar jenjang unik dari tabel siswa
  const uniqueJenjang = [...new Set(daftarSiswa.map(s => s.jenjang).filter(Boolean))];

  const styles = {
    container: { padding: '24px', animation: 'fadeIn 0.3s ease' },
    tabContainer: { 
      display: 'flex', gap: '8px', marginBottom: '15px', 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      padding: '6px', borderRadius: '14px', width: 'fit-content', flexWrap: 'wrap'
    },
    tabBtn: (isActive) => ({
      padding: '10px 20px', borderRadius: '10px', border: 'none',
      backgroundColor: isActive ? colors.cardBg : 'transparent',
      color: isActive ? colors.primary : colors.textMuted,
      cursor: 'pointer', fontWeight: '700', fontSize: '14px',
      transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px',
      boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
    }),
    card: { 
      backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, 
      borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
    },
    badge: (type) => ({
      padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
      backgroundColor: type === 'Siswa' ? '#10B98115' : '#64748B15',
      color: type === 'Siswa' ? '#10B981' : '#64748B',
      textTransform: 'uppercase'
    }),
    filterSelect: {
      width: '100%', padding: '8px 30px 8px 32px', borderRadius: '8px', border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: colors.textPrimary, 
      fontSize: '13px', fontWeight: '600', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' 
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
    modalOverlay: {
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000, padding: '20px'
    },
    modalContent: {
      backgroundColor: colors.cardBg, padding: '30px 20px', borderRadius: '20px', 
      width: '100%', maxWidth: '400px', textAlign: 'center', 
      border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    },
    btnCancel: { padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', flex: 1 },
    btnConfirmDisable: { padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: '#fff', cursor: 'pointer', fontWeight: '700', flex: 1 }
  };

  return (
    <AdminLayout title="Manajemen Pengguna">
      
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

      {/* CUSTOM MODAL KONFIRMASI NONAKTIFKAN */}
      {confirmDisable.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#EF444415', borderRadius: '50%' }}>
                <AlertTriangle size={40} color="#EF4444" />
              </div>
            </div>
            <h3 style={{ color: colors.textPrimary, margin: '0 0 10px 0', fontWeight: '800' }}>Konfirmasi Nonaktifkan</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin memindahkan pengguna ini ke daftar Inactive? Pengguna tidak akan bisa mengakses sistem sebagai siswa aktif.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDisable({ show: false, id: null })} style={styles.btnCancel}>
                Batal
              </button>
              <button onClick={executeDisable} style={styles.btnConfirmDisable}>
                Ya, Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800', fontSize: '24px' }}>Database Pengguna</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', marginTop: '4px' }}>
            {activeTab === 'not student' && "Daftar pengguna yang baru melakukan registrasi akun."}
            {activeTab === 'Siswa' && "Siswa yang telah terverifikasi dan aktif belajar beserta data kelasnya."}
            {activeTab === 'inactive' && "Pengguna yang telah dinonaktifkan dari sistem."}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          {/* Tab Navigation */}
          <div style={styles.tabContainer}>
            <button style={styles.tabBtn(activeTab === 'not student')} onClick={() => setActiveTab('not student')}>
              <UserPlus size={18} /> Calon Siswa
            </button>
            <button style={styles.tabBtn(activeTab === 'Siswa')} onClick={() => setActiveTab('Siswa')}>
              <UserCheck size={18} /> Siswa Aktif
            </button>
            <button style={styles.tabBtn(activeTab === 'inactive')} onClick={() => setActiveTab('inactive')}>
              <UserX size={18} /> Inactive
            </button>
          </div>

          {/* Filter Jenjang (Hanya Tampil di Tab Siswa) */}
          {activeTab === 'Siswa' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ position: 'relative', width: '200px' }}>
                <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                <select 
                  value={filterJenjang}
                  onChange={(e) => setFilterJenjang(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">Semua Jenjang</option>
                  {uniqueJenjang.map((jenjang, idx) => (
                    <option key={idx} value={jenjang}>{jenjang.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
              </div>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left', color: colors.textMuted, fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>DATA PENGGUNA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left', color: colors.textMuted, fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>INFO KONTAK</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left', color: colors.textMuted, fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>STATUS</th>
                  {activeTab === 'Siswa' && <th style={{ padding: '18px 24px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>AKSI & SPP</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Memuat data...</td></tr>
                ) : currentUsers.map((user) => {
                   
                   const isSiswa = activeTab === 'Siswa' || user.role === 'Siswa';
                   const siswaData = isSiswa ? getSiswaData(user.id) : null;
                   
                   const displayDate = siswaData ? (siswaData.tanggal_bergabung || siswaData.createdAt) : user.tanggal_daftar;
                   const dateLabel = isSiswa && siswaData ? 'Menjadi Siswa:' : 'Terdaftar:';
                   
                   return (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ color: colors.textPrimary, fontWeight: '700', fontSize: '15px' }}>
                            {siswaData ? (siswaData.nama_siswa || user.nama) : (user.nama_lengkap || user.nama)}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {dateLabel} {formatDateSafe(displayDate)}
                          </div>
                          {siswaData && siswaData.nama_kelas && (
                            <div style={{ color: colors.primary, fontSize: '11px', marginTop: '6px', fontWeight: '800', backgroundColor: colors.primary+'15', padding: '3px 8px', borderRadius: '6px', width: 'fit-content' }}>
                              KELAS: {siswaData.nama_kelas.toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ color: colors.textPrimary, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} color={colors.primary} /> {user.email}
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                           <span style={styles.badge(activeTab === 'Siswa' ? 'Siswa' : 'Lainnya')}>
                             {activeTab === 'not student' ? 'Pending' : activeTab}
                           </span>
                        </td>
                        
                        {activeTab === 'Siswa' && (
                          <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button 
                                  onClick={() => openPaymentModal(user)} 
                                  style={{ 
                                    padding: '8px 14px', borderRadius: '10px', border: 'none', 
                                    backgroundColor: '#3B82F615', color: '#3B82F6', 
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', 
                                    gap: '6px', fontSize: '12px', fontWeight: '800', transition: '0.2s'
                                  }}
                                >
                                  <CreditCard size={16} /> SPP Bulanan
                                </button>
                                
                                <button 
                                  onClick={() => handleDisableClick(user.id)} 
                                  style={{ 
                                    padding: '8px 14px', borderRadius: '10px', border: 'none', 
                                    backgroundColor: '#EF444415', color: '#EF4444', 
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', 
                                    gap: '6px', fontSize: '12px', fontWeight: '800', transition: '0.2s'
                                  }}
                                >
                                  <UserX size={16} /> Nonaktifkan
                                </button>
                            </div>
                          </td>
                        )}
                      </tr>
                   );
                })}
              </tbody>
            </table>
            
            {!loading && currentUsers.length === 0 && (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: colors.textMuted }}>
                <Info size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontWeight: '600' }}>Tidak ada data pada kategori ini.</p>
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <span style={{ fontSize: '13px', color: colors.textMuted }}>
                Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} dari {filteredUsers.length} pengguna
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

      {/* MODAL RIWAYAT PEMBAYARAN SPP */}
      {paymentModalData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxSizing: 'border-box', border: `1px solid ${colors.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <div>
                 <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '900', fontSize: '20px' }}>Riwayat SPP Bulanan</h3>
                 <p style={{ color: colors.textMuted, fontSize: '14px', margin: '4px 0 0', fontWeight: '600' }}>{getSiswaData(paymentModalData.user.id)?.nama_siswa || paymentModalData.user.nama}</p>
              </div>
              <button onClick={() => setPaymentModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
            </div>
            
            {paymentModalData.loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted, fontWeight: '600' }}>Memuat riwayat pembayaran...</div>
            ) : paymentModalData.payments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {paymentModalData.payments.map((pay, i) => (
                        <div key={i} style={{ padding: '16px', borderRadius: '16px', border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: colors.primary, textTransform: 'uppercase' }}>
                                  {pay.bulan || pay.bulan_dibayar || '-'}
                                </div>
                                <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px', fontWeight: '600' }}>
                                  Tgl Bayar: {formatDateSafe(pay.tanggal_pembayaran || pay.tanggal_upload || pay.tanggal)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: '#10B981' }}>
                                  Rp {Number(pay.jumlah_pembayaran || pay.nominal || 0).toLocaleString('id-ID')}
                                </div>
                                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '6px' }}>
                                    <CheckCircle size={12} /> LUNAS
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '50px 20px', textAlign: 'center', color: colors.textMuted }}>
                    <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.3, margin: '0 auto' }} />
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>Belum ada riwayat SPP.</p>
                    <p style={{ margin: '6px 0 0', fontWeight: '500', fontSize: '13px' }}>Siswa ini belum menyelesaikan pembayaran bulanan apa pun.</p>
                </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        tbody tr:hover { background-color: ${isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} }
      `}</style>
    </AdminLayout>
  );
};

export default ManajemenUser;