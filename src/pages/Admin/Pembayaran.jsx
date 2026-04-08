import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
// Tambahkan push dan set di import ini
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import { CheckCircle, XCircle, Clock, User, BookOpen, Calendar, DollarSign, Eye, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminVerifikasiPembayaran = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarPendaftaran, setDaftarPendaftaran] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const pendaftaranRef = ref(db, 'PendaftaranLes');
    const unsubscribe = onValue(pendaftaranRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setDaftarPendaftaran(list);
      } else {
        setDaftarPendaftaran([]);
      }
    });

    return () => unsubscribe();
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
    statusBadge: (status) => {
      const isPending = status === 'Menunggu Konfirmasi Admin';
      const bg = isPending ? '#F59E0B15' : '#10B98115';
      const co = isPending ? '#F59E0B' : '#10B981';
      return {
        padding: '6px 12px', borderRadius: '20px', backgroundColor: bg, color: co, fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px'
      };
    },
    detailItem: { marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' },
    detailLabel: { fontSize: '11px', fontWeight: '800', color: colors.textMuted, display: 'block', marginBottom: '2px' },
    detailValue: { fontSize: '15px', color: colors.textPrimary, fontWeight: '600' }
  };

  // FUNGSI HANDLE VERIFY YANG SUDAH DISESUAIKAN
  const handleVerify = async (id, userId) => {
    if (window.confirm("Setujui pembayaran? Siswa akan otomatis terdaftar ke data siswa.")) {
      try {
        // 1. Update status pendaftaran menjadi Diterima
        await update(ref(db, `PendaftaranLes/${id}`), { status: 'Diterima' });
        
        // 2. Tambahkan data ke tabel "Siswa" (Menyesuaikan gambar referensi)
        const siswaRef = ref(db, 'Siswa');
        const newSiswaRef = push(siswaRef);
        await set(newSiswaRef, {
            userId: userId,
            nama_siswa: selectedData.nama_siswa,
            nama_kelas: selectedData.nama_kelas,
            jenjang: selectedData.jenjang,
            noHpOrtu: selectedData.noHpOrtu || "-", // Pastikan field ini dikirim dari Android
            fotoProfil: "", 
            classId: "" // Bisa dikosongkan dulu atau diisi manual nanti
        });

        // 3. Update role user menjadi student di tabel Users
        if (userId) {
          await update(ref(db, `Users/${userId}`), { role: 'student' });
        }
        
        alert("Verifikasi Berhasil! Data telah ditambahkan ke tabel Siswa.");
        setIsModalOpen(false);
      } catch (error) {
        console.error(error);
        alert("Gagal melakukan verifikasi: " + error.message);
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Tolak bukti pembayaran ini? Data pendaftaran akan dihapus.")) {
      await remove(ref(db, `PendaftaranLes/${id}`));
      setIsModalOpen(false);
    }
  };

  const openModal = (data) => {
    setSelectedData(data);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Verifikasi Pembayaran">
      <div style={styles.container}>
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: colors.textPrimary, fontWeight: '800' }}>Konfirmasi Pendaftaran</h2>
          <p style={{ color: colors.textMuted, fontSize: '14px', margin: '5px 0 0' }}>Validasi bukti bayar siswa untuk akses paket belajar</p>
        </div>

        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>SISWA</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>PAKET & KELAS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>TOTAL BAYAR</th>
                  <th style={{ padding: '18px 24px', textAlign: 'left' }}>STATUS</th>
                  <th style={{ padding: '18px 24px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {daftarPendaftaran.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.2s' }}>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: '700', color: colors.textPrimary }}>{item.nama_siswa}</div>
                      <div style={{ fontSize: '12px', color: colors.textMuted }}>{new Date(item.timestamp).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: '600', color: colors.textPrimary }}>{item.nama_paket}</div>
                      <div style={{ fontSize: '12px', color: colors.textMuted }}>{item.nama_kelas} ({item.jenjang})</div>
                    </td>
                    <td style={{ padding: '18px 24px', color: '#10B981', fontWeight: '800' }}>
                      Rp {Number(item.total_bayar).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={styles.statusBadge(item.status)}>
                        {item.status === 'Menunggu Konfirmasi Admin' ? <Clock size={14}/> : <CheckCircle size={14}/>}
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <button 
                        onClick={() => openModal(item)}
                        style={{ padding: '8px 16px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Eye size={16} /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {daftarPendaftaran.length === 0 && (
                   <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Tidak ada pendaftaran masuk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail & Verifikasi */}
      {isModalOpen && selectedData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '600px', boxSizing: 'border-box', border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>Detail Pendaftaran</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <div style={styles.detailItem}>
                  <User size={20} color={colors.primary} />
                  <div>
                    <label style={styles.detailLabel}>NAMA SISWA</label>
                    <div style={styles.detailValue}>{selectedData.nama_siswa}</div>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <BookOpen size={20} color={colors.primary} />
                  <div>
                    <label style={styles.detailLabel}>PAKET & KELAS</label>
                    <div style={styles.detailValue}>{selectedData.nama_paket} - {selectedData.nama_kelas}</div>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <DollarSign size={20} color={colors.primary} />
                  <div>
                    <label style={styles.detailLabel}>TOTAL PEMBAYARAN</label>
                    <div style={{ ...styles.detailValue, color: '#10B981' }}>Rp {Number(selectedData.total_bayar).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={styles.detailItem}>
                  <Calendar size={20} color={colors.primary} />
                  <div>
                    <label style={styles.detailLabel}>JENIS & BULAN</label>
                    <div style={styles.detailValue}>{selectedData.keterangan} {selectedData.bulan !== '-' && `(${selectedData.bulan})`}</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label style={styles.detailLabel}>BUKTI BAYAR</label>
                  <div style={{ width: '100%', height: '120px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${colors.border}` }}>
                    <span style={{ color: colors.textMuted, fontSize: '12px' }}>Bukti Gambar Terlampir</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedData.status === 'Menunggu Konfirmasi Admin' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <button 
                  onClick={() => handleReject(selectedData.id)}
                  style={{ padding: '14px', backgroundColor: '#EF444415', color: '#EF4444', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px' }}
                >
                  <XCircle size={20} /> Tolak Bukti
                </button>
                <button 
                  onClick={() => handleVerify(selectedData.id, selectedData.userId)}
                  style={{ padding: '14px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                >
                  <CheckCircle size={20} /> Verifikasi Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVerifikasiPembayaran;