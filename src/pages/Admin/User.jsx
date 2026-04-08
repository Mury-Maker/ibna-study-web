import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { Edit, Trash2, X, Save, UserCheck, UserPlus, Mail, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const ManajemenUser = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarUser, setDaftarUser] = useState([]);
  const [activeTab, setActiveTab] = useState('not student'); // 'not student' atau 'student'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    role: ''
  });

  // Fetch data dari node "Users"
  useEffect(() => {
    const userRef = ref(db, 'Users');
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDaftarUser(list);
      } else {
        setDaftarUser([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter user berdasarkan tab yang aktif
  const filteredUsers = daftarUser.filter(user => user.role === activeTab);

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '15px' },
    tabBtn: (isActive) => ({
      padding: '10px 20px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: isActive ? colors.primary : 'transparent',
      color: isActive ? '#fff' : colors.textMuted,
      cursor: 'pointer',
      fontWeight: '700',
      transition: '0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }),
    card: { backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden' },
    tableHeader: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: colors.textMuted, fontSize: '12px', fontWeight: '800' },
    actionBtn: (color) => ({
      padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: color + '15', color: color, cursor: 'pointer', margin: '0 4px'
    }),
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: colors.cardBg, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: `1px solid ${colors.border}` },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff', color: colors.textPrimary, marginTop: '5px' }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await update(ref(db, `Users/${editId}`), formData);
      closeModal();
    } catch (error) { alert("Gagal memperbarui data."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus user ini?")) {
      await remove(ref(db, `Users/${id}`));
    }
  };

  const openModal = (user) => {
    setEditId(user.id);
    setFormData({ nama: user.nama, role: user.role });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  return (
    <AdminLayout title="Manajemen User">
      <div style={styles.container}>
        
        {/* Tab Menu */}
        <div style={styles.tabContainer}>
          <button 
            style={styles.tabBtn(activeTab === 'not student')} 
            onClick={() => setActiveTab('not student')}
          >
            <UserPlus size={18} /> Calon Siswa (Belum Daftar)
          </button>
          <button 
            style={styles.tabBtn(activeTab === 'student')} 
            onClick={() => setActiveTab('student')}
          >
            <UserCheck size={18} /> Siswa Aktif (Sudah Daftar)
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>
            {activeTab === 'student' ? 'Daftar Siswa IBNA Study' : 'Antrean Calon Siswa'}
          </h2>
          <p style={{ color: colors.textMuted, fontSize: '14px' }}>Total: {filteredUsers.length} Orang</p>
        </div>

        {/* Table */}
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>NAMA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>EMAIL</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>TGL DAFTAR</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '18px 24px', color: colors.textPrimary, fontWeight: '600' }}>{user.nama}</td>
                    <td style={{ padding: '18px 24px', color: colors.textMuted }}><Mail size={14} /> {user.email}</td>
                    <td style={{ padding: '18px 24px', color: colors.textMuted }}><Calendar size={14} /> {user.tanggal_daftar || '-'}</td>
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <button onClick={() => openModal(user)} style={styles.actionBtn('#3B82F6')}><Edit size={18} /></button>
                      <button onClick={() => handleDelete(user.id)} style={styles.actionBtn('#EF4444')}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Data tidak ditemukan.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Edit Role */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Edit User</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>NAMA LENGKAP</label>
                <input style={styles.input} type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>STATUS/ROLE</label>
                <select 
                  style={styles.input} 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="not student">Calon Siswa</option>
                  <option value="student">Siswa Aktif</option>
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Save size={18} /> Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManajemenUser;