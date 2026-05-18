import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, remove, query, orderByChild } from 'firebase/database';
import { Trash2, Bell, Clock, User, Calendar, BellOff, Filter, BookOpen, XCircle, CalendarDays } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminNotifikasi = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarNotifikasi, setDaftarNotifikasi] = useState([]);
  const [filterAktivitas, setFilterAktivitas] = useState('Semua'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const notifRef = query(ref(db, 'Notifications'), orderByChild('timestamp'));
    
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .reverse(); 
        setDaftarNotifikasi(list);
      } else {
        setDaftarNotifikasi([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Logika Filter Data
  const notifikasiDifilter = daftarNotifikasi.filter((notif) => {
    if (filterAktivitas === 'Semua') return true;
    
    // Pengecekan aman jika aktivitas kosong/undefined
    const aktivitasStr = notif.aktivitas ? notif.aktivitas.toLowerCase() : '';
    
    // Logika khusus untuk masing-masing filter
    if (filterAktivitas === 'bulanan') {
      return aktivitasStr.includes('bulanan');
    }
    if (filterAktivitas === 'pendaftaran les') {
      return aktivitasStr.includes('pendaftaran') && !aktivitasStr.includes('akun');
    }
    
    return aktivitasStr.includes(filterAktivitas.toLowerCase());
  });

  const handleDelete = async (id) => {
    if (window.confirm("Hapus catatan notifikasi ini?")) {
      try {
        await remove(ref(db, `Notifications/${id}`));
      } catch (error) {
        alert("Gagal menghapus notifikasi.");
      }
    }
  };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    filterContainer: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      overflowX: 'auto',
      paddingBottom: '10px',
      scrollbarWidth: 'none',
    },
    filterBtn: (isActive) => ({
      padding: '8px 16px',
      borderRadius: '20px',
      border: `1px solid ${isActive ? colors.primary : colors.border}`,
      backgroundColor: isActive ? colors.primary : colors.cardBg,
      color: isActive ? '#FFF' : colors.textMuted,
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
    }),
    notifCard: {
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: '0.2s'
    },
    iconBadge: (type) => ({
      width: '45px',
      height: '45px',
      borderRadius: '12px',
      backgroundColor: type?.toLowerCase().includes('ditolak') ? '#EF444415' : colors.primary + '15',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: type?.toLowerCase().includes('ditolak') ? '#EF4444' : colors.primary,
      marginRight: '15px'
    })
  };

  return (
    <AdminLayout title="Notifikasi Sistem">
      <div style={styles.container}>
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Log Aktivitas</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Pantau riwayat pendaftaran dan pembayaran</p>
        </div>

        {/* Toolbar Filter */}
        <div style={styles.filterContainer}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '5px', color: colors.textMuted }}>
            <Filter size={18} />
          </div>
          
          <button style={styles.filterBtn(filterAktivitas === 'Semua')} onClick={() => setFilterAktivitas('Semua')}>
            Semua
          </button>

          <button style={styles.filterBtn(filterAktivitas === 'Register')} onClick={() => setFilterAktivitas('Register')}>
            Pendaftaran Akun
          </button>

          <button style={styles.filterBtn(filterAktivitas === 'pendaftaran les')} onClick={() => setFilterAktivitas('pendaftaran les')}>
            <BookOpen size={14} /> Pendaftaran Les
          </button>

          <button style={styles.filterBtn(filterAktivitas === 'bulanan')} onClick={() => setFilterAktivitas('bulanan')}>
            <CalendarDays size={14} /> Pembayaran Bulanan
          </button>

          <button style={styles.filterBtn(filterAktivitas === 'ditolak')} onClick={() => setFilterAktivitas('ditolak')}>
            <XCircle size={14} /> Ditolak
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: colors.textMuted }}>Memuat data...</p>
        ) : notifikasiDifilter.length > 0 ? (
          notifikasiDifilter.map((notif) => (
            <div key={notif.id} style={styles.notifCard} className="notif-item">
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={styles.iconBadge(notif.aktivitas)}>
                  {notif.aktivitas?.toLowerCase().includes('ditolak') ? <XCircle size={22} /> : <Bell size={22} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: colors.textPrimary, margin: '0 0 5px 0', textTransform: 'capitalize' }}>
                    {notif.aktivitas}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', fontSize: '12px', color: colors.textMuted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={14} /> {notif.nama_user || 'Anonim'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} /> 
                      {/* Cek apakah tanggal mengandung T (format ISO) atau langsung dirender */}
                      {notif.tanggal ? (notif.tanggal.includes('T') ? new Date(notif.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : notif.tanggal) : '-'}
                    </div>

                    {/* MENAMPILKAN BULAN YANG DIBAYAR SESUAI DATA FIREBASE */}
                    {(notif.bulan_dibayar || notif.bulan) && (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '5px', 
                        color: colors.primary, fontWeight: '800', 
                        backgroundColor: colors.primary + '15', 
                        padding: '4px 10px', borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        <CalendarDays size={12} /> Bulan: {notif.bulan_dibayar || notif.bulan}
                      </div>
                    )}

                    {notif.keterangan && (
                       <div style={{ color: '#EF4444', fontWeight: '600' }}>
                         • {notif.keterangan}
                       </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button onClick={() => handleDelete(notif.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '5px', marginLeft: '15px' }}>
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: colors.textMuted }}>
            <BellOff size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <p>Tidak ada notifikasi yang sesuai dengan filter.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotifikasi;