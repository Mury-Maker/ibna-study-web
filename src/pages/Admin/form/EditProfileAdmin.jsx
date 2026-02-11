import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { auth, db } from '../../../api/firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../../../api/supabase'; 
import { useTheme } from '../../../context/ThemeContext';
import { ArrowLeft, Camera, Save, Loader2, User as UserIcon } from 'lucide-react';

const EditProfileAdmin = () => {
  const { colors, isDarkMode } = useTheme();
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
    const yakin = window.confirm("Apakah Anda yakin ingin menyimpan perubahan profil ini?");
    if (!yakin) return;

    setLoading(true);
    const user = auth.currentUser;
    let fotoUrl = formData.foto;

    try {
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

      await update(ref(db, `Users/${user.uid}`), {
        nama: formData.nama,
        noHp: formData.noHp,
        foto: fotoUrl
      });

      alert('✅ Profil Berhasil Diperbarui!');
      navigate('/Admin/Profile');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { padding: '20px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease' },
    card: { 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '16px', 
      padding: '40px', 
      width: '100%', 
      boxSizing: 'border-box' 
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      marginTop: '20px'
    },
    avatarUploadWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      borderRight: `1px solid ${colors.border}`
    },
    previewBox: { 
      width: '180px', 
      height: '180px', 
      borderRadius: '20px', 
      objectFit: 'cover', 
      border: `4px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
    },
    cameraLabel: {
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      backgroundColor: colors.primary,
      padding: '10px',
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      color: '#fff',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
    },
    inputGroup: { marginBottom: '20px' },
    label: { 
      display: 'block', 
      fontSize: '11px', 
      fontWeight: '800', 
      color: colors.textMuted, 
      letterSpacing: '1px', 
      marginBottom: '8px' 
    },
    input: { 
      width: '100%', 
      padding: '14px', 
      borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff', 
      color: colors.textPrimary, 
      outline: 'none', 
      fontSize: '15px', 
      boxSizing: 'border-box',
      transition: '0.3s'
    },
    saveBtn: { 
      width: '100%', 
      padding: '16px', 
      backgroundColor: colors.primary, 
      color: '#fff', 
      borderRadius: '12px', 
      border: 'none', 
      cursor: 'pointer', 
      fontWeight: '700', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: '12px', 
      fontSize: '16px',
      marginTop: '20px'
    }
  };

  if (fetching) return (
    <AdminLayout title="Edit Profile">
      <div style={{ padding: '40px', color: colors.textPrimary }}>
        <Loader2 className="animate-spin" /> Memuat Data...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Pengaturan Profil">
      <div style={styles.container}>
        <button onClick={() => navigate('/Admin/Profile')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', marginBottom: '20px', fontWeight: '700', fontSize: '14px' }}>
          <ArrowLeft size={20} /> Kembali ke Profil
        </button>

        <div style={styles.card}>
          <form onSubmit={handleSave}>
            <div style={styles.formGrid} className="edit-profile-grid">
              
              {/* Bagian Kiri: Upload Foto */}
              <div style={styles.avatarUploadWrapper} className="upload-section">
                <div style={styles.previewBox}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  ) : (
                    <UserIcon size={80} color={colors.textMuted} />
                  )}
                  <label htmlFor="upload-foto" style={styles.cameraLabel}>
                    <Camera size={20} />
                  </label>
                  <input id="upload-foto" type="file" accept="image/*" hidden onChange={handleImageChange} />
                </div>
                <p style={{fontSize: '12px', color: colors.textMuted, marginTop: '15px', textAlign: 'center'}}>
                  Klik ikon kamera untuk <br/> mengganti foto profil
                </p>
              </div>

              {/* Bagian Kanan: Input Teks */}
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>NAMA LENGKAP</label>
                  <input 
                    style={styles.input} 
                    value={formData.nama} 
                    onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                    placeholder="Masukkan nama lengkap Anda"
                    required 
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>NOMOR WHATSAPP</label>
                  <input 
                    style={styles.input} 
                    value={formData.noHp} 
                    onChange={(e) => setFormData({...formData, noHp: e.target.value})} 
                    placeholder="Contoh: 081234567890"
                    required 
                  />
                </div>

                <button type="submit" style={styles.saveBtn} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {loading ? 'Sedang Menyimpan...' : 'Simpan Perubahan Profil'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .edit-profile-grid input:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 4px ${colors.primary}15; }
        @media (max-width: 768px) {
          .edit-profile-grid { grid-template-columns: 1fr !important; }
          .upload-section { border-right: none !important; border-bottom: 1px solid ${colors.border}; padding-bottom: 30px !important; }
        }
      `}</style>
    </AdminLayout>
  );
};

export default EditProfileAdmin;