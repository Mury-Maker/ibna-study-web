import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Circle, CheckCircle2, FileUp, Clock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, push, set, update } from 'firebase/database';

const FormBuatUjian = ({ onBack, kelasId, editData }) => {
  const { colors, isDarkMode } = useTheme();
  const isEditMode = !!editData?.id; 

  const [form, setForm] = useState({ 
    judul: editData?.judul || "", 
    deskripsi: editData?.deskripsi || "", 
    tenggatTanggal: editData?.tenggat?.split('T')[0] || "2026-01-03",
    tenggatWaktu: editData?.tenggat?.split('T')[1] || "23:59"
  });
  
  const [fileUjian, setFileUjian] = useState(null); 
  // State pertanyaan sama seperti sebelumnya, tapi dikunci ke Pilgan
  const [listPertanyaan, setListPertanyaan] = useState(
    editData?.pertanyaan || [{ id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 10 }]
  );

  const totalPoinMaks = listPertanyaan.reduce((acc, curr) => acc + (parseInt(curr.poin) || 0), 0);

  const handleSimpan = async () => {
    if (!form.judul || !form.deskripsi) return alert("Judul dan Deskripsi wajib diisi!");
    if (!isEditMode && !fileUjian) return alert("File soal ujian wajib diunggah!");
    if (totalPoinMaks > 100) return alert("Total skor maksimal adalah 100!");

    const payload = {
      judul: form.judul,
      deskripsi: form.deskripsi,
      tenggat: `${form.tenggatTanggal}T${form.tenggatWaktu}`, 
      kelasId,
      tipeKonten: "Ujian Perbulan",
      tipeTugas: "Pilgan", // Dikunci khusus Pilgan
      pertanyaan: listPertanyaan,
      poinMaksimal: totalPoinMaks, 
      fileUrl: editData?.fileUrl || "link_dummy_file_pdf", 
      status: "Terbit",
      createdAt: editData?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    try {
      const node = `UjianPerbulan/${kelasId}`;
      if (isEditMode) {
        await update(ref(db, `${node}/${editData.id}`), payload);
      } else {
        const newRef = push(ref(db, node));
        await set(newRef, payload);
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
    inputBase: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', color: colors.textPrimary, fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
    inputGroup: { marginBottom: '25px' }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ padding: '20px 25px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700' }}><ChevronLeft size={20} /> Kembali</button>
        <button onClick={handleSimpan} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 25px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>{isEditMode ? 'Update Ujian' : 'Terbitkan Ujian'}</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {/* KIRI: Input Utama */}
        <div style={{ padding: '30px', flex: '1 1 500px', boxSizing: 'border-box' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>JUDUL UJIAN <span style={styles.required}>*</span></label>
            <input style={styles.inputBase} value={form.judul} placeholder="Contoh: Ujian Tengah Semester Ganjil" onChange={(e) => setForm({...form, judul: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>INSTRUKSI UJIAN <span style={styles.required}>*</span></label>
            <textarea style={{ ...styles.inputBase, height: '100px', resize: 'none' }} value={form.deskripsi} placeholder="Tulis instruksi pengerjaan..." onChange={(e) => setForm({...form, deskripsi: e.target.value})} />
          </div>

          {/* AREA UPLOAD FILE SOAL (Khusus Ujian Perbulan) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>FILE SOAL UJIAN (PDF/GAMBAR) <span style={styles.required}>*</span></label>
            <div style={{ padding: '25px', border: `2px dashed ${colors.primary}40`, borderRadius: '12px', textAlign: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
              <input type="file" id="fileUjian" style={{ display: 'none' }} onChange={(e) => setFileUjian(e.target.files[0])} />
              <label htmlFor="fileUjian" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileUp size={28} color={colors.primary} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: colors.textPrimary }}>
                  {fileUjian ? fileUjian.name : (editData?.fileUrl ? "Ganti File Soal" : "Klik untuk pilih File Soal Ujian")}
                </span>
              </label>
            </div>
          </div>

          {/* DAFTAR PERTANYAAN (Sama seperti FormBuatKonten) */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={styles.label}>DAFTAR PERTANYAAN (PILGAN ONLY)</label>
              <button onClick={() => setListPertanyaan([...listPertanyaan, { id: Date.now(), soal: "", opsi: ["", "", "", ""], kunci: null, poin: 5 }])} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16}/> Tambah Soal</button>
            </div>

            {listPertanyaan.map((q, index) => (
              <div key={q.id} style={{ padding: '20px', border: `1px solid ${colors.border}`, borderRadius: '14px', marginBottom: '20px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fcfcfc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: colors.primary, fontSize: '14px' }}>Soal #{index + 1} <span style={styles.required}>*</span></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>Poin:</span>
                    <input type="number" style={{ width: '60px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, textAlign: 'center', fontSize: '13px' }} value={q.poin} onChange={(e) => updateSoal(q.id, 'poin', e.target.value)} />
                    <Trash2 size={18} color="#ef4444" cursor="pointer" onClick={() => setListPertanyaan(listPertanyaan.filter(item => item.id !== q.id))} />
                  </div>
                </div>
                <input style={{ ...styles.inputBase, marginBottom: '15px' }} placeholder="Tulis soal (atau biarkan kosong jika soal ada di file)..." value={q.soal} onChange={(e) => updateSoal(q.id, 'soal', e.target.value)} />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {q.opsi.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: `1px solid ${q.kunci === i ? '#10B981' : colors.border}`, backgroundColor: q.kunci === i ? '#10B98110' : 'transparent' }}>
                      <div onClick={() => updateSoal(q.id, 'kunci', i)} style={{ cursor: 'pointer' }}>
                        {q.kunci === i ? <CheckCircle2 size={18} color="#10B981" /> : <Circle size={18} color={colors.border} />}
                      </div>
                      <input style={{ width: '100%', border: 'none', background: 'transparent', color: colors.textPrimary, fontSize: '13px', outline: 'none' }} placeholder={`Opsi ${String.fromCharCode(65+i)}`} value={opt} onChange={(e) => updateSoal(q.id, 'opsi', e.target.value, i)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KANAN: Sidebar Pengaturan */}
        <div style={{ width: '350px', borderLeft: `1px solid ${colors.border}`, padding: '35px 25px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#f9fafb', boxSizing: 'border-box' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>TENGGAT TANGGAL</label>
            <input type="date" style={styles.inputBase} value={form.tenggatTanggal} onChange={(e) => setForm({...form, tenggatTanggal: e.target.value})} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>TENGGAT WAKTU</label>
            <div style={{ position: 'relative' }}>
              <input type="time" style={styles.inputBase} value={form.tenggatWaktu} onChange={(e) => setForm({...form, tenggatWaktu: e.target.value})} />
              <Clock size={18} style={{ position: 'absolute', right: '16px', top: '13px', color: colors.textMuted }} />
            </div>
          </div>
          
          <div style={{ marginTop: '30px', padding: '20px', borderRadius: '16px', backgroundColor: totalPoinMaks > 100 ? '#fef2f2' : colors.primary + '10', border: `1px dashed ${totalPoinMaks > 100 ? '#ef4444' : colors.primary}`, textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: totalPoinMaks > 100 ? '#ef4444' : colors.primary }}>TOTAL SKOR MAKSIMAL</span>
            <div style={{ fontSize: '28px', fontWeight: '900', color: colors.textPrimary, marginTop: '8px' }}>{totalPoinMaks} / 100</div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', border: `1px solid ${colors.border}`, display: 'flex', gap: '10px' }}>
            <AlertCircle size={20} color={colors.primary} />
            <p style={{ margin: 0, fontSize: '11px', color: colors.textMuted, lineHeight: '1.5' }}>
              Mode Ujian Perbulan mengunci tipe pengerjaan ke <strong>Pilihan Ganda</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuatUjian;