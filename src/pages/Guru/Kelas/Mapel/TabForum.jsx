import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { db, auth } from '../../../../api/firebase';
import { ref, onValue, push, set, serverTimestamp, remove } from 'firebase/database';
import { FileText, ClipboardList, User, ChevronRight, Send, MoreVertical, Megaphone } from 'lucide-react';

const TabForum = ({ mapelId, kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [feeds, setFeeds] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [commentText, setCommentText] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    if (!mapelId) return;
    const kontenRef = ref(db, 'Konten');
    
    const unsubscribe = onValue(kontenRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }))
          .filter(item => item.mapelId === mapelId && item.status === "Terbit")
          .sort((a, b) => {
            const getTime = (val) => {
              if (!val) return 0;
              if (typeof val === 'number') return val;
              if (typeof val === 'object' && val.seconds) return val.seconds * 1000;
              return new Date(val).getTime() || 0;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
          });
        setFeeds(list);
      } else { setFeeds([]); }
    });
    return () => unsubscribe();
  }, [mapelId]);

  const handlePost = async () => {
    if (!newAnnouncement.trim()) return;
    const annRef = push(ref(db, 'Konten'));
    await set(annRef, { 
      judul: "PENGUMUMAN", deskripsi: newAnnouncement, mapelId, kelasId, 
      tipeKonten: "Pengumuman", status: "Terbit", createdAt: serverTimestamp(), 
      author: auth.currentUser?.displayName || "Guru" 
    });
    setNewAnnouncement("");
  };

  const styles = {
    card: { backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '20px 24px', marginBottom: '16px', position: 'relative' },
    miniBox: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 18px', borderRadius: '12px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb', border: `1px solid ${colors.border}`, cursor: 'pointer', marginTop: '12px' },
    // FIX: Tombol Posting Ringkas
    btnPosting: {
      backgroundColor: colors.primary, color: '#fff', border: 'none', 
      padding: '8px 20px', borderRadius: '8px', fontWeight: '700', 
      fontSize: '13px', cursor: 'pointer', transition: '0.2s'
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Box Input Posting */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: colors.primary + '20', color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={18} />
          </div>
          <input 
            value={newAnnouncement} 
            onChange={(e) => setNewAnnouncement(e.target.value)} 
            placeholder="Sampaikan sesuatu ke kelas..." 
            style={{ flex: 1, border: 'none', background: 'transparent', color: colors.textPrimary, outline: 'none', fontSize: '15px' }} 
          />
          <button onClick={handlePost} style={styles.btnPosting}>Posting</button>
        </div>
      </div>

      {feeds.map((item) => (
        <div key={item.id} style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color={colors.textMuted} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: colors.primary }}>{item.judul?.toUpperCase()}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>
                  {item.createdAt ? new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleString('id-ID') : 'Baru saja'}
                </div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <MoreVertical size={20} color={colors.textMuted} cursor="pointer" onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} />
              {activeMenu === item.id && (
                <div style={{ position: 'absolute', top: '35px', right: '0', backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '8px', zIndex: 10, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <div onClick={() => { if(window.confirm("Hapus postingan?")) remove(ref(db, `Konten/${item.id}`)); }} style={{ padding: '10px 15px', fontSize: '13px', color: '#ef4444', cursor: 'pointer', fontWeight: '700' }}>Hapus</div>
                </div>
              )}
            </div>
          </div>

          {item.tipeKonten === "Pengumuman" && (
            <p style={{ color: colors.textPrimary, fontSize: '15px', margin: '0 0 10px 0', lineHeight: '1.6' }}>{item.deskripsi}</p>
          )}

          {item.tipeKonten !== "Pengumuman" && (
            <div style={styles.miniBox} onClick={() => navigate(`/Guru/Kelas/${kelasId}/Mapel/${mapelId}/Detail/${item.id}`)}>
              <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: item.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981', color: '#fff' }}>
                {item.tipeKonten === 'Tugas' ? <ClipboardList size={22} /> : <FileText size={22} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: colors.textPrimary, fontSize: '16px', fontWeight: '800' }}>Buka {item.tipeKonten === 'Tugas' ? 'Kuis' : 'Materi'}</div>
                <div style={{ color: colors.textMuted, fontSize: '12px' }}>Klik untuk detail lengkap</div>
              </div>
              <ChevronRight size={18} color={colors.border} />
            </div>
          )}

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              value={commentText[item.id] || ""} 
              onChange={(e) => setCommentText({...commentText, [item.id]: e.target.value})}
              placeholder="Tambahkan komentar kelas..." 
              style={{ flex: 1, border: 'none', background: 'transparent', color: colors.textPrimary, outline: 'none', fontSize: '14px' }} 
            />
            <Send size={18} color={colors.primary} cursor='pointer' onClick={() => {
              const text = commentText[item.id];
              if (!text?.trim()) return;
              const commentRef = push(ref(db, `Komentar/${item.id}`));
              set(commentRef, { text, author: auth.currentUser?.displayName || "Guru", createdAt: serverTimestamp() });
              setCommentText({...commentText, [item.id]: ""});
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TabForum;