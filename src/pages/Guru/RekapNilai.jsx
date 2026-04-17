import React, { useState, useEffect } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../api/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { 
  Users as UsersIcon, ChevronRight, ArrowLeft, 
  RefreshCw, Eye, Calendar, X, Clock, ShieldCheck
} from 'lucide-react';

const RekapNilai = () => {
  const { colors, isDarkMode } = useTheme();
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [dataNilaiSiswa, setDataNilaiSiswa] = useState([]);
  const [allNilaiRaw, setAllNilaiRaw] = useState([]);
  const [allKontenRaw, setAllKontenRaw] = useState({});
  const [allUsers, setAllUsers] = useState({});

  const listBulan = [
    { id: "01", nama: "Januari" }, { id: "02", nama: "Februari" }, { id: "03", nama: "Maret" },
    { id: "04", nama: "April" }, { id: "05", nama: "Mei" }, { id: "06", nama: "Juni" },
    { id: "07", nama: "Juli" }, { id: "08", nama: "Agustus" }, { id: "09", nama: "September" },
    { id: "10", nama: "Oktober" }, { id: "11", nama: "November" }, { id: "12", nama: "Desember" }
  ];
  
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState("2026");

  const monthKey = `${selectedYear}-${selectedMonth}`; 
  const currentMonthName = listBulan.find(b => b.id === selectedMonth).nama;

  useEffect(() => {
    // 1. Ambil Data Master Users (Source of Truth untuk Nama Lengkap)
    onValue(ref(db, 'Users'), (snap) => setAllUsers(snap.val() || {}));
    
    // 2. Ambil Konten & Nilai
    onValue(ref(db, 'Konten'), (snap) => setAllKontenRaw(snap.val() || {}));
    onValue(ref(db, 'Nilai'), (snap) => {
        const raw = snap.exists() ? Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })) : [];
        setAllNilaiRaw(raw);
    });

    // 3. Ambil Daftar Kelas
    onValue(ref(db, 'Kelas'), (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, nama: snap.val()[k].nama_kelas }));
        setDaftarKelas(list);
      }
    });
  }, []);

  const handleProsesRekap = () => {
    setIsProcessing(true);
    
    onValue(ref(db, 'Siswa'), (snapSiswa) => {
      const allSiswaData = snapSiswa.val() || {};
      const filteredSiswa = Object.values(allSiswaData).filter(s => s.nama_kelas === selectedKelas.nama);

      // Filter Konten yang ada di periode terpilih
      const kontenKelasIni = Object.keys(allKontenRaw).filter(kId => {
          const k = allKontenRaw[kId];
          if (k.kelasId !== selectedKelas.id && k.nama_kelas !== selectedKelas.nama) return false;
          
          let tglKonten = "";
          if (typeof k.createdAt === 'number') tglKonten = new Date(k.createdAt).toISOString();
          else if (typeof k.createdAt === 'string') tglKonten = k.createdAt;
          
          return tglKonten.startsWith(monthKey);
      });

      const hasilFinal = filteredSiswa.map(s => {
        const nSiswa = allNilaiRaw.filter(n => n.studentId === s.userId);
        let adaBelumDinilai = false;
        let totalSkorKuis = 0, totalSkorUjian = 0;
        let jmlKuis = 0, jmlUjian = 0;

        const detailList = kontenKelasIni.map(kId => {
          const kInfo = allKontenRaw[kId];
          const pengerjaan = nSiswa.find(n => n.kontenId === kId);
          if (kInfo.tipeKonten === "Materi") return null;

          let statusTugas = "Belum Mengerjakan";
          let skorTugas = 0;

          if (pengerjaan) {
            if (pengerjaan.statusKoreksi === "Selesai") {
              statusTugas = "Selesai";
              skorTugas = parseFloat(pengerjaan.skor) || 0;
              if (kInfo.tipeKonten === "Tugas") { totalSkorKuis += skorTugas; jmlKuis++; }
              else { totalSkorUjian += skorTugas; jmlUjian++; }
            } else {
              adaBelumDinilai = true;
              statusTugas = "Belum Dinilai";
              skorTugas = "Belum Dinilai"; 
            }
          } else {
            if (kInfo.tipeKonten === "Tugas") jmlKuis++; else jmlUjian++;
          }
          return { judul: kInfo.judul, skor: skorTugas, tipe: kInfo.tipeKonten, status: statusTugas };
        }).filter(Boolean);

        const avgKuis = jmlKuis > 0 ? totalSkorKuis / jmlKuis : 0;
        const avgUjian = jmlUjian > 0 ? totalSkorUjian / jmlUjian : 0;
        const skorFinal = (avgKuis * 0.4) + (avgUjian * 0.6);

        return { 
          id: s.userId, 
          // Ambil nama dari Users biar "Aditya Pratama" (bukan aditsiswa)
          nama: allUsers[s.userId]?.nama || s.nama_siswa || "Siswa Tanpa Nama", 
          rataKuis: avgKuis.toFixed(1),
          rataUjian: avgUjian.toFixed(1),
          rataAkhir: adaBelumDinilai ? "-" : skorFinal.toFixed(1), 
          status: adaBelumDinilai ? "BELUM DINILAI" : (skorFinal >= 75 ? "LULUS" : "REMEDIAL"),
          detailSemua: detailList
        };
      });

      setDataNilaiSiswa(hasilFinal);
      setIsProcessing(false);
    }, { onlyOnce: true });
  };

  const handleSimpanLaporanFinal = async () => {
    if (dataNilaiSiswa.length === 0) return alert("Proses sinkronisasi dulu!");
    if (dataNilaiSiswa.some(s => s.status === "BELUM DINILAI")) return alert("Ada tugas belum dinilai!");

    try {
      const path = `Laporan/${selectedKelas.nama}/${monthKey}`;
      await set(ref(db, path), {
        metadata: {
          bulan: currentMonthName,
          generatedAt: new Date().toISOString(),
          status: "FINAL",
          locked: true,
          guruId: "vRTOUuWo3ZZHIPhMczW5yFpvFCA2" 
        },
        dataSiswa: dataNilaiSiswa.map(s => ({
          studentId: s.id,
          nama: s.nama,
          ringkasan: { rataKuis: s.rataKuis, rataUjian: s.rataUjian, nilaiAkhir: s.rataAkhir, status: s.status }
        }))
      });
      alert("✅ Laporan Berhasil Dikunci!");
    } catch (e) { alert("Error: " + e.message); }
  };

  const styles = {
    container: { padding: '24px', animation: 'fadeIn 0.3s ease' },
    card: { backgroundColor: colors.cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${colors.border}`, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    statusBadge: (status) => {
        let bg = '#94a3b820', co = '#94a3b8';
        if (status === "LULUS") { bg = '#10b98115'; co = '#10b981'; }
        else if (status === "REMEDIAL") { bg = '#ef444415'; co = '#ef4444'; }
        else if (status === "BELUM DINILAI") { bg = '#f59e0b15'; co = '#f59e0b'; }
        return { padding: '5px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', backgroundColor: bg, color: co, border: `1px solid ${co}` };
    },
    select: { padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? '#334155' : '#fff', color: colors.textPrimary, fontWeight: '700' }
  };

  if (!selectedKelas) {
    return (
      <GuruLayout title="Rekap Nilai Siswa">
        <div style={styles.container}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {daftarKelas.map((kls) => (
              <div key={kls.id} style={styles.card}>
                <h3 style={{ margin: '0 0 20px 0', color: colors.textPrimary }}>{kls.nama}</h3>
                <button onClick={() => setSelectedKelas(kls)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: colors.primary, color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Buka Panel Rekap</button>
              </div>
            ))}
          </div>
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout title={`Rekap ${selectedKelas.nama}`}>
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <button onClick={() => {setSelectedKelas(null); setDataNilaiSiswa([]);}} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '10px' }}><ArrowLeft size={18} /> Kembali</button>
            <h3 style={{ margin: 0, color: colors.textPrimary }}>Rekapitulasi {selectedKelas.nama}</h3>
            <p style={{ fontSize: '13px', color: colors.primary, fontWeight: '700', marginTop: '5px' }}>Periode: {currentMonthName} {selectedYear}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Calendar size={18} color={colors.textMuted} />
            <select style={styles.select} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {listBulan.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
            <button onClick={handleProsesRekap} disabled={isProcessing} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: colors.primary, color: '#fff', fontWeight: '800', display: 'flex', gap: '8px', opacity: isProcessing ? 0.7 : 1 }}>
              <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} /> Sinkronisasi
            </button>
            <button onClick={handleSimpanLaporanFinal} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '800', display: 'flex', gap: '8px' }}>
              <ShieldCheck size={18} /> Kunci FINAL
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '18px', textAlign: 'left', fontSize: '11px', color: colors.textMuted }}>NAMA SISWA</th>
                <th style={{ padding: '18px', textAlign: 'center', fontSize: '11px', color: colors.textMuted }}>TOTAL</th>
                <th style={{ padding: '18px', textAlign: 'center', fontSize: '11px', color: colors.textMuted }}>STATUS</th>
                <th style={{ padding: '18px', textAlign: 'center', fontSize: '11px', color: colors.textMuted }}>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {dataNilaiSiswa.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '18px', fontWeight: '700', color: colors.textPrimary }}>{s.nama}</td>
                  <td style={{ padding: '18px', textAlign: 'center', color: colors.primary, fontWeight: '900', fontSize: '18px' }}>{s.rataAkhir}</td>
                  <td style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={styles.statusBadge(s.status)}>{s.status}</span>
                  </td>
                  <td style={{ padding: '18px', textAlign: 'center' }}>
                    <button onClick={() => setSelectedStudent(s)} style={{ background: colors.primary + '20', color: colors.primary, border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dataNilaiSiswa.length === 0 && <div style={{ padding: '50px', textAlign: 'center', color: colors.textMuted }}>Klik Sinkronisasi untuk memproses data.</div>}
        </div>
      </div>

      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, width: '100%', maxWidth: '600px', borderRadius: '20px', padding: '25px', position: 'relative', border: `1px solid ${colors.border}` }}>
            <button onClick={() => setSelectedStudent(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: colors.textMuted }}><X size={24}/></button>
            <h3 style={{ marginBottom: '5px', color: colors.textPrimary }}>Rincian Nilai: {selectedStudent.nama}</h3>
            <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '20px' }}>Kalkulasi {currentMonthName} {selectedYear}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', border: `1px solid ${colors.border}` }}>
                    <h5 style={{ margin: '0 0 10px 0', color: colors.primary }}>LOG KUIS</h5>
                    {selectedStudent.detailSemua.filter(d => d.tipe === "Tugas").length > 0 ? (
                      selectedStudent.detailSemua.filter(d => d.tipe === "Tugas").map((n, i) => (
                        <div key={i} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px dashed ${colors.border}`, color: n.skor === "Belum Dinilai" ? '#f59e0b' : colors.textPrimary }}>
                          <span>{n.judul}</span> <b>{n.skor}</b>
                        </div>
                      ))
                    ) : (<span style={{ fontSize: '11px', color: colors.textMuted }}>Tidak ada kuis bulan ini</span>)}
                </div>
                <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb', border: `1px solid ${colors.border}` }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#8b5cf6' }}>LOG UJIAN</h5>
                    {selectedStudent.detailSemua.filter(d => d.tipe === "Ujian_Bulanan").length > 0 ? (
                      selectedStudent.detailSemua.filter(d => d.tipe === "Ujian_Bulanan").map((n, i) => (
                        <div key={i} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px dashed ${colors.border}`, color: n.skor === "Belum Dinilai" ? '#f59e0b' : colors.textPrimary }}>
                          <span>{n.judul}</span> <b>{n.skor}</b>
                        </div>
                      ))
                    ) : (<span style={{ fontSize: '11px', color: colors.textMuted }}>Tidak ada ujian bulan ini</span>)}
                </div>
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
};

export default RekapNilai;