import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuruLayout from '../../../../layouts/GuruLayout';
import { useTheme } from '../../../../context/ThemeContext';
import { db, auth } from '../../../../api/firebase';
import { ref, onValue, push, set, serverTimestamp, update } from 'firebase/database';
import { ChevronLeft, FileText, ClipboardList, Send, CheckCircle2, Info, Eye, EyeOff, MessageSquareOff, MessageSquare, MessageCircle } from 'lucide-react';

const KontenDetail = () => {
  const { kontenId } = useParams();
  const navigate = useNavigate();
  const { colors, isDarkMode } = useTheme();
  
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSoalMobile, setShowSoalMobile] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    
    const detailRef = ref(db, `Konten/${kontenId}`);
    onValue(detailRef, (snap) => {
      if (snap.exists()) setData(snap.val());
    });

    const commentRef = ref(db, `Komentar/${kontenId}`);
    onValue(commentRef, (snap) => {
      const val = snap.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }))
          .sort((a, b) => a.createdAt - b.createdAt);
        setComments(list);
      } else { setComments([]); }
    });

    return () => window.removeEventListener('resize', handleResize);
  }, [kontenId]);

  const toggleDiskusi = async () => {
    const detailRef = ref(db, `Konten/${kontenId}`);
    await update(detailRef, { diskusiAktif: data.diskusiAktif === false });
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const commentRef = push(ref(db, `Komentar/${kontenId}`));
    await set(commentRef, {
      text: newComment,
      author: auth.currentUser?.displayName || "Guru",
      createdAt: serverTimestamp()
    });
    setNewComment("");
  };

  if (!data) return <div style={{ textAlign: 'center', padding: '100px', color: colors.textMuted }}>Memuat Detail...</div>;

  const displayComments = showAllComments ? comments : comments.slice(-5);

  const styles = {
    mainLayout: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '25px', alignItems: 'flex-start' },
    contentArea: { flex: 1, backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: isMobile ? '20px' : '30px', width: '100%', boxSizing: 'border-box' },
    
    // FIX: Sidebar height dibatasi agar input tidak tenggelam
    sidebar: { 
      width: isMobile ? '100%' : '380px', 
      backgroundColor: colors.cardBg, 
      borderRadius: '16px', 
      border: `1px solid ${colors.border}`, 
      maxHeight: isMobile ? 'none' : 'calc(100vh - 180px)', // Desktop: ikut tinggi layar
      display: 'flex', 
      flexDirection: 'column', 
      position: isMobile ? 'static' : 'sticky', 
      top: '20px',
      overflow: 'hidden' 
    },
    
    // FIX: Box Komentar dibatasi tingginya
    commentBox: { 
      flex: 1, 
      overflowY: 'auto', 
      padding: '15px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      height: isMobile ? '350px' : 'auto', // Mobile: fix height agar tidak scroll panjang
      maxHeight: isMobile ? '350px' : 'none'
    },
    
    inputArea: { padding: '15px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '10px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff' },
    bubble: { padding: '10px 15px', borderRadius: '12px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: colors.textPrimary, fontSize: '14px' },
    btnToggle: { width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.primary}`, backgroundColor: 'transparent', color: colors.primary, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
    btnControl: { padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }
  };

  return (
    <GuruLayout title={data.tipeKonten === 'Tugas' ? 'Pratinjau Kuis' : 'Pratinjau Materi'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
          <ChevronLeft size={18} /> Kembali
        </button>
        
        <button 
          onClick={toggleDiskusi}
          style={{ ...styles.btnControl, backgroundColor: data.diskusiAktif !== false ? '#fee2e2' : '#dcfce7', color: data.diskusiAktif !== false ? '#ef4444' : '#10b981' }}
        >
          {data.diskusiAktif !== false ? <MessageSquareOff size={16}/> : <MessageSquare size={16}/>}
          {data.diskusiAktif !== false ? "Nonaktifkan Diskusi" : "Aktifkan Diskusi"}
        </button>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.contentArea}>
          {/* Header Konten */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: data.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981', color: '#fff' }}>
                {data.tipeKonten === 'Tugas' ? <ClipboardList size={24} /> : <FileText size={24} />}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800', color: colors.textPrimary }}>{data.judul}</h1>
                <p style={{ margin: '5px 0 0 0', color: colors.textMuted, fontSize: '12px' }}>
                    {data.tipeTugas || 'Materi'} • Tenggat: {data.tenggat ? data.tenggat.replace('T', ' ') : 'Tidak ada'}
                </p>
              </div>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: '800' }}>TOTAL SKOR</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: colors.primary }}>{data.poinMaksimal || 0}</div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: colors.border, marginBottom: '25px' }} />
          <h3 style={{ color: colors.textMuted, fontSize: '12px', fontWeight: '800', letterSpacing: '1px', marginBottom: '10px' }}>INSTRUKSI</h3>
          <p style={{ color: colors.textPrimary, fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: isMobile ? '20px' : '30px' }}>{data.deskripsi || 'Tidak ada instruksi.'}</p>

          {isMobile && data.pertanyaan && (
            <button style={styles.btnToggle} onClick={() => setShowSoalMobile(!showSoalMobile)}>
              {showSoalMobile ? <EyeOff size={18}/> : <Eye size={18}/>}
              {showSoalMobile ? "Sembunyikan Daftar Soal" : "Lihat Daftar Soal & Jawaban"}
            </button>
          )}

          {((!isMobile) || (isMobile && showSoalMobile)) && data.pertanyaan && (
            <div style={{ marginTop: isMobile ? '0' : '40px' }}>
              <h3 style={{ color: colors.textMuted, fontSize: '12px', fontWeight: '800', margin: '0 0 20px 0' }}>DAFTAR SOAL & JAWABAN (GURU ONLY)</h3>
              {data.pertanyaan.map((q, idx) => (
                <div key={idx} style={{ padding: '15px', border: `1px solid ${colors.border}`, borderRadius: '14px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ fontWeight: '800', color: colors.textPrimary, fontSize: '14px' }}>Soal {idx + 1}</span>
                    <span style={{ fontSize: '11px', backgroundColor: colors.primary + '10', color: colors.primary, padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>{q.poin || 0} Poin</span>
                  </div>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: colors.textPrimary }}>{q.soal}</p>
                  {data.tipeTugas === "Pilgan" && q.opsi && (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                      {q.opsi.map((o, i) => {
                        const isCorrect = q.kunci === i;
                        return (
                          <div key={i} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${isCorrect ? '#10b981' : colors.border}`, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isCorrect ? '#10b981' : colors.textMuted, backgroundColor: isCorrect ? '#10b98110' : 'transparent', fontWeight: isCorrect ? '700' : '400' }}>
                            <span>{String.fromCharCode(65 + i)}. {o}</span>
                            {isCorrect && <CheckCircle2 size={14} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR DISKUSI: FIXED HEIGHT */}
        <div style={styles.sidebar}>
          <div style={{ padding: '15px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
            <MessageCircle size={20} color={colors.primary} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: colors.textPrimary }}>Diskusi Kelas</h3>
          </div>

          {data.diskusiAktif !== false ? (
            <>
              <div style={styles.commentBox}>
                {comments.length > 5 && !showAllComments && (
                  <button onClick={() => setShowAllComments(true)} style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px', textAlign: 'center' }}>Lihat komentar sebelumnya</button>
                )}
                {displayComments.map((c) => (
                  <div key={c.id} style={{ alignSelf: c.author === "Guru" ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '3px', textAlign: c.author === "Guru" ? 'right' : 'left' }}>{c.author}</div>
                    <div style={{ ...styles.bubble, backgroundColor: c.author === "Guru" ? colors.primary : styles.bubble.backgroundColor, color: c.author === "Guru" ? '#fff' : colors.textPrimary }}>{c.text}</div>
                  </div>
                ))}
              </div>
              <div style={styles.inputArea}>
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Tulis komentar..." style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', color: colors.textPrimary, fontSize: '14px', outline: 'none' }} onKeyPress={(e) => e.key === 'Enter' && handleSendComment()} />
                <button onClick={handleSendComment} style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer' }}><Send size={18} /></button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center', color: colors.textMuted, minHeight: '200px' }}>
              <MessageSquareOff size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Diskusi Dinonaktifkan</div>
            </div>
          )}
        </div>
      </div>
    </GuruLayout>
  );
};

export default KontenDetail;