import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MessageSquare, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  FileText, 
  ChevronRight,
  Paperclip,
  GraduationCap,
  Eye,
  EyeOff,
  Download,
  Edit3
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const DetailPertanyaan = ({ data, onBack, onReply }) => {
  const { colors, isDarkMode } = useTheme();
  const [showImage, setShowImage] = useState(false);

  // Fungsi untuk cek tipe file agar tampilan tidak memakan tempat
  const isImage = (url) => {
    return url && url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  };

  const styles = {
    container: { width: '100%', animation: 'fadeIn 0.3s ease', boxSizing: 'border-box' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', marginBottom: '15px', fontWeight: '700', padding: 0, fontSize: '13px' },
    card: { backgroundColor: colors.cardBg, padding: '25px', borderRadius: '16px', border: `1px solid ${colors.border}`, width: '100%', boxSizing: 'border-box' },
    sectionLabel: { fontSize: '10px', color: colors.textMuted, marginBottom: '8px', fontWeight: '800', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' },
    imagePreview: { 
      marginTop: '15px', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      border: `1px solid ${colors.border}`,
      maxHeight: showImage ? '1000px' : '0px',
      transition: 'all 0.4s ease-in-out',
      opacity: showImage ? 1 : 0
    },
    fileBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '10px',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      border: `1px solid ${colors.border}`,
      marginTop: '10px',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      {/* Tombol Kembali */}
      <button onClick={onBack} style={styles.backBtn}>
        <ChevronLeft size={18} /> Kembali ke Daftar Pertanyaan
      </button>
      
      <div style={styles.card}>
        {/* Header: Profil Siswa & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} />
            </div>
            <div>
              <h2 style={{ color: colors.textPrimary, margin: 0, fontSize: '16px', fontWeight: '700' }}>{data.namaSiswa}</h2>
              <p style={{ color: colors.textMuted, margin: '2px 0 0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <GraduationCap size={14} /> {data.nama_kelas}
              </p>
            </div>
          </div>
          <span style={{ 
            padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', 
            backgroundColor: data.status === 'Terjawab' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
            color: data.status === 'Terjawab' ? '#16a34a' : '#f59e0b', 
            border: `1px solid ${data.status === 'Terjawab' ? '#16a34a' : '#f59e0b'}` 
          }}>
            {data.status.toUpperCase()}
          </span>
        </div>

        {/* Info Waktu */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', color: colors.textMuted, fontSize: '12px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(data.createdAt).toLocaleDateString('id-ID')}</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(data.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
        </div>

        {/* Konten Pertanyaan Siswa */}
        <div style={{ marginBottom: '30px' }}>
          <span style={styles.sectionLabel}>PERTANYAAN SISWA</span>
          <h3 style={{ color: colors.textPrimary, margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>{data.judulPertanyaan}</h3>
          <p style={{ color: colors.textPrimary, fontSize: '14.5px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {data.deskripsiPR}
          </p>
          
          {/* Lampiran Soal (Universal: Gambar/File) */}
          {data.fileUrl && (
            <div style={{ marginTop: '20px' }}>
              <span style={styles.sectionLabel}><Paperclip size={12} /> LAMPIRAN SOAL</span>
              {isImage(data.fileUrl) ? (
                <>
                  <button onClick={() => setShowImage(!showImage)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '8px', border: `1px solid ${colors.primary}`, background: 'transparent', color: colors.primary, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    {showImage ? <EyeOff size={16} /> : <Eye size={16} />} {showImage ? "Sembunyikan Gambar" : "Lihat Lampiran Gambar"}
                  </button>
                  <div style={styles.imagePreview}>
                    <img src={data.fileUrl} alt="soal" style={{ width: '100%', display: 'block' }} />
                  </div>
                </>
              ) : (
                <div style={styles.fileBadge} onClick={() => window.open(data.fileUrl)}>
                  <FileText size={20} color={colors.primary} />
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: colors.textPrimary }}>Dokumen Soal Siswa</p></div>
                  <Download size={18} color={colors.textMuted} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Jawaban & Fitur Edit */}
        {data.status === "Terjawab" ? (
          <div style={{ marginTop: '20px', padding: '25px', borderRadius: '15px', backgroundColor: isDarkMode ? 'rgba(22, 163, 74, 0.05)' : '#f0fdf4', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
            <span style={{ ...styles.sectionLabel, color: '#166534' }}><CheckCircle size={14} /> JAWABAN ANDA</span>
            <h4 style={{ color: colors.textPrimary, margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>{data.judulJawaban}</h4>
            <p style={{ color: colors.textPrimary, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{data.deskripsiJawaban}</p>
            
            {data.urlFileJawaban && (
              <div style={{ ...styles.fileBadge, marginTop: '15px', borderColor: '#16a34a' }} onClick={() => window.open(data.urlFileJawaban)}>
                <FileText size={20} color="#16a34a" />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>File Pembahasan Anda</p>
              </div>
            )}

            {/* TOMBOL EDIT JAWABAN */}
            <button 
              onClick={() => onReply(data)} // FIX: Mengirim objek data agar form edit terisi otomatis
              style={{ marginTop: '20px', background: 'none', border: 'none', color: colors.primary, fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
            >
              <Edit3 size={16} /> Edit Jawaban <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onReply(data)} 
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: colors.primary, color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px' }}
          >
            <MessageSquare size={18} /> Berikan Jawaban Sekarang
          </button>
        )}
      </div>
    </div>
  );
};

export default DetailPertanyaan;