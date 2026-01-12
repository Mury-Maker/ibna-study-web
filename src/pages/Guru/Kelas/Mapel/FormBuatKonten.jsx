import React, { useState } from 'react';
// FIX: Menambahkan 'Info' ke dalam daftar import dari lucide-react
import { ChevronLeft, Plus, Trash2, Circle, CheckCircle2, Paperclip, Clock, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, push, set, update } from 'firebase/database';

const FormBuatKonten = ({ onBack, mapelId, kelasId, editData }) => {
  const { colors, isDarkMode } = useTheme();
  const isEditMode = !!editData?.id;

  const [tipeKonten, setTipeKonten] = useState(editData?.tipeKonten || "Tugas"); 
  const [tipeTugas, setTipeTugas] = useState(editData?.tipeTugas || "Essay"); 
  
  const [form, setForm] = useState({ 
    judul: editData?.judul || "", 
    deskripsi: editData?.deskripsi || "", 
    tenggatTanggal: editData?.tenggat?.split('T')[0] || "2026-01-03",
    tenggatWaktu: editData?.tenggat?.split('T')[1] || "23:59"
  });
  
  const [fileAttached, setFileAttached] = useState(null); 
  const [listPertanyaan, setListPertanyaan] = useState(
    editData?.pertanyaan || [{ id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 10 }]
  );

  // Total skor hanya dihitung jika tipe konten adalah Tugas
  const totalPoinMaks = (tipeKonten === "Tugas" && (tipeTugas === "Essay" || tipeTugas === "Pilgan")) 
    ? listPertanyaan.reduce((acc, curr) => acc + (parseInt(curr.poin) || 0), 0) 
    : 0;

  const handleSimpan = async (statusKirim) => {
    if (!form.judul || !form.deskripsi) return alert("Judul dan Deskripsi wajib diisi!");
    
    if (tipeKonten === "Tugas" && (tipeTugas === "Essay" || tipeTugas === "Pilgan") && totalPoinMaks > 100) {
      return alert(`Gagal! Total skor saat ini ${totalPoinMaks}. Batas maksimal adalah 100.`);
    }

    const payload = {
      judul: form.judul,
      deskripsi: form.deskripsi,
      // FIX: Jika Materi, tenggat dikirim null agar tidak ada batas waktu
      tenggat: tipeKonten === "Tugas" ? `${form.tenggatTanggal}T${form.tenggatWaktu}` : null, 
      mapelId,
      kelasId,
      tipeKonten,
      tipeTugas: tipeKonten === "Tugas" ? tipeTugas : null,
      pertanyaan: (tipeKonten === "Tugas" && (tipeTugas === "Essay" || tipeTugas === "Pilgan")) ? listPertanyaan : null,
      poinMaksimal: tipeKonten === "Tugas" ? totalPoinMaks : 0, 
      fileUrl: (tipeKonten === "Materi" || (tipeKonten === "Tugas" && tipeTugas === "File")) ? (editData?.fileUrl || "link_dummy_file_pdf") : null,
      status: statusKirim,
      updatedAt: Date.now()
    };

    try {
      if (isEditMode) {
        await update(ref(db, `Konten/${editData.id}`), payload);
      } else {
        const newRef = push(ref(db, 'Konten'));
        await set(newRef, { ...payload, createdAt: Date.now() });
      }
      onBack();
    } catch (e) { alert(e.message); }
  };

  const updateSoal = (id, field, value, opsiIndex = null) => {
    const newPertanyaan = listPertanyaan.map(q => {
      if (q.id === id) {
        if (opsiIndex !== null) {
          const newOpsi = [...q.opsi];
          newOpsi[opsiIndex] = value;
          return { ...q, opsi: newOpsi };
        }
        return { ...q, [field]: value };
      }
      return q;
    });
    setListPertanyaan(newPertanyaan);
  };

  const styles = {
    container: { backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', maxWidth: '1100px', margin: '0 auto' },
    label: { fontSize: '12px', fontWeight: '800', color: colors.textMuted, display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    required: { color: '#ef4444', marginLeft: '4px' },
    inputBase: {
      width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`,
      background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', color: colors.textPrimary,
      fontSize: '15px', outline: 'none', boxSizing: 'border-box'
    },
    disabledInput: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f3f4f6', color: colors.textMuted, cursor: 'not-allowed', opacity: 0.7 },
    inputGroup: { marginBottom: '25px' },
    noteBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', border: `1px solid ${isDarkMode ? '#3b82f6' : '#bfdbfe'}`, color: isDarkMode ? '#60a5fa' : '#1e40af', fontSize: '12px', fontWeight: '600', marginTop: '20px' }
  };

  return (
    <div style={styles.container}>
      <div style={{ padding: '20px 25px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}><ChevronLeft size={20} /> Kembali</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleSimpan("Draft")} style={{ color: colors.primary, padding: '10px 20px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', cursor: 'pointer', background: 'none', fontSize: '14px' }}>Draft</button>
          <button onClick={() => handleSimpan("Terbit")} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>{isEditMode ? "Update" : "Terbitkan"}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ padding: '30px', flex: '1 1 500px', boxSizing: 'border-box' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>JUDUL {tipeKonten === 'Tugas' ? 'KUIS' : 'MATERI'} <span style={styles.required}>*</span></label>
            <input style={styles.inputBase} value={form.judul} placeholder="Contoh: Kuis Aljabar Dasar" onChange={(e) => setForm({...form, judul: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>DESKRIPSI / INSTRUKSI <span style={styles.required}>*</span></label>
            <textarea style={{ ...styles.inputBase, height: '120px', resize: 'none' }} value={form.deskripsi} placeholder="Tulis isi materi atau instruksi kuis di sini..." onChange={(e) => setForm({...form, deskripsi: e.target.value})} />
          </div>

          {(tipeKonten === "Materi" || (tipeKonten === "Tugas" && tipeTugas === "File")) && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>LAMPIRAN FILE (PDF/GAMBAR)</label>
              <div style={{ padding: '25px', border: `2px dashed ${colors.border}`, borderRadius: '12px', textAlign: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <input type="file" id="fileUpload" style={{ display: 'none' }} onChange={(e) => setFileAttached(e.target.files[0])} />
                <label htmlFor="fileUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={24} color={colors.primary} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textPrimary }}>{fileAttached ? fileAttached.name : (editData?.fileUrl ? "Ganti File" : "Pilih File Materi")}</span>
                </label>
              </div>
            </div>
          )}

          {tipeKonten === "Tugas" && (tipeTugas === "Essay" || tipeTugas === "Pilgan") && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <label style={styles.label}>DAFTAR PERTANYAAN</label>
                <button onClick={() => setListPertanyaan([...listPertanyaan, { id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 0 }])} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16} /> Tambah Soal</button>
              </div>

              {listPertanyaan.map((q, index) => (
                <div key={q.id} style={{ padding: '20px', border: `1px solid ${colors.border}`, borderRadius: '14px', marginBottom: '20px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', color: colors.primary, fontSize: '14px' }}>Soal #{index + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: colors.textMuted }}>Poin:</span>
                      <input type="number" style={{ width: '60px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, textAlign: 'center', fontSize: '13px' }} value={q.poin} onChange={(e) => updateSoal(q.id, 'poin', e.target.value)} />
                      <Trash2 size={18} color="#ef4444" cursor="pointer" onClick={() => setListPertanyaan(listPertanyaan.filter(item => item.id !== q.id))} />
                    </div>
                  </div>
                  <input style={{ ...styles.inputBase, marginBottom: '15px' }} placeholder="Tulis soal..." value={q.soal} onChange={(e) => updateSoal(q.id, 'soal', e.target.value)} />
                  {tipeTugas === "Pilgan" && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {q.opsi.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: `1px solid ${q.kunci === i ? '#10B981' : colors.border}` }}>
                          <div onClick={() => updateSoal(q.id, 'kunci', i)} style={{ cursor: 'pointer' }}>{q.kunci === i ? <CheckCircle2 size={18} color="#10B981" /> : <Circle size={18} color={colors.border} />}</div>
                          <input style={{ width: '100%', border: 'none', background: 'transparent', color: colors.textPrimary, fontSize: '13px' }} placeholder={`Opsi ${String.fromCharCode(65+i)}`} value={opt} onChange={(e) => updateSoal(q.id, 'opsi', e.target.value, i)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: '350px', borderLeft: `1px solid ${colors.border}`, padding: '35px 25px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#f9fafb', boxSizing: 'border-box' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>PENGATURAN KONTEN</label>
            <select style={{ ...styles.inputBase, ...(isEditMode ? styles.disabledInput : {}) }} value={tipeKonten} disabled={isEditMode} onChange={(e) => setTipeKonten(e.target.value)}>
              <option value="Tugas">Kuis / Tugas</option>
              <option value="Materi">Materi Pelajaran</option>
            </select>
          </div>

          {/* FIX: TENGGAT HANYA MUNCUL JIKA TIPE KONTEN ADALAH TUGAS */}
          {tipeKonten === "Tugas" ? (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>TIPE PENGERJAAN</label>
                <select style={{ ...styles.inputBase, ...(isEditMode ? styles.disabledInput : {}) }} value={tipeTugas} disabled={isEditMode} onChange={(e) => setTipeTugas(e.target.value)}>
                  <option value="Essay">Essay</option>
                  <option value="Pilgan">Pilihan Ganda</option>
                  <option value="File">Upload File</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>TENGGAT TANGGAL</label>
                <input type="date" style={styles.inputBase} value={form.tenggatTanggal} onChange={(e) => setForm({...form, tenggatTanggal: e.target.value})} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>TENGGAT WAKTU</label>
                <input type="time" style={styles.inputBase} value={form.tenggatWaktu} onChange={(e) => setForm({...form, tenggatWaktu: e.target.value})} />
              </div>
              <div style={{ marginTop: '20px', padding: '20px', borderRadius: '16px', backgroundColor: colors.primary + '10', border: `1px dashed ${colors.primary}`, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: colors.primary }}>TOTAL SKOR KUIS</span>
                <div style={{ fontSize: '26px', fontWeight: '900', color: colors.textPrimary, marginTop: '8px' }}>{totalPoinMaks} / 100</div>
              </div>
            </>
          ) : (
            <div style={styles.noteBox}>
              <Info size={16} /> {/* FIX: Ikon Info sekarang sudah didefinisikan */}
              <span>Konten Materi tidak memerlukan tenggat waktu.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuatKonten;