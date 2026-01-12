import React, { useState } from 'react';
import { ChevronLeft, Calendar, Clock, User, MessageCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const DetailPengajuan = ({ data, onBack, onConfirmAction }) => {
  const { colors, isDarkMode } = useTheme();
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const styles = {
    card: { 
      backgroundColor: colors.cardBg, 
      padding: '25px', 
      borderRadius: '16px', 
      border: `1px solid ${colors.border}`, 
      width: '100%', 
      boxSizing: 'border-box' 
    },
    // Grid untuk menampilkan info waktu secara sejajar dan Gagah
    infoBox: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
      gap: '10px', 
      backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', 
      padding: '15px', 
      borderRadius: '12px', 
      marginBottom: '20px',
      border: `1px solid ${colors.border}`
    },
    actionBtn: (type) => ({
      flex: 1, 
      padding: '14px', 
      borderRadius: '10px', 
      border: 'none', 
      cursor: 'pointer', 
      fontWeight: '700', 
      fontSize: '14px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '10px',
      backgroundColor: type === 'approve' ? '#16a34a' : type === 'reject' ? '#dc2626' : colors.border, 
      color: type === 'cancel' ? colors.textPrimary : '#fff',
      transition: '0.2s'
    }),
    // Warna Badge sinkron dengan skema Menunggu | Disetujui | Ditolak
    badgeStatus: (status) => ({
      padding: '6px 16px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: '800',
      backgroundColor: 
        status === 'Disetujui' ? 'rgba(22, 163, 74, 0.1)' : 
        status === 'Ditolak' ? 'rgba(220, 38, 38, 0.1)' : 
        'rgba(245, 158, 11, 0.1)',
      color: 
        status === 'Disetujui' ? '#16a34a' : 
        status === 'Ditolak' ? '#dc2626' : 
        '#f59e0b',
      border: `1px solid ${
        status === 'Disetujui' ? '#16a34a' : 
        status === 'Ditolak' ? '#dc2626' : 
        '#f59e0b'
      }`
    })
  };

  return (
    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', marginBottom: '15px', fontWeight: '700', fontSize: '13px', padding: 0 }}>
        <ChevronLeft size={18} /> Kembali ke Daftar
      </button>

      <div style={styles.card}>
        {/* Header Profil Siswa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} />
            </div>
            <div>
              <h2 style={{ color: colors.textPrimary, margin: 0, fontSize: '15px', fontWeight: '700' }}>{data.namaSiswa}</h2>
              <p style={{ color: colors.textMuted, margin: '2px 0 0', fontSize: '12px' }}>{data.nama_kelas} • {data.jenjang}</p>
            </div>
          </div>
          <span style={styles.badgeStatus(data.status)}>{data.status}</span>
        </div>

        {/* Info Box: Menampilkan Tanggal dan Jam Diminta */}
        <div style={styles.infoBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.textPrimary }}>
            <Calendar size={18} color={colors.primary} /> 
            <div>
              <span style={{fontSize:'10px', color:colors.textMuted, fontWeight:'700'}}>TANGGAL DIMINTA</span><br/>
              <strong style={{fontSize:'13px'}}>{data.tglDiminta || '-'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.textPrimary }}>
            <Clock size={18} color={colors.primary} /> 
            <div>
              <span style={{fontSize:'10px', color:colors.textMuted, fontWeight:'700'}}>JAM DIMINTA</span><br/>
              <strong style={{fontSize:'13px'}}>{data.jamDiminta || '-'}</strong>
            </div>
          </div>
        </div>

        {/* Detail Alasan Permintaan Siswa */}
        <div style={{ marginBottom: '25px' }}>
          <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: '800', letterSpacing: '1px' }}>ALASAN PERMINTAAN:</span>
          <p style={{ color: colors.textPrimary, fontSize: '14px', lineHeight: '1.6', marginTop: '8px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '10px' }}>
            <MessageCircle size={16} style={{marginRight:'8px', verticalAlign:'middle', color: colors.primary}}/>
            {data.alasanPermintaan || data.pesanSiswa}
          </p>
        </div>

        {/* Info Alasan Penolakan Jika Sudah Ditolak */}
        {data.status === "Ditolak" && data.alasanPenolakan && (
          <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)', borderLeft: '4px solid #dc2626', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <Info size={16} color="#dc2626" />
            <div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626' }}>ALASAN GURU:</span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textPrimary }}>{data.alasanPenolakan}</p>
            </div>
          </div>
        )}

        {/* Tombol Aksi: Hanya Muncul Jika Status "Menunggu" */}
        {data.status === "Menunggu" && !isRejecting && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={styles.actionBtn('approve')} onClick={() => onConfirmAction(data.id, 'Disetujui')}>
              <CheckCircle2 size={18}/> Terima
            </button>
            <button style={styles.actionBtn('reject')} onClick={() => setIsRejecting(true)}>
              <XCircle size={18}/> Tolak
            </button>
          </div>
        )}

        {/* Form Penolakan */}
        {isRejecting && (
          <div style={{ marginTop: '10px', borderTop: `1px solid ${colors.border}`, paddingTop: '20px' }}>
            <h4 style={{ color: colors.textPrimary, marginBottom: '12px', fontSize: '14px' }}>Alasan Penolakan:</h4>
            <textarea 
              placeholder="Berikan alasan atau saran jadwal lain..." 
              style={{ width: '100%', height: '90px', padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textPrimary, outline: 'none', boxSizing: 'border-box', fontSize: '13px' }} 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
              <button style={styles.actionBtn('cancel')} onClick={() => setIsRejecting(false)}>Batal</button>
              <button style={styles.actionBtn('reject')} onClick={() => onConfirmAction(data.id, 'Ditolak', reason)} disabled={!reason}>Kirim Penolakan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPengajuan;