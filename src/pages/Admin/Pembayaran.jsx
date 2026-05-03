import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, update, remove, push, set } from 'firebase/database';
import { CheckCircle, XCircle, Clock, User, BookOpen, Calendar, DollarSign, Eye, X, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminVerifikasiPembayaran = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarPendaftaran, setDaftarPendaftaran] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // URL Project Supabase Anda
  const SUPABASE_PROJECT_URL = "https://avedkfdywybzqfqifiyg.supabase.co";

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
    imagePreview: {
      width: '100%',
      height: '220px',
      objectFit: 'cover',
      borderRadius: '12px',
      cursor: 'pointer',
      border: `1px solid ${colors.border}`,
      transition: '0.3s'
    },
    statusBadge: (status) => {
      const isPending = status === 'Menunggu Konfirmasi Admin' || status === 'Menunggu Pembayaran';
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

  const handleVerify = async (id, userId) => {
    if (window.confirm("Setujui pembayaran? Siswa akan otomatis terdaftar ke data siswa.")) {
      try {
        // 1. Update status pendaftaran di tabel PendaftaranLes
        await update(ref(db, `PendaftaranLes/${id}`), { status: 'Diterima' });
        
        // 2. Tambahkan data ke tabel "Siswa"
        const siswaRef = ref(db, 'Siswa');
        const newSiswaRef = push(siswaRef);
        await set(newSiswaRef, {
            userId: userId,
            nama_siswa: selectedData.nama_siswa,
            nama_kelas: selectedData.nama_kelas,
            jenjang: selectedData.jenjang || "-",
            noHpOrtu: selectedData.noHpOrtu || "-",
            fotoProfil: "", 
            status: "Aktif",
            tanggal_bergabung: new Date().toISOString()
        });

        // 3. Update role user menjadi student di tabel Users jika ada userId
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
      try {
        await remove(ref(db, `PendaftaranLes/${id}`));
        alert("Pendaftaran ditolak dan dihapus.");
        setIsModalOpen(false);
      } catch (error) {
        alert("Gagal menghapus data: " + error.message);
      }
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
                      <div style={{ fontSize: '12px', color: colors.textMuted }}>{item.nama_kelas} ({item.jenjang || 'N/A'})</div>
                    </td>
                    <td style={{ padding: '18px 24px', color: '#10B981', fontWeight: '800' }}>
                      Rp {Number(item.total_bayar).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={styles.statusBadge(item.status)}>
                        {item.status.includes('Menunggu') ? <Clock size={14}/> : <CheckCircle size={14}/>}
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
          <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '700px', boxSizing: 'border-box', border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontWeight: '800' }}>Detail Konfirmasi Pembayaran</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color={colors.textMuted}/></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', marginBottom: '30px' }}>
              {/* Sisi Kiri: Informasi Teks */}
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
                <div style={styles.detailItem}>
                  <Calendar size={20} color={colors.primary} />
                  <div>
                    <label style={styles.detailLabel}>KETERANGAN</label>
                    <div style={styles.detailValue}>{selectedData.keterangan} {selectedData.bulan !== '-' && `(${selectedData.bulan})`}</div>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: Bukti Gambar */}
              <div>
                <label style={styles.detailLabel}>BUKTI TRANSFER (SUPABASE)</label>
                <div style={{ marginTop: '8px' }}>
                  {selectedData.imageUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={selectedData.imageUrl} 
                        alt="Bukti Pembayaran" 
                        style={styles.imagePreview} 
                        onClick={() => window.open(selectedData.imageUrl, '_blank')}
                      />
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', color: colors.primary, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }} onClick={() => window.open(selectedData.imageUrl, '_blank')}>
                        <ExternalLink size={14} /> Lihat Ukuran Penuh
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '200px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${colors.border}`, textAlign: 'center', padding: '15px' }}>
                      <XCircle size={32} color={colors.textMuted} style={{ marginBottom: '10px' }} />
                      <span style={{ color: colors.textMuted, fontSize: '12px' }}>Bukti gambar tidak ditemukan di database.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            {selectedData.status !== 'Diterima' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: `1px solid ${colors.border}`, paddingTop: '25px' }}>
                <button 
                  onClick={() => handleReject(selectedData.id)}
                  style={{ padding: '14px', backgroundColor: isDarkMode ? '#EF444420' : '#EF444410', color: '#EF4444', border: `1px solid #EF444430`, borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}
                >
                  <XCircle size={20} /> Tolak Bukti
                </button>
                <button 
                  onClick={() => handleVerify(selectedData.id, selectedData.userId)}
                  style={{ padding: '14px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                >
                  <CheckCircle size={20} /> Verifikasi & Terima
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