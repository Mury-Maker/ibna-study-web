import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Circle, CheckCircle2, Paperclip, Loader2, FileText, Info } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, push, set, update } from 'firebase/database';
import { supabase } from '../../../../api/supabase'; 

const FormBuatKonten = ({ onBack, mapelId, kelasId, editData }) => {
  const { colors, isDarkMode } = useTheme();
  const isEditMode = !!editData?.id;

  const [tipeKonten, setTipeKonten] = useState(editData?.tipeKonten || "Tugas"); 
  const [tipeTugas, setTipeTugas] = useState(editData?.tipeTugas || "Essay"); 
  
  const [form, setForm] = useState({ 
    judul: editData?.judul || "", 
    deskripsi: editData?.deskripsi || "", 
    tenggatTanggal: editData?.tenggat?.split('T')[0] || "2026-05-03",
    tenggatWaktu: editData?.tenggat?.split('T')[1] || "23:59"
  });
  
  const [fileAttached, setFileAttached] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [listPertanyaan, setListPertanyaan] = useState(
    editData?.pertanyaan || [{ id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 10 }]
  );

  const totalPoinMaks = (tipeKonten === "Tugas" && (tipeTugas === "Essay" || tipeTugas === "Pilgan")) 
    ? listPertanyaan.reduce((acc, curr) => acc + (parseInt(curr.poin) || 0), 0) 
    : 0;

  // Handler Pilih File + Preview Otomatis
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileAttached(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadFileToSupabase = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `konten/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('ibna-study-storage').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('ibna-study-storage').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Error:', error.message);
      return null;
    }
  };

  const handleSimpan = async (statusKirim) => {
    if (!form.judul || !form.deskripsi) return alert("Judul dan Deskripsi wajib diisi!");
    if (tipeKonten === "Tugas" && totalPoinMaks > 100) return alert(`Gagal! Total skor saat ini ${totalPoinMaks}. Batas maksimal adalah 100.`);

    setIsUploading(true);
    try {
      let finalFileUrl = editData?.fileUrl || null;
      if (fileAttached) {
        const uploadedUrl = await uploadFileToSupabase(fileAttached);
        if (uploadedUrl) finalFileUrl = uploadedUrl;
        else { setIsUploading(false); return alert("Gagal mengupload file."); }
      }

      const payload = {
        judul: form.judul,
        deskripsi: form.deskripsi,
        tenggat: tipeKonten === "Tugas" ? `${form.tenggatTanggal}T${form.tenggatWaktu}` : null, 
        mapelId, kelasId, tipeKonten,
        tipeTugas: tipeKonten === "Tugas" ? tipeTugas : null,
        pertanyaan: (tipeKonten === "Tugas" && tipeTugas !== "File") ? listPertanyaan : null,
        poinMaksimal: tipeKonten === "Tugas" ? totalPoinMaks : 0, 
        fileUrl: (tipeKonten === "Materi" || (tipeKonten === "Tugas" && tipeTugas === "File")) ? finalFileUrl : null,
        status: statusKirim,
        updatedAt: Date.now()
      };

      if (isEditMode) {
        await update(ref(db, `Konten/${editData.id}`), payload);
      } else {
        const newRef = push(ref(db, 'Konten'));
        await set(newRef, { ...payload, createdAt: Date.now() });
      }

      // --- LOGIKA NOTIFIKASI INTERNAL (TARUH DI SINI) ---
      if (statusKirim === "Terbit") {
          const notifRef = ref(db, `Notifikasi/${kelasId}`);
          await push(notifRef, {
              judul: tipeKonten === "Tugas" ? "Tugas Baru!" : "Materi Baru!",
              pesan: `Guru telah memposting ${tipeKonten}: ${form.judul}`,
              createdAt: Date.now(),
              isRead: false
          });
      }
      // --------------------------------------------------

      onBack();
    } catch (e) { alert(e.message); } finally { setIsUploading(false); }
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
    label: { fontSize: '12px', fontWeight: '800', color: colors.textMuted, display: 'block', marginBottom: '10px', textTransform: 'uppercase' },
    inputBase: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', color: colors.textPrimary, fontSize: '15px', outline: 'none' },
    inputGroup: { marginBottom: '25px' },
    disabledInput: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f3f4f6', color: colors.textMuted, cursor: 'not-allowed' }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={{ padding: '20px 25px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700' }}><ChevronLeft size={20} /> Kembali</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleSimpan("Draft")} style={{ color: colors.primary, padding: '10px 20px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', cursor: 'pointer', background: 'none' }}>Draft</button>
          <button disabled={isUploading} onClick={() => handleSimpan("Terbit")} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? "Update" : "Terbitkan"}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {/* KIRI: INPUT JUDUL, DESKRIPSI, SOAL */}
        <div style={{ padding: '30px', flex: '1 1 500px', boxSizing: 'border-box' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>JUDUL {tipeKonten === 'Tugas' ? 'KUIS' : 'MATERI'}</label>
            <input style={styles.inputBase} value={form.judul} onChange={(e) => setForm({...form, judul: e.target.value})} placeholder="Contoh: Kuis Matematika Dasar" />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>DESKRIPSI / INSTRUKSI</label>
            <textarea style={{ ...styles.inputBase, height: '120px', resize: 'none' }} value={form.deskripsi} onChange={(e) => setForm({...form, deskripsi: e.target.value})} placeholder="Tulis isi materi atau instruksi di sini..." />
          </div>

          {/* PREVIEW & LAMPIRAN FILE */}
          {(tipeKonten === "Materi" || (tipeKonten === "Tugas" && tipeTugas === "File")) && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>LAMPIRAN FILE</label>
              {(previewUrl || editData?.fileUrl) && (
                <div style={{ marginBottom: '15px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                  {(previewUrl || (editData?.fileUrl && editData.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i))) ? (
                    <img src={previewUrl || editData.fileUrl} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ padding: '15px', background: colors.primary + '05', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={20} color={colors.primary} />
                      <span style={{ fontSize: '13px' }}>{fileAttached ? fileAttached.name : "File terlampir"}</span>
                    </div>
                  )}
                </div>
              )}
              <input type="file" id="fileUp" style={{ display: 'none' }} onChange={handleFileChange} />
              <label htmlFor="fileUp" style={{ cursor: 'pointer', padding: '25px', border: `2px dashed ${colors.border}`, borderRadius: '12px', textAlign: 'center', display: 'block', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <Paperclip size={24} color={colors.primary} style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>{fileAttached ? "Ganti File" : "Pilih Gambar / PDF"}</span>
              </label>
            </div>
          )}

          {/* LIST PERTANYAAN (ESSAY & PILGAN) */}
          {tipeKonten === "Tugas" && tipeTugas !== "File" && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <label style={styles.label}>DAFTAR PERTANYAAN</label>
                <button onClick={() => setListPertanyaan([...listPertanyaan, { id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 0 }])} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>+ Tambah Soal</button>
              </div>

              {listPertanyaan.map((q, index) => (
                <div key={q.id} style={{ padding: '20px', border: `1px solid ${colors.border}`, borderRadius: '14px', marginBottom: '20px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', color: colors.primary, fontSize: '14px' }}>Soal #{index + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px' }}>Poin:</span>
                      <input type="number" style={{ width: '50px', padding: '6px', textAlign: 'center' }} value={q.poin} onChange={(e) => updateSoal(q.id, 'poin', e.target.value)} />
                      <Trash2 size={18} color="#ef4444" cursor="pointer" onClick={() => setListPertanyaan(listPertanyaan.filter(item => item.id !== q.id))} />
                    </div>
                  </div>
                  <input style={{ ...styles.inputBase, marginBottom: '15px' }} placeholder="Tulis soal di sini..." value={q.soal} onChange={(e) => updateSoal(q.id, 'soal', e.target.value)} />
                  
                  {/* INPUT JAWABAN PILGAN */}
                  {tipeTugas === "Pilgan" && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {q.opsi.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: `1px solid ${q.kunci === i ? '#10B981' : colors.border}` }}>
                          <div onClick={() => updateSoal(q.id, 'kunci', i)} style={{ cursor: 'pointer' }}>
                            {q.kunci === i ? <CheckCircle2 size={18} color="#10B981" /> : <Circle size={18} color={colors.border} />}
                          </div>
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

        {/* KANAN: SETTING TIPE, TENGGAT, SKOR */}
        <div style={{ width: '350px', borderLeft: `1px solid ${colors.border}`, padding: '35px 25px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#f9fafb' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>PENGATURAN KONTEN</label>
            <select style={{ ...styles.inputBase, ...(isEditMode ? styles.disabledInput : {}) }} value={tipeKonten} disabled={isEditMode} onChange={(e) => setTipeKonten(e.target.value)}>
              <option value="Tugas">Kuis / Tugas</option>
              <option value="Materi">Materi</option>
            </select>
          </div>
          {tipeKonten === "Tugas" ? (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>METODE PENGERJAAN</label>
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
                <span style={{ fontSize: '11px', fontWeight: '800', color: colors.primary }}>TOTAL SKOR</span>
                <div style={{ fontSize: '26px', fontWeight: '900' }}>{totalPoinMaks} / 100</div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px', padding: '15px', backgroundColor: colors.primary + '05', borderRadius: '10px', color: colors.primary, fontSize: '12px' }}>
              <Info size={16} /> <span>Materi tidak memerlukan tenggat waktu.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuatKonten;