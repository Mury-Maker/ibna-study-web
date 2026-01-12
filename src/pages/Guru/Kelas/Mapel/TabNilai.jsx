import React, { useState, useEffect } from 'react';
import { db } from '../../../../api/firebase'; 
import { ref, onValue, update } from 'firebase/database';
import { CheckCircle, Clock, Edit3, Paperclip, ChevronUp, User, Book, HelpCircle, MessageSquare, XCircle, Search, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

const TabNilai = ({ mapelId, kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [listPengerjaan, setListPengerjaan] = useState([]);
  const [dataKonten, setDataKonten] = useState({}); 
  const [dataSiswa, setDataSiswa] = useState({});
  const [selectedTugasId, setSelectedTugasId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [inputSkor, setInputSkor] = useState("");
  const [inputFeedback, setInputFeedback] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);

    onValue(ref(db, 'Siswa'), (snap) => {
      if (snap.exists()) {
        const siswaObj = {};
        snap.forEach(child => {
          const val = child.val();
          siswaObj[val.userId] = val.nama_siswa;
        });
        setDataSiswa(siswaObj);
      }
    });

    onValue(ref(db, 'Konten'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setDataKonten(data);
        const filtered = Object.keys(data)
          .filter(id => data[id].mapelId === mapelId && data[id].tipeKonten === "Tugas")
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
  }, [mapelId]);

  const handleSimpanSkor = async (id) => {
    if (!inputSkor || inputSkor < 0 || inputSkor > 100) return alert("Skor 0-100 wajib diisi!");
    try {
      await update(ref(db, `Nilai/${id}`), {
        skor: parseInt(inputSkor),
        feedbackGuru: inputFeedback,
        statusKoreksi: "Selesai"
      });
      alert("Nilai Berhasil Dikirim!");
      setExpandedId(null);
    } catch (e) { alert("Gagal update: " + e.message); }
  };

  const currentTugasList = Object.keys(dataKonten)
    .filter(id => dataKonten[id].mapelId === mapelId && dataKonten[id].tipeKonten === "Tugas")
    .map(id => ({ id, ...dataKonten[id] })).reverse();

  const filteredPengerjaan = listPengerjaan.filter(item => item.kontenId === selectedTugasId);

  const styles = {
    container: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', animation: 'fadeIn 0.3s ease' },
    leftPanel: { flex: '0.6', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', display: isMobile ? 'none' : 'block' },
    rightPanel: { flex: isMobile ? '1' : '1.4', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '15px', textAlign: 'left', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc', color: colors.textMuted, fontSize: '11px', textTransform: 'uppercase' },
    td: { padding: '15px', borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: isMobile ? '13px' : '14px' },
    expandArea: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fafafa', padding: isMobile ? '15px' : '25px', borderBottom: `1px solid ${colors.border}` },
    cardReview: { marginBottom: '12px', padding: '15px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? '#111' : '#fff' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? '#000' : '#fff', color: colors.textPrimary, marginBottom: '10px' }
  };

  return (
    <div style={styles.container}>
      {isMobile && (
        <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${colors.border}`, marginBottom: '15px' }} value={selectedTugasId} onChange={(e) => { setSelectedTugasId(e.target.value); setExpandedId(null); }}>
          {currentTugasList.map(t => <option key={t.id} value={t.id}>{t.judul} ({t.tipeTugas})</option>)}
        </select>
      )}

      <div style={styles.leftPanel}>
        <div style={{ padding: '18px', fontWeight: '900', borderBottom: `1px solid ${colors.border}`, color: colors.primary }}>DAFTAR TUGAS</div>
        {currentTugasList.map(t => (
          <div key={t.id} onClick={() => { setSelectedTugasId(t.id); setExpandedId(null); }} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: `1px solid ${colors.border}`, backgroundColor: selectedTugasId === t.id ? colors.primary + '15' : 'transparent', borderLeft: selectedTugasId === t.id ? `5px solid ${colors.primary}` : '5px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', color: colors.textPrimary }}>{t.judul}</div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>{t.tipeTugas}</div>
            </div>
            {selectedTugasId === t.id && <ChevronRight size={16} color={colors.primary} />}
          </div>
        ))}
      </div>

      <div style={styles.rightPanel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Siswa</th>
              {!isMobile && <th style={styles.th}>Tipe</th>}
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Skor</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPengerjaan.map((s) => (
              <React.Fragment key={s.id}>
                <tr>
                  <td style={styles.td}><b>{dataSiswa[s.studentId] || "Siswa"}</b></td>
                  {!isMobile && <td style={styles.td}><span style={{ fontSize: '11px', color: colors.primary, fontWeight: '800' }}>{s.tipeTugas}</span></td>}
                  <td style={styles.td}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: s.statusKoreksi === 'Selesai' ? '#10b981' : '#f59e0b' }}>
                      {s.statusKoreksi === 'Selesai' ? 'DINILAI' : 'BELUM'}
                    </span>
                  </td>
                  <td style={styles.td}><b>{s.skor ?? "-"}</b></td>
                  <td style={styles.td}>
                    <button style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: colors.primary, color: '#fff', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => { if (expandedId === s.id) setExpandedId(null); else { setExpandedId(s.id); setInputSkor(s.skor || ""); setInputFeedback(s.feedbackGuru || ""); } }}>
                      {expandedId === s.id ? <ChevronUp size={12}/> : (s.tipeTugas === "Pilgan" ? <Search size={12}/> : <Edit3 size={12}/>)}
                      {s.tipeTugas === "Pilgan" ? "Review" : "Koreksi"}
                    </button>
                  </td>
                </tr>

                {expandedId === s.id && (
                  <tr>
                    <td colSpan={isMobile ? "4" : "5"} style={{ padding: 0 }}>
                      <div style={styles.expandArea}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '25px' }}>
                          
                          {/* DETAIL PENGERJAAN: DIBUAT 1/4 (flex: 0.25) JIKA TIPE FILE */}
                          <div style={{ flex: s.tipeTugas === "File" ? '0.25' : '1' }}>
                            <div style={{ fontWeight: '900', fontSize: '11px', marginBottom: '15px', color: colors.textMuted }}>DETAIL JAWABAN</div>
                            
                            {s.tipeTugas === "Pilgan" ? (
                              dataKonten[s.kontenId]?.pertanyaan?.map((soalObj, i) => {
                                const jawabSiswa = s.jawabanPilgan?.[i];
                                const isBenar = jawabSiswa === soalObj.kunci;
                                return (
                                  <div key={i} style={{ ...styles.cardReview, borderLeft: `4px solid ${isBenar ? '#10b981' : (jawabSiswa !== undefined ? '#ef4444' : colors.border)}` }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>{i+1}. {soalObj.soal}</span>
                                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: isBenar ? '#10b98120' : '#ef444420', color: isBenar ? '#10b981' : '#ef4444', fontWeight: '900' }}>
                                        {isBenar ? `+${soalObj.poin || 0} Poin` : '0 Poin'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                                      {[0, 1, 2, 3].map((idx) => {
                                        const isKunci = soalObj.kunci === idx;
                                        const isDipilih = jawabSiswa === idx;
                                        let bCol = colors.border;
                                        let tCol = colors.textPrimary;
                                        if (isKunci) { bCol = '#10b981'; tCol = '#10b981'; }
                                        else if (isDipilih && !isBenar) { bCol = '#ef4444'; tCol = '#ef4444'; }
                                        return (
                                          <div key={idx} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${bCol}`, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isDipilih ? bCol + '10' : 'transparent' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${bCol}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', backgroundColor: isDipilih ? bCol : 'transparent', color: isDipilih ? '#fff' : tCol }}>{String.fromCharCode(65 + idx)}</div>
                                            <span style={{ color: tCol, fontWeight: (isKunci || isDipilih) ? '700' : '400' }}>{soalObj.opsi?.[idx]}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })
                            ) : s.tipeTugas === "Essay" ? (
                              dataKonten[s.kontenId]?.pertanyaan?.map((soalObj, i) => (
                                <div key={i} style={styles.cardReview}>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: colors.primary }}>Q{i+1}: {soalObj.soal}</div>
                                  <div style={{ fontSize: '14px', marginTop: '10px', fontStyle: 'italic', padding: '10px', backgroundColor: isDarkMode ? '#000' : '#f9f9f9', borderRadius: '8px' }}>"{s.jawabanEssay?.[i] || 'Tidak menjawab'}"</div>
                                </div>
                              ))
                            ) : (
                              // TAMPILAN COMPACT UNTUK TIPE FILE
                              <div style={{ textAlign: 'center', padding: '15px', border: `2px dashed ${colors.primary}`, borderRadius: '16px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff' }}>
                                <Paperclip size={24} color={colors.primary} style={{ marginBottom: '8px' }} />
                                <div style={{ fontSize: '12px', fontWeight: '800' }}><a href={s.fileUrlSiswa} target="_blank" rel="noreferrer" style={{ color: colors.primary, textDecoration: 'none' }}>BUKA LAMPIRAN SISWA</a></div>
                              </div>
                            )}
                          </div>

                          {/* PANEL PENILAIAN: SISA RUANG (flex: 1) */}
                          <div style={{ flex: s.tipeTugas === "File" ? '0.75' : '0.4', minWidth: isMobile ? '100%' : '300px' }}>
                            <div style={{ padding: '20px', backgroundColor: isDarkMode ? '#111' : '#fff', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: colors.textMuted, marginBottom: '10px' }}>HASIL AKHIR</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: colors.primary }}>{s.skor ?? "0"}<span style={{fontSize: '14px', color: colors.textMuted}}>/100</span></div>
                                
                                {s.tipeTugas !== "Pilgan" && (
                                  <>
                                    <label style={{fontSize: '11px', fontWeight: '800', display: 'block', margin: '15px 0 5px'}}>SKOR SISWA:</label>
                                    <input type="number" style={styles.input} value={inputSkor} onChange={(e) => setInputSkor(e.target.value)} placeholder="0-100" />
                                    <label style={{fontSize: '11px', fontWeight: '800', display: 'block', margin: '10px 0 5px'}}>FEEDBACK:</label>
                                    <textarea style={{ ...styles.input, height: '80px', resize: 'none' }} value={inputFeedback} onChange={(e) => setInputFeedback(e.target.value)} placeholder="Catatan..." />
                                    <button onClick={() => handleSimpanSkor(s.id)} style={{ width: '100%', padding: '12px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>SIMPAN NILAI</button>
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