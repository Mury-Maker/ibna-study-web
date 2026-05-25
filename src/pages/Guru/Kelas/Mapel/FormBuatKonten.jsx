import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Circle, CheckCircle2, Paperclip, Loader2, FileText, Info, Send, Save, AlertCircle } from 'lucide-react';
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
    tenggatTanggal: editData?.tenggat?.split('T')[0] || "2026-05-15",
    tenggatWaktu: editData?.tenggat?.split('T')[1] || "23:59"
  });

  const [fileAttached, setFileAttached] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [listPertanyaan, setListPertanyaan] = useState(
    editData?.pertanyaan || [{ id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 10 }]
  );

  // Menutup toast otomatis
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const totalPoinMaks = (tipeKonten === "Tugas" && tipeTugas !== "File")
    ? listPertanyaan.reduce((acc, curr) => acc + (parseInt(curr.poin) || 0), 0)
    : 100; // Default untuk tipe File atau Materi

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

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
    if (!form.judul || !form.deskripsi) return showToast("Judul dan Deskripsi wajib diisi!", "error");
    if (tipeKonten === "Tugas" && tipeTugas !== "File" && totalPoinMaks !== 100) {
      return showToast(`Total skor harus 100 (Saat ini: ${totalPoinMaks})`, "error");
    }

    setIsUploading(true);
    try {
      let finalFileUrl = editData?.fileUrl || null;
      if (fileAttached) {
        const uploadedUrl = await uploadFileToSupabase(fileAttached);
        if (uploadedUrl) finalFileUrl = uploadedUrl;
        else throw new Error("Gagal mengupload file ke storage.");
      }

      const payload = {
        judul: form.judul,
        deskripsi: form.deskripsi,
        tenggat: tipeKonten === "Tugas" ? `${form.tenggatTanggal}T${form.tenggatWaktu}` : null,
        mapelId, kelasId, tipeKonten,
        tipeTugas: tipeKonten === "Tugas" ? tipeTugas : null,
        pertanyaan: (tipeKonten === "Tugas" && tipeTugas !== "File") ? listPertanyaan : null,
        poinMaksimal: totalPoinMaks,
        fileUrl: finalFileUrl,
        status: statusKirim,
        updatedAt: Date.now()
      };

      if (isEditMode) {
        await update(ref(db, `Konten/${editData.id}`), payload);
      } else {
        const newRef = push(ref(db, 'Konten'));
        await set(newRef, { ...payload, createdAt: Date.now() });
      }

      if (statusKirim === "Terbit") {
        const notifRef = ref(db, `Notifikasi/${kelasId}`);
        await push(notifRef, {
          judul: tipeKonten === "Tugas" ? "Tugas Baru! 📝" : "Materi Baru! 📚",
          pesan: `Tutor telah memposting ${tipeKonten}: ${form.judul}`,
          createdAt: Date.now(),
          isRead: false,
          type: tipeKonten.toLowerCase()
        });
      }

      showToast(isEditMode ? "Konten berhasil diperbarui!" : "Konten berhasil diterbitkan!");
      setTimeout(() => onBack(), 1500);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setIsUploading(false);
    }
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
    container: { backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', maxWidth: '1200px', margin: '0 auto', position: 'relative' },
    label: { fontSize: '11px', fontWeight: '800', color: colors.textMuted, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    inputBase: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', color: colors.textPrimary, fontSize: '14px', outline: 'none', transition: '0.2s focus' },
    toast: {
      position: 'fixed', top: '20px', right: '20px', padding: '12px 24px', borderRadius: '10px', color: '#fff', 
      backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 9999,
      display: toast.show ? 'flex' : 'none', alignItems: 'center', gap: '10px', animation: 'slideIn 0.3s ease'
    },
    sidebar: { width: '320px', borderLeft: `1px solid ${colors.border}`, padding: '25px', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.1)' : '#f9fafb' }
  };

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      <div style={styles.toast}>
        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span style={{ fontWeight: '600', fontSize: '14px' }}>{toast.message}</span>
      </div>

      {/* HEADER */}
      <div style={{ padding: '15px 25px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardBg }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
          <ChevronLeft size={20} /> Kembali
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleSimpan("Draft")} style={{ color: colors.textPrimary, padding: '10px 18px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontWeight: '700', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={16} /> Simpan Draft
          </button>
          <button disabled={isUploading} onClick={() => handleSimpan("Terbit")} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 22px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 10px ${colors.primary}40` }}>
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isEditMode ? "Perbarui" : "Terbitkan Sekarang"}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '80vh' }}>
        {/* KIRI: CONTENT AREA */}
        <div style={{ flex: 1, padding: '30px', boxSizing: 'border-box', overflowY: 'auto', maxH: '80vh' }}>
          <div style={{ marginBottom: '25px' }}>
            <label style={styles.label}>JUDUL KONTEN</label>
            <input 
              style={{ ...styles.inputBase, fontSize: '18px', fontWeight: '700' }} 
              value={form.judul} 
              onChange={(e) => setForm({...form, judul: e.target.value})} 
              placeholder="Masukkan judul menarik..." 
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={styles.label}>ISI / DESKRIPSI</label>
            <textarea 
              style={{ ...styles.inputBase, height: '180px', resize: 'none', lineHeight: '1.6' }} 
              value={form.deskripsi} 
              onChange={(e) => setForm({...form, deskripsi: e.target.value})} 
              placeholder="Berikan penjelasan detail atau instruksi pengerjaan..." 
            />
          </div>

          {/* ATTACHMENT SECTION */}
          {(tipeKonten === "Materi" || (tipeKonten === "Tugas" && tipeTugas === "File")) && (
            <div style={{ marginBottom: '30px' }}>
              <label style={styles.label}>LAMPIRAN MEDIA</label>
              <div style={{ display: 'grid', gridTemplateColumns: previewUrl || editData?.fileUrl ? '200px 1fr' : '1fr', gap: '20px' }}>
                {(previewUrl || editData?.fileUrl) && (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border}`, height: '140px', position: 'relative' }}>
                    {(previewUrl || (editData?.fileUrl && editData.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i))) ? (
                      <img src={previewUrl || editData.fileUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: colors.primary + '10' }}>
                        <FileText size={40} color={colors.primary} />
                        <span style={{ fontSize: '10px', marginTop: '5px', fontWeight: '700' }}>DOKUMEN</span>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input type="file" id="fileUp" style={{ display: 'none' }} onChange={handleFileChange} />
                  <label htmlFor="fileUp" style={{ cursor: 'pointer', padding: '30px', border: `2px dashed ${colors.border}`, borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#fff', transition: '0.2s' }}>
                    <Paperclip size={28} color={colors.primary} style={{ marginBottom: '10px' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: colors.textPrimary }}>
                      {fileAttached ? fileAttached.name : "Klik untuk upload file pendukung"}
                    </span>
                    <span style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>PNG, JPG, PDF (Max 5MB)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* QUESTIONS SECTION */}
          {tipeKonten === "Tugas" && tipeTugas !== "File" && (
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: colors.textPrimary }}>Daftar Soal</h3>
                <button onClick={() => setListPertanyaan([...listPertanyaan, { id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 10 }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.primary, background: colors.primary + '15', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}>
                  <Plus size={16} /> Tambah Soal
                </button>
              </div>

              {listPertanyaan.map((q, index) => (
                <div key={q.id} style={{ padding: '20px', border: `1px solid ${colors.border}`, borderRadius: '14px', marginBottom: '20px', backgroundColor: colors.cardBg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>{index + 1}</span>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>Pertanyaan</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', padding: '4px 10px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted }}>POIN:</span>
                        <input type="number" style={{ width: '40px', border: 'none', background: 'transparent', fontWeight: '800', textAlign: 'center', color: colors.primary }} value={q.poin} onChange={(e) => updateSoal(q.id, 'poin', e.target.value)} />
                      </div>
                      <button onClick={() => setListPertanyaan(listPertanyaan.filter(item => item.id !== q.id))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                  
                  <input style={{ ...styles.inputBase, marginBottom: '15px' }} placeholder="Tulis soal di sini..." value={q.soal} onChange={(e) => updateSoal(q.id, 'soal', e.target.value)} />
                  
                  {tipeTugas === "Pilgan" && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {q.opsi.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: `1px solid ${q.kunci === i ? '#10B981' : colors.border}`, backgroundColor: q.kunci === i ? '#10B98105' : 'transparent' }}>
                          <div onClick={() => updateSoal(q.id, 'kunci', i)} style={{ cursor: 'pointer' }}>
                            {q.kunci === i ? <CheckCircle2 size={20} color="#10B981" /> : <Circle size={20} color={colors.border} />}
                          </div>
                          <input style={{ width: '100%', border: 'none', background: 'transparent', color: colors.textPrimary, fontSize: '13px', fontWeight: q.kunci === i ? '700' : '400' }} placeholder={`Opsi ${String.fromCharCode(65+i)}`} value={opt} onChange={(e) => updateSoal(q.id, 'opsi', e.target.value, i)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KANAN: SIDEBAR SETTINGS */}
        <div style={styles.sidebar}>
          <div style={{ marginBottom: '30px' }}>
            <label style={styles.label}>Kategori Konten</label>
            <select style={{ ...styles.inputBase, fontWeight: '700', cursor: isEditMode ? 'not-allowed' : 'pointer' }} value={tipeKonten} disabled={isEditMode} onChange={(e) => setTipeKonten(e.target.value)}>
              <option value="Tugas">📝 Kuis / Tugas</option>
              <option value="Materi">📚 Materi Belajar</option>
            </select>
          </div>

          {tipeKonten === "Tugas" ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>Metode Pengerjaan</label>
                <select style={styles.inputBase} value={tipeTugas} disabled={isEditMode} onChange={(e) => setTipeTugas(e.target.value)}>
                  <option value="Essay">Teks Essay</option>
                  <option value="Pilgan">Pilihan Ganda</option>
                  <option value="File">Unggah File/Gambar</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>Batas Tanggal</label>
                <input type="date" style={styles.inputBase} value={form.tenggatTanggal} onChange={(e) => setForm({...form, tenggatTanggal: e.target.value})} />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={styles.label}>Batas Waktu</label>
                <input type="time" style={styles.inputBase} value={form.tenggatWaktu} onChange={(e) => setForm({...form, tenggatWaktu: e.target.value})} />
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: totalPoinMaks === 100 ? '#10B98110' : colors.primary + '10', border: `2px dashed ${totalPoinMaks === 100 ? '#10B981' : colors.primary}`, textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: totalPoinMaks === 100 ? '#10B981' : colors.primary, letterSpacing: '1px' }}>AKUMULASI SKOR</span>
                <div style={{ fontSize: '28px', fontWeight: '900', color: colors.textPrimary, margin: '5px 0' }}>{totalPoinMaks} / 100</div>
                <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>
                  {totalPoinMaks === 100 ? "Skor sudah sempurna!" : `Kurang ${100 - totalPoinMaks} poin lagi.`}
                </p>
              </div>
            </>
          ) : (
            <div style={{ padding: '20px', backgroundColor: colors.primary + '08', borderRadius: '12px', border: `1px solid ${colors.primary}20` }}>
              <div style={{ display: 'flex', gap: '10px', color: colors.primary, marginBottom: '8px' }}>
                <Info size={18} />
                <span style={{ fontWeight: '800', fontSize: '12px' }}>INFO MATERI</span>
              </div>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0, lineHeight: '1.5' }}>
                Konten materi akan langsung tersedia bagi siswa tanpa batas waktu pengerjaan. Pastikan lampiran sudah benar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuatKonten;