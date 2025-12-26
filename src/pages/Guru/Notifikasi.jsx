import React, { useState } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  Bell, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  MoreHorizontal,
  Circle
} from 'lucide-react';

const Notifikasi = () => {
  const { colors, isDarkMode } = useTheme();
  const [filter, setFilter] = useState("Semua");

  // Data Dummy Notifikasi
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      tipe: "PR",
      judul: "Pertanyaan PR Baru",
      pesan: "Aditya Pratama (XII-IPA-1) mengirimkan pertanyaan baru di menu Tanya PR.",
      waktu: "5 Menit yang lalu",
      isRead: false,
    },
    {
      id: 2,
      tipe: "Tambahan",
      judul: "Pengajuan Jam Tambahan",
      pesan: "Budi Santoso mengajukan jam tambahan belajar untuk besok pukul 15:30.",
      waktu: "1 Jam yang lalu",
      isRead: false,
    },
    {
      id: 3,
      tipe: "Sistem",
      judul: "Rekap Nilai Bulanan",
      pesan: "Jangan lupa melakukan rekap nilai kelas XI-IPS-1 untuk bulan Desember.",
      waktu: "3 Jam yang lalu",
      isRead: true,
    },
    {
      id: 4,
      tipe: "PR",
      judul: "Jawaban Disukai",
      pesan: "Siswa menyukai pembahasan PR yang Anda berikan pada materi Trigonometri.",
      waktu: "Kemarin",
      isRead: true,
    }
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
      gap: '15px',
      flexWrap: 'wrap'
    },
    filterBar: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      overflowX: 'auto',
      paddingBottom: '5px'
    },
    filterBtn: (isActive) => ({
      padding: '8px 16px',
      borderRadius: '20px',
      border: `1px solid ${isActive ? colors.primary : colors.border}`,
      backgroundColor: isActive ? colors.primary : 'transparent',
      color: isActive ? '#fff' : colors.textMuted,
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: '0.2s',
      whiteSpace: 'nowrap'
    }),
    notifCard: (isRead) => ({
      display: 'flex',
      gap: '15px',
      padding: '18px',
      backgroundColor: isRead ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11, 61, 89, 0.03)'),
      borderBottom: `1px solid ${colors.border}`,
      transition: '0.2s',
      position: 'relative',
      cursor: 'pointer'
    }),
    iconBox: (tipe) => ({
      width: '45px',
      height: '45px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      backgroundColor: tipe === 'PR' ? 'rgba(96, 165, 250, 0.1)' : 
                       tipe === 'Tambahan' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      color: tipe === 'PR' ? '#60a5fa' : 
             tipe === 'Tambahan' ? '#f59e0b' : '#10b981'
    }),
    unreadDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#ef4444',
      position: 'absolute',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)'
    }
  };

  const filteredNotif = notifications.filter(n => {
    if (filter === "Semua") return true;
    if (filter === "Belum Dibaca") return !n.isRead;
    return n.tipe === filter;
  });

  return (
    <GuruLayout title="Notifikasi">
      <div style={styles.container}>
        
        <div style={styles.header}>
          <div>
            <h2 style={{ color: colors.textPrimary, margin: 0, fontSize: '24px', fontWeight: '800' }}>Pusat Notifikasi</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px' }}>Pantau semua aktivitas siswa dan sistem di sini.</p>
          </div>
          <button 
            style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
            onClick={handleMarkAllRead}
          >
            Tandai semua dibaca
          </button>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          {["Semua", "Belum Dibaca", "PR", "Tambahan", "Sistem"].map((item) => (
            <button 
              key={item} 
              style={styles.filterBtn(filter === item)}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* List Notifikasi */}
        <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          {filteredNotif.length > 0 ? filteredNotif.map((notif) => (
            <div key={notif.id} style={styles.notifCard(notif.isRead)} className="notif-item">
              <div style={styles.iconBox(notif.tipe)}>
                {notif.tipe === 'PR' && <MessageSquare size={22} />}
                {notif.tipe === 'Tambahan' && <Clock size={22} />}
                {notif.tipe === 'Sistem' && <Bell size={22} />}
              </div>

              <div style={{ flex: 1, paddingRight: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, color: colors.textPrimary, fontSize: '15px', fontWeight: notif.isRead ? '600' : '800' }}>
                    {notif.judul}
                  </h4>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>{notif.waktu}</span>
                </div>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: '14px', lineHeight: '1.4' }}>
                  {notif.pesan}
                </p>
              </div>

              {!notif.isRead && <div style={styles.unreadDot} />}
              
              <button 
                style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '5px' }}
                onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )) : (
            <div style={{ padding: '60px', textAlign: 'center', color: colors.textMuted }}>
              <Bell size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
              <p>Tidak ada notifikasi untuk kategori ini.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .notif-item:hover { background-color: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'} !important; }
      `}</style>
    </GuruLayout>
  );
};

export default Notifikasi;