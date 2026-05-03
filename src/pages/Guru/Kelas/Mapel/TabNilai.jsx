import React, { useState, useEffect } from 'react';
import { db } from '../../../../api/firebase'; 
import { ref, onValue, update, get } from 'firebase/database';
import { 
  Edit3, Paperclip, User, Search, ChevronUp, 
  RefreshCw, AlertCircle, Clock, FileText, Image as ImageIcon, ExternalLink 
} from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

const TabNilai = ({ mapelId, kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [listPengerjaan, setListPengerjaan] = useState([]);
  const [dataKonten, setDataKonten] = useState({}); 
  const [dataSiswaLengkap, setDataSiswaLengkap] = useState({});
  const [selectedTugasId, setSelectedTugasId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [isEditingExisting, setIsEditingExisting] = useState(false); 
  const [inputSkorGlobal, setInputSkorGlobal] = useState(""); 
  const [skorEssayPerSoal, setSkorEssayPerSoal] = useState({}); 
  const [inputFeedback, setInputFeedback] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);

    // FIX LOGIKA NAMA: Ambil data Users dulu baru Siswa agar mapping Akurat
    const usersRef = ref(db, 'Users');
    const siswaRef = ref(db, 'Siswa');

    onValue(usersRef, (uSnap) => {
        const allUsers = uSnap.val() || {};
        
        onValue(siswaRef, (sSnap) => {
            if (sSnap.exists()) {
                const mapping = {};
                sSnap.forEach(child => {
                    const s = child.val();
                    // Ambil nama dari node Users berdasarkan userId, jika tidak ada pakai nama_siswa, jika tidak ada default "Siswa"
                    mapping[s.userId] = allUsers[s.userId]?.nama || s.nama_siswa || "Siswa Tanpa Nama";
                });
                console.log("Mapping Nama Siswa:", mapping); // Debug di console
                setDataSiswaLengkap(mapping);
            }
        });
    });

    onValue(ref(db, 'Konten'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setDataKonten(data);
        const filtered = Object.keys(data)
          .filter(id => data[id].mapelId === mapelId && (data[id].tipeKonten === "Tugas" || data[id].tipeKonten === "Ujian Perbulan"))
          .map(id => ({ id, ...data[id] }));
        if (filtered.length > 0 && !selectedTugasId) setSelectedTugasId(filtered[0].id);
      }
    });

    onValue(ref(db, 'Nilai'), (snapshot) => {
      const data = [];
      snapshot.forEach((child) => {
        const val = child.val();
        if (val.kontenId) data.push({ id: child.key, ...val });
      });
      setListPengerjaan(data);
    });

    return () => window.removeEventListener('resize', handleResize);
  }, [mapelId, selectedTugasId]);

  const totalSkorOtomatisEssay = Object.values(skorEssayPerSoal).reduce((a, b) => a + (parseInt(b) || 0), 0);

  const handleSimpanSkor = async (pengerjaan) => {
    let skorFinal = pengerjaan.tipeTugas === "Essay" ? totalSkorOtomatisEssay : parseInt(inputSkorGlobal);
    if (isNaN(skorFinal) || skorFinal < 0 || skorFinal > 100) return alert("Skor 0-100 wajib valid!");

    let pinaltiText = "";
    if (pengerjaan.tipeTugas !== "Pilgan" && pengerjaan.isTerlambat) {
        const confirmPinalti = window.confirm("Siswa terdeteksi TERLAMBAT. Kurangi 5 poin otomatis?");
        if (confirmPinalti) {
            skorFinal = Math.max(0, skorFinal - 5);
            pinaltiText = " (Pinalti terlambat -5 poin)";
        }
    }

    try {
      await update(ref(db, `Nilai/${pengerjaan.id}`), {
        skor: skorFinal,
        feedbackGuru: inputFeedback + pinaltiText,
        statusKoreksi: "Selesai",
        breakdownEssay: pengerjaan.tipeTugas === "Essay" ? skorEssayPerSoal : null,
        updatedAt: Date.now()
      });
      alert("✅ Penilaian Berhasil!");
      setExpandedId(null);
      setIsEditingExisting(false);
    } catch (e) { alert("Error: " + e.message); }
  };

  const currentTugasList = Object.keys(dataKonten)
    .filter(id => dataKonten[id].mapelId === mapelId && dataKonten[id].tipeKonten !== "Materi")
    .map(id => ({ id, ...dataKonten[id] })).reverse();

  const filteredPengerjaan = listPengerjaan.filter(item => item.kontenId === selectedTugasId);

  const styles = {
    container: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', animation: 'fadeIn 0.3s ease' },
    leftPanel: { flex: '0.6', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', display: isMobile ? 'none' : 'block' },
    rightPanel: { flex: isMobile ? '1' : '1.4', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '600px' : 'auto' },
    th: { padding: '15px', textAlign: 'left', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc', color: colors.textMuted, fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' },
    td: { padding: '15px', borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: '14px' },
    expandArea: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fafafa', padding: isMobile ? '15px' : '25px', borderBottom: `1px solid ${colors.border}` },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? '#000' : '#fff', color: colors.textPrimary, marginBottom: '10px' },
    previewBox: { width: '100%', height: '550px', borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    essayScoreInput: { width: '80px', padding: '8px', borderRadius: '8px', border: `2px solid ${colors.primary}`, textAlign: 'center', fontWeight: '800', backgroundColor: isDarkMode ? '#000' : '#fff', color: colors.primary },
    lateBadge: { fontSize: '10px', color: '#ef4444', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' },
    cardReview: { padding: '15px', border: `1px solid ${colors.border}`, borderRadius: '14px', marginBottom: '15px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff' }
  };

  return (
    <div style={styles.container}>
      {isMobile && (
        <select style={{ ...styles.input, marginBottom: '15px' }} value={selectedTugasId || ""} onChange={(e) => { setSelectedTugasId(e.target.value); setExpandedId(null); }}>
          {currentTugasList.map(t => <option key={t.id} value={t.id}>{t.judul} ({t.tipeTugas})</option>)}
        </select>
      )}

      <div style={styles.leftPanel}>
        <div style={{ padding: '18px', fontWeight: '900', borderBottom: `1px solid ${colors.border}`, color: colors.primary, fontSize: '12px' }}>DAFTAR TUGAS & UJIAN</div>
        {currentTugasList.map(t => (
          <div key={t.id} onClick={() => { setSelectedTugasId(t.id); setExpandedId(null); }} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: `1px solid ${colors.border}`, backgroundColor: selectedTugasId === t.id ? colors.primary + '15' : 'transparent', borderLeft: selectedTugasId === t.id ? `5px solid ${colors.primary}` : '5px solid transparent', transition: '0.2s' }}>
            <div style={{ fontWeight: '800', color: colors.textPrimary, fontSize: '14px' }}>{t.judul}</div>
            <div style={{ fontSize: '11px', color: colors.textMuted }}>{t.tipeTugas} • Max {t.poinMaksimal || 100} Poin</div>
          </div>
        ))}
      </div>

      <div style={styles.rightPanel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Siswa</th>
              <th style={styles.th}>Waktu Kumpul</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Skor</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPengerjaan.map((s) => (
              <React.Fragment key={s.id}>
                <tr>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <User size={16} color={colors.primary} />
                      <div>
                        <b style={{ fontSize: '13px' }}>{dataSiswaLengkap[s.studentId] || "Siswa"}</b>
                        {s.isTerlambat && (
                          <div style={styles.lateBadge}><AlertCircle size={10} /> TERLAMBAT</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} color={colors.textMuted} />
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '20px', fontWeight: '900', backgroundColor: s.statusKoreksi === 'Selesai' ? '#10b98115' : '#f59e0b15', color: s.statusKoreksi === 'Selesai' ? '#10b981' : '#f59e0b', border: `1px solid ${s.statusKoreksi === 'Selesai' ? '#10b981' : '#f59e0b'}` }}>
                      {s.statusKoreksi === 'Selesai' ? 'DINILAI' : 'BELUM'}
                    </span>
                  </td>
                  <td style={styles.td}><b style={{ fontSize: '16px', color: colors.primary }}>{s.skor ?? "-"}</b></td>
                  <td style={styles.td}>
                    <button style={{ padding: '8px 15px', borderRadius: '10px', border: 'none', backgroundColor: expandedId === s.id ? colors.textMuted : colors.primary, color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { 
                      if (expandedId === s.id) {
                        setExpandedId(null);
                        setIsEditingExisting(false);
                      } else { 
                        setExpandedId(s.id); 
                        setInputSkorGlobal(s.skor || ""); 
                        setInputFeedback(s.feedbackGuru || "");
                        setSkorEssayPerSoal(s.breakdownEssay || {}); 
                        setIsEditingExisting(false); 
                      } 
                    }}>
                      {expandedId === s.id ? <ChevronUp size={14}/> : (s.statusKoreksi === 'Selesai' ? <Search size={14}/> : <Edit3 size={14}/>)}
                      {s.statusKoreksi === 'Selesai' ? "Preview" : (s.tipeTugas === "Pilgan" ? "Review" : "Koreksi")}
                    </button>
                  </td>
                </tr>

                {expandedId === s.id && (
                  <tr>
                    <td colSpan="5" style={{ padding: 0 }}>
                      <div style={styles.expandArea}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '30px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '900', fontSize: '11px', marginBottom: '15px', color: colors.textMuted }}>DETAIL PENGERJAAN</div>
                            
                            {s.tipeTugas === "File" ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.primary, fontWeight: '800', fontSize: '13px' }}>
                                        <FileText size={18} /> PREVIEW JAWABAN SISWA
                                    </div>
                                    <a href={s.fileUrlSiswa} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ExternalLink size={14} /> Buka Tab Baru
                                    </a>
                                </div>
                                <div style={styles.previewBox}>
                                    {s.fileUrlSiswa ? (
                                        s.fileUrlSiswa.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                            <img src={s.fileUrlSiswa} alt="Jawaban" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <iframe 
                                                title="Preview Dokumen"
                                                src={`https://docs.google.com/gview?url=${encodeURIComponent(s.fileUrlSiswa)}&embedded=true`}
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                            />
                                        )
                                    ) : <div style={{color:colors.textMuted}}>File tidak tersedia</div>}
                                </div>
                              </div>
                            ) : s.tipeTugas === "Essay" ? (
                              dataKonten[s.kontenId]?.pertanyaan?.map((soalObj, i) => (
                                <div key={i} style={{ ...styles.cardReview, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: colors.primary }}>Q{i+1}: {soalObj.soal}</div>
                                    <div style={{ fontSize: '13px', marginTop: '8px', color: colors.textPrimary, fontWeight: '500' }}>
                                      "{s.jawabanEssay?.[i] || "Tidak menjawab"}"
                                    </div>
                                  </div>
                                  {(s.statusKoreksi !== "Selesai" || isEditingExisting) && (
                                    <div style={{ marginLeft: '20px', textAlign: 'right' }}>
                                      <div style={{ fontSize: '10px', fontWeight: '800', color: colors.textMuted, marginBottom: '5px' }}>SKOR (MAX {soalObj.poin})</div>
                                      <input type="number" value={skorEssayPerSoal[i] || ""} style={styles.essayScoreInput} placeholder="0" onChange={(e) => setSkorEssayPerSoal(prev => ({...prev, [i]: e.target.value}))} />
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                                dataKonten[s.kontenId]?.pertanyaan?.map((soalObj, i) => {
                                    const jawabSiswa = s.jawabanPilgan?.[i];
                                    const isBenar = jawabSiswa === soalObj.kunci;
                                    return (
                                      <div key={i} style={{ ...styles.cardReview, borderLeft: `4px solid ${isBenar ? '#10b981' : '#ef4444'}` }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>{i+1}. {soalObj.soal}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          {soalObj.opsi?.map((opt, idx) => {
                                            const isKunci = soalObj.kunci === idx;
                                            const isDipilih = jawabSiswa === idx;
                                            let bCol = colors.border;
                                            if (isKunci) bCol = '#10b981';
                                            else if (isDipilih && !isBenar) bCol = '#ef4444';
                                            return (
                                              <div key={idx} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${bCol}`, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isDipilih ? bCol + '10' : 'transparent' }}>
                                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `1px solid ${bCol}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900', backgroundColor: isDipilih ? bCol : 'transparent', color: isDipilih ? '#fff' : bCol }}>{String.fromCharCode(65 + idx)}</div>
                                                <span style={{ color: (isDipilih || isKunci) ? bCol : colors.textPrimary }}>{opt}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                })
                            )}
                          </div>

                          <div style={{ width: isMobile ? '100%' : '350px' }}>
                            <div style={{ padding: '25px', backgroundColor: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: colors.textMuted, marginBottom: '15px' }}>
                                  {(s.statusKoreksi === "Selesai" && !isEditingExisting) ? "HASIL PENILAIAN" : "FORM PENILAIAN"}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                  <div style={{ fontSize: '42px', fontWeight: '900', color: s.isTerlambat ? '#ef4444' : colors.primary }}>
                                    {(s.statusKoreksi === "Selesai" && !isEditingExisting) ? (s.skor ?? 0) : (s.tipeTugas === "Essay" ? totalSkorOtomatisEssay : (inputSkorGlobal || "0"))}
                                  </div>
                                  <div style={{ fontSize: '16px', color: colors.textMuted, fontWeight: '700' }}>/ 100</div>
                                </div>

                                {s.isTerlambat && (
                                  <div style={{ padding:'10px', borderRadius:'8px', backgroundColor:'#ef444410', color:'#ef4444', fontSize:'11px', fontWeight:'700', marginBottom:'15px', border:'1px solid #ef4444' }}>
                                    <AlertCircle size={14} style={{verticalAlign:'middle', marginRight:'5px'}}/> 
                                    Siswa Terlambat: Disarankan pinalti poin.
                                  </div>
                                )}

                                {s.statusKoreksi === "Selesai" && !isEditingExisting ? (
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, marginBottom: '5px' }}>FEEDBACK GURU:</div>
                                    <div style={{ fontSize: '13px', color: colors.textPrimary, fontStyle: 'italic', backgroundColor: isDarkMode ? '#000' : '#f9f9f9', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                                      {s.feedbackGuru || "Tidak ada catatan."}
                                    </div>
                                    <button onClick={() => setIsEditingExisting(true)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: colors.primary, border: `1.5px solid ${colors.primary}`, borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <RefreshCw size={16} /> EDIT PENILAIAN
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {(s.tipeTugas !== "Essay" && s.tipeTugas !== "Pilgan") && (
                                      <div style={{ marginBottom: '15px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SKOR AKHIR:</label>
                                        <input type="number" style={styles.input} value={inputSkorGlobal} onChange={(e) => setInputSkorGlobal(e.target.value)} placeholder="0-100" />
                                      </div>
                                    )}
                                    <label style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>FEEDBACK:</label>
                                    <textarea style={{ ...styles.input, height: '100px', resize: 'none', marginBottom: '20px' }} value={inputFeedback} onChange={(e) => setInputFeedback(e.target.value)} placeholder="Catatan..." />
                                    <button onClick={() => handleSimpanSkor(s)} style={{ width: '100%', padding: '15px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>SIMPAN NILAI</button>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabNilai;