import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Paperclip, Loader2, X, Info } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, update } from "firebase/database";
import { supabase } from '../../../api/supabase';

const FormJawaban = ({ data, onBack, onSuccess }) => {
  const { colors, isDarkMode } = useTheme();
  const [form, setForm] = useState({ judul: data.judulJawaban || "", deskripsi: data.deskripsiJawaban || "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data.status === "Terjawab") {
      setForm({ judul: data.judulJawaban || "", deskripsi: data.deskripsiJawaban || "" });
    }
  }, [data]);

  const handleKirim = async () => {
    if (!form.judul || !form.deskripsi) return alert("Harap isi Judul dan Deskripsi.");
    const yakin = window.confirm("Kirim jawaban ini ke siswa?");
    if (!yakin) return;

    setUploading(true);
    try {
      let url = data.urlFileJawaban || "";
      if (file) {
        const fileName = `jawaban_${data.id}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('ibna-study-storage').upload(`jawaban-pr/${fileName}`, file);
        if (error) throw error;
        url = supabase.storage.from('ibna-study-storage').getPublicUrl(`jawaban-pr/${fileName}`).data.publicUrl;
      }

      await update(ref(db, `TanyaPR/${data.id}`), {
        judulJawaban: form.judul,
        deskripsiJawaban: form.deskripsi,
        urlFileJawaban: url,
        status: "Terjawab", // SINKRON DENGAN DATABASE
        answeredAt: new Date().toISOString()
      });

      alert("✅ Jawaban berhasil dikirim!");
      onSuccess();
    } catch (err) { alert("❌ Gagal: " + err.message); } 
    finally { setUploading(false); }
  };

  const styles = {
    card: { backgroundColor: colors.cardBg, padding: '25px', borderRadius: '16px', border: `1px solid ${colors.border}`, width: '100%', boxSizing: 'border-box' },
    input: { width: '100%', padding: '14px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff', color: colors.textPrimary, outline: 'none', boxSizing: 'border-box', fontSize: '14px', transition: '0.3s' },
    label: { display: 'block', marginBottom: '8px', fontSize: '11px', color: colors.textMuted, fontWeight: '800', letterSpacing: '1px' },
    saveBtn: { width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '14px', marginTop: '10px' }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', marginBottom: '15px', fontWeight: '700', fontSize: '13px', padding: 0 }}>
        <ChevronLeft size={18} /> Kembali ke Detail
      </button>

      <div style={styles.card}>
        <h3 style={{ color: colors.textPrimary, marginBottom: '20px', fontSize: '16px', fontWeight: '800' }}>
          {data.status === "Terjawab" ? "EDIT JAWABAN GURU" : "FORM JAWABAN GURU"}
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>JUDUL PEMBAHASAN</label>
          <input placeholder="Contoh: Penjelasan Rumus Logaritma..." value={form.judul} onChange={(e) => setForm({...form, judul: e.target.value})} style={styles.input} />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>DESKRIPSI LENGKAP</label>
          <textarea placeholder="Tuliskan langkah-langkah pengerjaan..." value={form.deskripsi} onChange={(e) => setForm({...form, deskripsi: e.target.value})} style={{ ...styles.input, height: '180px', resize: 'none', lineHeight: '1.6' }} />
        </div>
        
        <div onClick={() => fileInputRef.current.click()} style={{ border: `2px dashed ${colors.border}`, padding: '20px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
          {file ? (
            <div style={{color: colors.primary, fontWeight:'700', fontSize:'13px'}}>{file.name}</div>
          ) : data.urlFileJawaban ? (
            <div style={{color: colors.primary, fontSize:'13px'}}>File Terlampir (Klik untuk ganti)</div>
          ) : (
            <div style={{fontSize:'13px', color:colors.textMuted, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px'}}><Paperclip size={20}/> Lampirkan File (Opsional)</div>
          )}
          <input type="file" ref={fileInputRef} hidden onChange={(e) => setFile(e.target.files[0])} />
        </div>

        <button onClick={handleKirim} disabled={uploading} style={styles.saveBtn}>
          {uploading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> {data.status === "Terjawab" ? "Simpan Perubahan" : "Kirim Jawaban Ke Siswa"}</>}
        </button>
      </div>
    </div>
  );
};

export default FormJawaban;