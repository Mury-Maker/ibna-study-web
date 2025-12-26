import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuruLayout from '../../../layouts/GuruLayout';
import { auth, db } from '../../../api/firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../../../api/supabase'; 
import { useTheme } from '../../../context/ThemeContext';
import { ArrowLeft, Camera, Save, Loader2 } from 'lucide-react';

const EditProfileGuru = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({ nama: '', noHp: '', foto: '' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onValue(ref(db, `Users/${user.uid}`), (snap) => {
          const data = snap.val();
          if (data) {
            setFormData({
              nama: data.nama || '',
              noHp: data.noHp || '',
              foto: data.foto || ''
            });
            setPreviewUrl(data.foto || null);
          }
          setFetching(false);
        });
      } else {
        navigate('/Login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // 1. TAMBAHKAN KONFIRMASI DI SINI
    const yakin = window.confirm("Apakah Anda yakin ingin menyimpan perubahan profil ini?");
    
    // Jika user klik 'Cancel', batalkan proses
    if (!yakin) return;

    setLoading(true);
    const user = auth.currentUser;
    let fotoUrl = formData.foto;

    try {
      // 2. Proses upload gambar ke Supabase (jika ada)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.uid}-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, imageFile);

        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        fotoUrl = publicUrl;
      }

      // 3. Update data teks ke Firebase Realtime Database
      await update(ref(db, `Users/${user.uid}`), {
        nama: formData.nama,
        noHp: formData.noHp,
        foto: fotoUrl
      });

      // 4. Notifikasi sukses setelah berhasil disimpan
      alert('✅ Profil Berhasil Diperbarui!');
      navigate('/Guru/Profile');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '30px', maxWidth: '600px', margin: '0 auto' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.contentBg, color: colors.textPrimary, marginTop: '8px', outline: 'none' },
    label: { color: colors.textMuted, fontSize: '14px', fontWeight: '500' },
    previewCircle: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.secondary}`, backgroundColor: colors.sidebarBg },
    saveBtn: { width: '100%', padding: '12px', backgroundColor: colors.primary, color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }
  };

  if (fetching) return <GuruLayout title="Edit Profile">Loading...</GuruLayout>;

  return (
    <GuruLayout title="Edit Profile">
      <button onClick={() => navigate('/Guru/Profile')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Kembali
      </button>

      <div style={styles.container}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ position: 'relative' }}>
              {previewUrl ? <img src={previewUrl} alt="Preview" style={styles.previewCircle} /> : <div style={{ ...styles.previewCircle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={40} color={colors.textMuted} /></div>}
              <label htmlFor="upload-foto" style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: colors.secondary, padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}><Camera size={16} color="#fff" /></label>
              <input id="upload-foto" type="file" accept="image/*" hidden onChange={handleImageChange} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Nama Lengkap</label>
            <input style={styles.input} value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} required />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={styles.label}>Nomor WhatsApp</label>
            <input style={styles.input} value={formData.noHp} onChange={(e) => setFormData({...formData, noHp: e.target.value})} required />
          </div>

          <button type="submit" style={styles.saveBtn} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </GuruLayout>
  );
};

export default EditProfileGuru;