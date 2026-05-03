import React, { useState, useEffect } from 'react';
import GuruLayout from '../../layouts/GuruLayout'; 
import { useTheme } from '../../context/ThemeContext';
import { db, auth } from '../../api/firebase';
import { ref, onValue, remove, update, query, limitToLast } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, MessageSquare, Clock, AlertCircle, 
  Trash2, ClipboardCheck 
} from 'lucide-react';

const Notifikasi = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Dengerin status login dulu biar UID gak undefined
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Login sebagai:", user.uid);
        
        // 2. Kalau user ada, baru dengerin database Notifikasi
        const notifRef = query(ref(db, `Notifikasi/${user.uid}`), limitToLast(50));
        const unsubscribeNotif = onValue(notifRef, (snapshot) => {
          const data = snapshot.val();
          console.log("Data Notif dari DB:", data);
          
          if (data) {
            const list = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            })).sort((a, b) => b.createdAt - a.createdAt); 
            setNotifications(list);
          } else {
            setNotifications([]);
          }
          setLoading(false);
        });

        // Bersihkan listener database saat component gak dipake
        return () => unsubscribeNotif();
      } else {
        console.log("User belum login");
        setLoading(false);
        // navigate('/Login'); // Opsional: paksa ke login
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleItemClick = async (notif) => {
    const user = auth.currentUser;
    if(!user) return;

    // Tandai sudah dibaca di database
    await update(ref(db, `Notifikasi/${user.uid}/${notif.id}`), { isRead: true });

    // Navigasi otomatis sesuai tipe
    if (notif.type === "PR") navigate('/Guru/Tanya-PR');
    else if (notif.type === "TAMBAHAN") navigate('/Guru/Tambahan-Belajar');
    else if (notif.type === "TUGAS") navigate('/Guru/Rekap-Nilai');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    const user = auth.currentUser;
    if (user && window.confirm("Hapus notifikasi ini?")) {
      await remove(ref(db, `Notifikasi/${user.uid}/${id}`));
    }
  };

  const filteredNotif = notifications.filter(n => {
    if (filter === "Semua") return true;
    if (filter === "Belum Dibaca") return !n.isRead;
    return n.type === filter;
  });

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    filterBar: { display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' },
    filterBtn: (isActive) => ({
      padding: '8px 20px', borderRadius: '20px', border: `1px solid ${isActive ? colors.primary : colors.border}`,
      backgroundColor: isActive ? colors.primary : 'transparent', color: isActive ? '#fff' : colors.textMuted,
      cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: '0.2s', whiteSpace: 'nowrap'
    }),
    card: (isRead) => ({
      display: 'flex', gap: '15px', padding: '18px', cursor: 'pointer',
      backgroundColor: isRead ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(11, 61, 89, 0.03)'),
      borderBottom: `1px solid ${colors.border}`, position: 'relative', transition: '0.2s', alignItems: 'center'
    }),
    iconWrapper: (type) => ({
      width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      backgroundColor: type === 'PR' ? '#3b82f615' : type === 'TAMBAHAN' ? '#f59e0b15' : '#10b98115',
      color: type === 'PR' ? '#3b82f6' : type === 'TAMBAHAN' ? '#f59e0b' : '#10b981'
    })
  };

  return (
    <GuruLayout title="Notifikasi">
      <div style={styles.container}>
        {/* Filter Tab */}
        <div style={styles.filterBar}>
          {["Semua", "Belum Dibaca", "PR", "TAMBAHAN", "TUGAS"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={styles.filterBtn(filter === f)}>{f}</button>
          ))}
        </div>

        {/* List Card */}
        <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          {loading ? (
            <div style={{padding:'50px', textAlign:'center', color: colors.textMuted}}>Memuat Notifikasi...</div>
          ) : filteredNotif.length > 0 ? filteredNotif.map((n) => (
            <div key={n.id} style={styles.card(n.isRead)} onClick={() => handleItemClick(n)}>
              <div style={styles.iconWrapper(n.type)}>
                {n.type === 'PR' ? <MessageSquare size={22} /> : n.type === 'TAMBAHAN' ? <Clock size={22} /> : <ClipboardCheck size={22} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: colors.textPrimary, fontWeight: n.isRead ? '600' : '800' }}>{n.title}</h4>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMuted, lineHeight: '1.4' }}>{n.message}</p>
              </div>
              
              {/* FIX: Syntax Trash2 sudah diperbaiki pakai '=' */}
              <button onClick={(e) => handleDelete(e, n.id)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '5px' }}>
                <Trash2 size={16} />
              </button>

              {!n.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', position: 'absolute', left: '6px', top: '24px' }} />}
            </div>
          )) : (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: colors.textMuted }}>
              <Bell size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
              <p>Tidak ada notifikasi untuk filter ini.</p>
            </div>
          )}
        </div>
      </div>
    </GuruLayout>
  );
};

export default Notifikasi;