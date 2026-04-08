import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { 
  Plus, Edit, Trash2, X, Save, Clock, 
  User, LayoutGrid, Calendar as CalendarIcon 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminJadwal = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarJadwal, setDaftarJadwal] = useState([]);
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    kelasId: '',
    hari: '',
    jamMulai: '',
    jamSelesai: '',
    namaGuru: ''
  });

  const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  useEffect(() => {
    const jadwalRef = ref(db, 'JadwalKelas');
    onValue(jadwalRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarJadwal(list);
      } else {
        setDaftarJadwal([]);
      }
    });

    const kelasRef = ref(db, 'Kelas');
    onValue(kelasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarKelas(list);
      }
    });
  }, []);

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    card: { 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '16px', 
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    },
    input: {
      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', 
      color: colors.textPrimary, marginTop: '5px', boxSizing: 'border-box', fontSize: '14px'
    },
    select: {
      width: '100%', padding: '12px 40px', borderRadius: '10px', 
      border: `1px solid ${colors.border}`, 
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', 
      color: colors.textPrimary, marginTop: '5px', boxSizing: 'border-box',
      appearance: 'none', cursor: 'pointer' 
      // fontWeight: '600' dihapus agar teks tidak bold
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await update(ref(db, `JadwalKelas/${editId}`), formData);
      } else {
        const newRef = push(ref(db, 'JadwalKelas'));
        await set(newRef, formData);
      }
      closeModal();
    } catch (error) {
      alert("Gagal menyimpan jadwal.");
    }
  };

  const openModal = (jadwal = null) => {
    if (jadwal) {
      setEditId(jadwal.id);
      setFormData({ 
        kelasId: jadwal.kelasId, hari: jadwal.hari, 
        jamMulai: jadwal.jamMulai, jamSelesai: jadwal.jamSelesai, 
        namaGuru: jadwal.namaGuru 
      });
    } else {
      setEditId(null);
      setFormData({ kelasId: '', hari: '', jamMulai: '', jamSelesai: '', namaGuru: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  return (
    <AdminLayout title="Manajemen Jadwal">
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Jadwal Pelajaran</h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Atur waktu belajar dan guru pengajar</p>
          </div>
          <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>
            <Plus size={20} /> Tambah Jadwal
          </button>
        </div>

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>KELAS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>HARI & WAKTU</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>GURU</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {daftarJadwal.map((j) => {
                  const kls = daftarKelas.find(k => k.id === j.kelasId);
                  return (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>
                        {kls ? kls.nama_kelas : 'Memuat...'}
                      </td>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary }}>
                        <div style={{ fontWeight: '700' }}>{j.hari}</div>
                        <div style={{ fontSize: '12px', color: colors.textMuted }}>{j.jamMulai} - {j.jamSelesai}</div>
                      </td>
                      <td style={{ padding: '18px 24px', color: colors.textPrimary }}>{j.namaGuru}</td>
                      <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                        <button onClick={() => openModal(j)} style={{ background: 'none', border: 'none', color: '#3B82F6', marginRight: '10px', cursor: 'pointer' }}><Edit size={18} /></button>
                        <button onClick={() => remove(ref(db, `JadwalKelas/${j.id}`))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <CalendarIcon size={160} style={{ position: 'absolute', right: '-30px', bottom: '-30px', color: colors.primary + '08', transform: 'rotate(-15deg)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>PILIH KELAS</label>
                    <div style={{ position: 'relative' }}>
                    <LayoutGrid size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                    <select 
                        style={styles.select} 
                        value={formData.kelasId} 
                        onChange={(e) => setFormData({...formData, kelasId: e.target.value})} 
                        required
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {daftarKelas.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas} ({k.jenjang})</option>
                        ))}
                    </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>HARI</label>
                    <select style={styles.select} value={formData.hari} onChange={(e) => setFormData({...formData, hari: e.target.value})} required>
                      <option value="">-- Pilih --</option>
                      {daftarHari.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>GURU PENGAJAR</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                      <input style={styles.input} type="text" value={formData.namaGuru} onChange={(e) => setFormData({...formData, namaGuru: e.target.value})} placeholder="Nama Guru" required />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>JAM MULAI</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                      <input style={styles.input} type="time" value={formData.jamMulai} onChange={(e) => setFormData({...formData, jamMulai: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted }}>JAM SELESAI</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={18} style={{ position: 'absolute', left: '12px', top: '18px', color: colors.textMuted }} />
                      <input style={styles.input} type="time" value={formData.jamSelesai} onChange={(e) => setFormData({...formData, jamSelesai: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <Save size={20} /> Simpan Jadwal
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminJadwal;