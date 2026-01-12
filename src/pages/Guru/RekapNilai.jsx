import React, { useState, useEffect } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../api/firebase';
import { ref, onValue } from 'firebase/database';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Users, ChevronRight, ArrowLeft, 
  RefreshCw, CheckCircle, AlertTriangle, Lock, ClipboardCheck
} from 'lucide-react';

const RekapNilai = () => {
  const { colors, isDarkMode } = useTheme();
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [dataNilaiSiswa, setDataNilaiSiswa] = useState([]);
  const [rekapStatus, setRekapStatus] = useState({});
  const [kelasStatusMap, setKelasStatusMap] = useState({}); // Untuk simpan status validasi tiap kelas

  const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());

  // 1. Ambil Daftar Kelas & Validasi Status Koreksi Tiap Kelas
  useEffect(() => {
    onValue(ref(db, 'Kelas'), (snapKelas) => {
      if (snapKelas.exists()) {
        const listKls = Object.keys(snapKelas.val()).map(k => ({
          id: snapKelas.val()[k].nama_kelas,
          jumlahSiswa: 0
        }));

        // Scan Status Nilai secara Global
        onValue(ref(db, 'Nilai'), (snapNilai) => {
          const allNilai = snapNilai.exists() ? Object.values(snapNilai.val()) : [];
          const statusMap = {};

          listKls.forEach(kls => {
            // Cek apakah ada pengerjaan di kelas ini yang BELUM selesai dikoreksi
            const adaTugasGantung = allNilai.some(n => 
              n.nama_kelas === kls.id && n.statusKoreksi !== "Selesai"
            );
            statusMap[kls.id] = adaTugasGantung ? "Perlu Penilaian" : "Siap Rekap";
          });

          setKelasStatusMap(statusMap);
          setDaftarKelas(listKls);
        });
      }
    });
  }, []);

  // 2. Hitung Jumlah Siswa per Kelas
  useEffect(() => {
    onValue(ref(db, 'Siswa'), (snap) => {
      if (snap.exists()) {
        const siswa = snap.val();
        setDaftarKelas(prev => prev.map(kls => ({
          ...kls,
          jumlahSiswa: Object.values(siswa).filter(s => s.nama_kelas === kls.id).length
        })));
      }
    });
  }, []);

  const handleProsesRekap = () => {
    if (kelasStatusMap[selectedKelas] !== "Siap Rekap") {
        return alert("Gagal! Masih ada tugas yang belum dinilai. Selesaikan koreksi di Tab Nilai tiap Mapel!");
    }

    setIsProcessing(true);
    onValue(ref(db, 'Nilai'), (snapNilai) => {
      const allNilai = snapNilai.exists() ? Object.values(snapNilai.val()) : [];
      onValue(ref(db, 'Siswa'), (snapSiswa) => {
        const allSiswa = snapSiswa.val() || {};
        const filteredSiswa = Object.keys(allSiswa)
          .filter(k => allSiswa[k].nama_kelas === selectedKelas)
          .map(k => ({ id: k, nama: allSiswa[k].nama_siswa }));

        const hasilKalkulasi = filteredSiswa.map(s => {
          const nilaiSiswa = allNilai.filter(n => n.studentId === s.id);
          const totalSkor = nilaiSiswa.reduce((acc, curr) => acc + (curr.skor || 0), 0);
          const rata = nilaiSiswa.length > 0 ? (totalSkor / nilaiSiswa.length).toFixed(1) : 0;
          return { id: s.id, nama: s.nama, rata: parseFloat(rata), jumlahKuis: nilaiSiswa.length };
        });

        setDataNilaiSiswa(hasilKalkulasi);
        setIsProcessing(false);
        setRekapStatus(prev => ({ ...prev, [selectedKelas]: { lastUpdate: new Date(), status: 'Selesai' } }));
      }, { onlyOnce: true });
    }, { onlyOnce: true });
  };

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' },
    card: { backgroundColor: colors.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.border}`, position: 'relative', transition: '0.3s' },
    badge: (status) => ({
      padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px',
      backgroundColor: status === "Siap Rekap" ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      color: status === "Siap Rekap" ? '#10b981' : '#ef4444',
      border: `1px solid ${status === "Siap Rekap" ? '#10b981' : '#ef4444'}`
    })
  };

  // --- VIEW 1: DAFTAR KELAS DENGAN STATUS VALIDASI ---
  if (!selectedKelas) {
    return (
      <GuruLayout title="Rekap Nilai Global">
        <div style={styles.container}>
          <h2 style={{ color: colors.textPrimary, fontWeight: '800' }}>Pilih Kelas</h2>
          <p style={{ color: colors.textMuted }}>Monitor kesiapan rekapitulasi nilai kuis tiap kelas.</p>

          <div style={styles.grid}>
            {daftarKelas.map((kls) => {
              const status = kelasStatusMap[kls.id] || "Checking...";
              const isReady = status === "Siap Rekap";
              
              return (
                <div key={kls.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: colors.primary + '15' }}>
                        <Users size={24} color={colors.primary} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: colors.textPrimary }}>{kls.id}</h4>
                        <span style={{ fontSize: '12px', color: colors.textMuted }}>{kls.jumlahSiswa} Murid Terdaftar</span>
                      </div>
                    </div>
                    <div style={styles.badge(status)}>
                        {isReady ? <ClipboardCheck size={12}/> : <AlertTriangle size={12}/>}
                        {status.toUpperCase()}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedKelas(kls.id)}
                    style={{ 
                      width: '100%', padding: '12px', marginTop: '20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer',
                      backgroundColor: isReady ? colors.primary : '#94a3b8', color: '#fff'
                    }}
                  >
                    {isReady ? "Buka Rekapitulasi" : "Selesaikan Penilaian"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </GuruLayout>
    );
  }

  // --- VIEW 2: DETAIL REKAP ---
  const currentKlsStatus = kelasStatusMap[selectedKelas];
  return (
    <GuruLayout title={`Rekap - ${selectedKelas}`}>
      <div style={styles.container}>
        <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setSelectedKelas(null)}>
          <ArrowLeft size={18} /> Kembali
        </button>

        {currentKlsStatus !== "Siap Rekap" ? (
          <div style={{ padding: '15px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Lock size={20} />
            <span style={{ fontSize: '14px' }}><strong>Akses Terkunci:</strong> Rekap bulan ini tidak bisa diproses karena masih ada kuis siswa yang belum dinilai.</span>
          </div>
        ) : (
          <div style={{ padding: '15px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <CheckCircle size={20} />
            <span style={{ fontSize: '14px' }}><strong>Siap Rekap:</strong> Seluruh pengerjaan kuis siswa di kelas ini sudah dinilai.</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
          <h3 style={{ color: colors.textPrimary, margin: 0 }}>Rata-rata Nilai Gabungan</h3>
          <button 
            onClick={handleProsesRekap} 
            disabled={isProcessing || currentKlsStatus !== "Siap Rekap"}
            style={{ 
              padding: '12px 24px', borderRadius: '10px', border: 'none', color: '#fff', fontWeight: '800', display: 'flex', gap: '8px', alignItems: 'center',
              backgroundColor: currentKlsStatus === "Siap Rekap" ? colors.primary : '#cbd5e1',
              cursor: currentKlsStatus === "Siap Rekap" ? 'pointer' : 'not-allowed'
            }}
          >
            <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
            {isProcessing ? "Mengkalkulasi..." : "Proses Nilai Akhir"}
          </button>
        </div>

        <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <th style={{ padding: '18px', textAlign: 'left', color: colors.textMuted, fontSize: '12px' }}>NAMA SISWA</th>
                <th style={{ padding: '18px', textAlign: 'center', color: colors.textMuted, fontSize: '12px' }}>JUMLAH KUIS</th>
                <th style={{ padding: '18px', textAlign: 'center', color: colors.textMuted, fontSize: '12px' }}>RATA-RATA BULANAN</th>
                <th style={{ padding: '18px', textAlign: 'center', color: colors.textMuted, fontSize: '12px' }}>HASIL</th>
              </tr>
            </thead>
            <tbody>
              {dataNilaiSiswa.map((siswa) => (
                <tr key={siswa.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '18px', color: colors.textPrimary, fontWeight: '700' }}>{siswa.nama}</td>
                  <td style={{ padding: '18px', textAlign: 'center', color: colors.textPrimary }}>{siswa.jumlahKuis} Tugas</td>
                  <td style={{ padding: '18px', textAlign: 'center', color: colors.primary, fontWeight: '900', fontSize: '18px' }}>{siswa.rata}</td>
                  <td style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ 
                        padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900',
                        backgroundColor: siswa.rata >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: siswa.rata >= 75 ? '#10b981' : '#ef4444'
                    }}>
                      {siswa.rata >= 75 ? "TUNTAS" : "REMEDIAL"}
                    </span>
                  </td>
                </tr>
              ))}
              {dataNilaiSiswa.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Tekan tombol "Proses Nilai Akhir" untuk melihat hasil rekap.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GuruLayout>
  );
};

export default RekapNilai;