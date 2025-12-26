import React, { useState, useMemo } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  FileSpreadsheet, 
  Users, 
  ChevronRight, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

const RekapNilai = () => {
  const { colors, isDarkMode } = useTheme();
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State simulasi untuk menyimpan data kelas mana saja yang sudah direkap bulan ini
  const [rekapStatus, setRekapStatus] = useState({
    'XII-IPA-1': { lastUpdate: new Date(), status: 'Selesai' },
    'XII-IPA-2': { lastUpdate: null, status: 'Belum' },
    'XI-IPS-1': { lastUpdate: null, status: 'Belum' },
  });

  const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());

  const daftarKelas = [
    { id: 'XII-IPA-1', jumlahSiswa: 32 },
    { id: 'XII-IPA-2', jumlahSiswa: 30 },
    { id: 'XI-IPS-1', jumlahSiswa: 28 },
  ];

  const dataNilaiSiswa = [
    { id: 1, nama: "Aditya Pratama", tugas: 85, uts: 80, uas: 90, rata: 85 },
    { id: 2, nama: "Budi Santoso", tugas: 70, uts: 75, uas: 60, rata: 68 },
  ];

  const handleProsesRekap = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const now = new Date();
      setRekapStatus(prev => ({
        ...prev,
        [selectedKelas]: { lastUpdate: now, status: 'Selesai' }
      }));
      alert(`Rekap nilai untuk kelas ${selectedKelas} berhasil diperbarui!`);
    }, 2000);
  };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      position: 'relative',
      transition: 'all 0.3s ease'
    },
    statusBadge: (isDone) => ({
      position: 'absolute',
      top: '15px',
      right: '15px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      color: isDone ? '#10b981' : '#f59e0b',
      border: `1px solid ${isDone ? '#10b981' : '#f59e0b'}`
    }),
    rekapBtn: (isDone) => ({
      width: '100%',
      padding: '12px',
      marginTop: '15px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: isDone ? colors.primary : '#f59e0b',
      color: '#fff',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: '0.2s'
    }),
    noteBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '15px',
      borderRadius: '10px',
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
      border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fef3c7'}`,
      marginBottom: '20px',
      color: isDarkMode ? '#fbbf24' : '#b45309',
      fontSize: '14px'
    }
  };

  // --- VIEW 1: PILIH KELAS DENGAN INDIKATOR ---
  if (!selectedKelas) {
    return (
      <GuruLayout title="Rekap Nilai Siswa">
        <div style={styles.container}>
          <h2 style={{ color: colors.textPrimary, fontSize: '24px', fontWeight: '800' }}>Pilih Kelas</h2>
          <p style={{ color: colors.textMuted }}>Pantau status rekapitulasi nilai bulanan Anda di sini.</p>

          <div style={styles.grid}>
            {daftarKelas.map((kls) => {
              const info = rekapStatus[kls.id];
              const isDone = info?.status === 'Selesai';

              return (
                <div key={kls.id} style={styles.card} className="class-card">
                  <div style={styles.statusBadge(isDone)}>
                    {isDone ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {isDone ? 'Selesai' : 'Perlu Rekap'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                    <div style={{ 
                      width: '45px', height: '45px', borderRadius: '10px', 
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary 
                    }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: colors.textPrimary, fontSize: '18px' }}>{kls.id}</h4>
                      <span style={{ fontSize: '13px', color: colors.textMuted }}>{kls.jumlahSiswa} Siswa</span>
                    </div>
                  </div>

                  <button 
                    style={styles.rekapBtn(isDone)}
                    onClick={() => setSelectedKelas(kls.id)}
                  >
                    {isDone ? 'Lihat Rekap' : 'Mulai Rekap'} <ChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <style>{`.class-card:hover { transform: translateY(-5px); border-color: ${colors.primary}; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }`}</style>
      </GuruLayout>
    );
  }

  // --- VIEW 2: DETAIL REKAP ---
  const kelasInfo = rekapStatus[selectedKelas];
  const isDoneThisMonth = kelasInfo?.lastUpdate && new Date(kelasInfo.lastUpdate).getMonth() === new Date().getMonth();

  return (
    <GuruLayout title={`Rekap Nilai - ${selectedKelas}`}>
      <div style={styles.container}>
        <button 
          style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }} 
          onClick={() => setSelectedKelas(null)}
        >
          <ArrowLeft size={18} /> Kembali ke Daftar Kelas
        </button>

        {!isDoneThisMonth && (
          <div style={styles.noteBox}>
            <AlertTriangle size={20} />
            <span>
              <strong>Peringatan:</strong> Data nilai untuk bulan <b>{currentMonth}</b> belum diproses. Tekan tombol <b>Proses Rekap</b> untuk sinkronisasi.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h3 style={{ color: colors.textPrimary, margin: '0 0 5px 0', fontSize: '20px' }}>Detail Nilai Siswa</h3>
            {kelasInfo?.lastUpdate && (
              <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle size={14} /> Terupdate: {new Date(kelasInfo.lastUpdate).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              style={{ ...styles.rekapBtn(true), marginTop: 0, width: 'auto', padding: '10px 20px', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.textPrimary, border: `1px solid ${colors.border}` }} 
              onClick={handleProsesRekap}
              disabled={isProcessing}
            >
              <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
              {isProcessing ? "Menghitung..." : "Proses Rekap"}
            </button>

            <button style={{ ...styles.rekapBtn(true), marginTop: 0, width: 'auto', padding: '10px 20px', backgroundColor: '#10B981' }}>
              <FileSpreadsheet size={18} /> Export Excel
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>NAMA SISWA</th>
                <th style={{ padding: '15px', textAlign: 'left', color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>RATA-RATA</th>
                <th style={{ padding: '15px', textAlign: 'left', color: colors.textMuted, borderBottom: `1px solid ${colors.border}`, fontSize: '13px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {dataNilaiSiswa.map((siswa) => (
                <tr key={siswa.id}>
                  <td style={{ padding: '15px', borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary, fontWeight: '600' }}>{siswa.nama}</td>
                  <td style={{ padding: '15px', borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary, fontWeight: 'bold' }}>{siswa.rata}</td>
                  <td style={{ padding: '15px', borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                      backgroundColor: siswa.rata >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: siswa.rata >= 75 ? '#10b981' : '#ef4444'
                    }}>
                      {siswa.rata >= 75 ? "TUNTAS" : "REMEDIAL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </GuruLayout>
  );
};

export default RekapNilai;