import React, { useState, useEffect } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../api/firebase';
import { ref, onValue, set } from 'firebase/database';
import { 
  Users as UsersIcon, ArrowLeft, RefreshCw, Eye, Calendar, X, ShieldCheck, Lock, Unlock 
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
  const [allUjianRaw, setAllUjianRaw] = useState({});
  const [allUsers, setAllUsers] = useState({});
  const [statusKunciKelas, setStatusKunciKelas] = useState({});

  const listPeriode = [
    { id: "T1", nama: "Triwulan I (Juli - September)", range: [6, 8] },
    { id: "T2", nama: "Triwulan II (Oktober - Desember)", range: [9, 11] },
    { id: "T3", nama: "Triwulan III (Januari - Maret)", range: [0, 2] },
    { id: "T4", nama: "Triwulan IV (April - Juni)", range: [3, 5] }
  ];
  
  const [selectedPeriode, setSelectedPeriode] = useState("T4"); 
  const [selectedYear] = useState("2026");

  const getNamaBulan = (monthIndex) => {
    return ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][monthIndex];
  };

  useEffect(() => {
    onValue(ref(db, 'Users'), (snap) => setAllUsers(snap.val() || {}));
    onValue(ref(db, 'Konten'), (snap) => setAllKontenRaw(snap.val() || {}));
    onValue(ref(db, 'UjianPerbulan'), (snap) => setAllUjianRaw(snap.val() || {}));
    onValue(ref(db, 'Nilai'), (snap) => {
        const raw = snap.exists() ? Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })) : [];
        setAllNilaiRaw(raw);
    });
    onValue(ref(db, 'Kelas'), (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, nama: snap.val()[k].nama_kelas }));
        setDaftarKelas(list);
      }
    });

    const periodeKey = `${selectedYear}_${selectedPeriode}`;
    onValue(ref(db, 'Laporan'), (snap) => {
      const dataLaporan = snap.val() || {};
      const mappingKunci = {};
      
      Object.keys(dataLaporan).forEach(namaKelas => {
        if (dataLaporan[namaKelas][periodeKey]?.metadata?.locked) {
          mappingKunci[namaKelas] = true;
        }
      });
      setStatusKunciKelas(mappingKunci);

      if (selectedKelas && dataLaporan[selectedKelas.nama]?.[periodeKey]) {
        // Memuat data dari laporan terkunci[cite: 1]
        setDataNilaiSiswa(dataLaporan[selectedKelas.nama][periodeKey].dataSiswa || []);
      } else if (selectedKelas && !isProcessing) {
        setDataNilaiSiswa([]);
      }
    });
  }, [selectedPeriode, selectedYear, selectedKelas]);

  const handleProsesRekap = () => {
    if (statusKunciKelas[selectedKelas?.nama]) return;
    
    setIsProcessing(true);
    const currentRange = listPeriode.find(p => p.id === selectedPeriode).range;
    
    onValue(ref(db, 'Siswa'), (snapSiswa) => {
      const allSiswaData = snapSiswa.val() || {};
      const filteredSiswa = Object.values(allSiswaData).filter(s => s.nama_kelas === selectedKelas.nama);

      const kuisPeriodeIni = Object.keys(allKontenRaw).filter(kId => {
        const k = allKontenRaw[kId];
        if (k.kelasId !== selectedKelas.id) return false;
        const tglBuat = new Date(k.createdAt);
        return tglBuat.getFullYear().toString() === selectedYear && tglBuat.getMonth() >= currentRange[0] && tglBuat.getMonth() <= currentRange[1];
      });

      const ujianKelasIni = allUjianRaw[selectedKelas.id] || {};
      const ujianPeriodeIni = Object.keys(ujianKelasIni).filter(uId => {
        const u = ujianKelasIni[uId];
        const tglBuat = new Date(u.createdAt);
        return tglBuat.getFullYear().toString() === selectedYear && tglBuat.getMonth() >= currentRange[0] && tglBuat.getMonth() <= currentRange[1];
      });

      const hasilFinal = filteredSiswa.map(s => {
        let sumKuis = 0, sumUjian = 0;
        let countKuis = kuisPeriodeIni.length;
        let countUjian = ujianPeriodeIni.length;
        let adaBelumDinilai = false;

        const processDetail = (listIds, rawDataSource, tipeTugas) => {
          return listIds.map(id => {
            const info = rawDataSource[id];
            const n = allNilaiRaw.find(val => val.studentId === s.userId && val.kontenId === id);
            const skor = n && n.statusKoreksi === "Selesai" ? parseFloat(n.skor) : 0;
            if (n && n.statusKoreksi !== "Selesai") adaBelumDinilai = true;
            return {
              judul: info.judul,
              skor: skor,
              tglTugas: new Date(info.createdAt).toLocaleDateString('id-ID'),
              bulanIdx: new Date(info.createdAt).getMonth(),
              tipe: tipeTugas,
              status: n ? n.statusKoreksi : "Tidak Mengerjakan"
            };
          });
        };

        const detailKuis = processDetail(kuisPeriodeIni, allKontenRaw, 'Kuis');
        const detailUjian = processDetail(ujianPeriodeIni, ujianKelasIni, 'Ujian Perbulan');

        detailKuis.forEach(d => sumKuis += d.skor);
        detailUjian.forEach(d => sumUjian += d.skor);

        const rataKuis = countKuis > 0 ? sumKuis / countKuis : 0;
        const rataUjian = countUjian > 0 ? sumUjian / countUjian : 0;
        const skorAkhir = (rataKuis * 0.4) + (rataUjian * 0.6);

        const groupedData = {};
        [...detailKuis, ...detailUjian].forEach(item => {
          const bln = getNamaBulan(item.bulanIdx);
          if (!groupedData[bln]) groupedData[bln] = [];
          groupedData[bln].push(item);
        });

        // Pastikan status dikalkulasi di sini[cite: 1]
        const statusSiswa = adaBelumDinilai ? "BELUM DINILAI" : (skorAkhir >= 75 ? "LULUS" : "REMEDIAL");

        return {
          id: s.userId,
          nama: allUsers[s.userId]?.nama || s.nama_siswa || "Siswa",
          rataKuis: rataKuis.toFixed(1),
          rataUjian: rataUjian.toFixed(1),
          rataAkhir: parseFloat(skorAkhir.toFixed(1)),
          status: statusSiswa,
          groupedData
        };
      });

      setDataNilaiSiswa(hasilFinal);
      setIsProcessing(false);
    }, { onlyOnce: true });
  };

  const handleSimpanLaporanFinal = async () => {
    if (dataNilaiSiswa.length === 0) return alert("Sinkronisasi data dulu!");
    const path = `Laporan/${selectedKelas.nama}/${selectedYear}_${selectedPeriode}`;
    try {
      await set(ref(db, path), {
        metadata: { 
          periode: listPeriode.find(p => p.id === selectedPeriode).nama, 
          generatedAt: new Date().toISOString(), 
          locked: true 
        },
        dataSiswa: dataNilaiSiswa
      });
      alert("✅ Laporan Berhasil Dikunci!");
    } catch (e) { alert("Error: " + e.message); }
  };

  if (!selectedKelas) {
    return (
      <GuruLayout title="Rekap Nilai">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <h3 style={{ color: colors.textPrimary }}>Daftar Kelas</h3>
            <select 
              style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary, fontWeight: 'bold' }} 
              value={selectedPeriode} 
              onChange={(e) => { setSelectedPeriode(e.target.value); setDataNilaiSiswa([]); }}
            >
              {listPeriode.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {daftarKelas.map((kls) => (
              <div key={kls.id} style={{ padding: '24px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, borderTop: `4px solid ${statusKunciKelas[kls.nama] ? '#10b981' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: colors.textPrimary }}>{kls.nama}</h3>
                  {statusKunciKelas[kls.nama] ? <Lock size={16} color="#10b981"/> : <Unlock size={16} color="#f59e0b"/>}
                </div>
                <button onClick={() => setSelectedKelas(kls)} style={{ width: '100%', padding: '12px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Buka Rekap</button>
              </div>
            ))}
          </div>
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout title={`Rekap ${selectedKelas.nama}`}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <button onClick={() => {setSelectedKelas(null); setDataNilaiSiswa([]);}} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><ArrowLeft size={18}/> Kembali</button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {!statusKunciKelas[selectedKelas.nama] ? (
              <>
                <button onClick={handleProsesRekap} style={{ padding: '10px 20px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""}/> Sinkronisasi
                </button>
                {dataNilaiSiswa.length > 0 && (
                  <button onClick={handleSimpanLaporanFinal} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ShieldCheck size={18}/> Kunci FINAL
                  </button>
                )}
              </>
            ) : (
              <div style={{ padding: '10px 24px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #10b98150' }}>
                <ShieldCheck size={18}/> LAPORAN TERKUNCI FINAL
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: colors.primary + '10', borderRadius: '12px', border: `1px solid ${colors.primary}40` }}>
           <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 'bold' }}>Menampilkan Periode: <span style={{ color: colors.primary }}>{listPeriode.find(p => p.id === selectedPeriode).nama}</span></p>
        </div>
        
        <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <th style={{ padding: '18px', textAlign: 'left', color: colors.textMuted }}>NAMA SISWA</th>
                <th style={{ padding: '18px', color: colors.textMuted }}>KUIS (40%)</th>
                <th style={{ padding: '18px', color: colors.textMuted }}>UJIAN (60%)</th>
                <th style={{ padding: '18px', color: colors.textMuted }}>AKHIR</th>
                <th style={{ padding: '18px', color: colors.textMuted }}>STATUS</th>
                <th style={{ padding: '18px', color: colors.textMuted }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {dataNilaiSiswa.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '18px', color: colors.textPrimary, fontWeight: 'bold' }}>{s.nama}</td>
                  <td style={{ textAlign: 'center', color: colors.textPrimary }}>{s.rataKuis}</td>
                  <td style={{ textAlign: 'center', color: colors.textPrimary }}>{s.rataUjian}</td>
                  <td style={{ textAlign: 'center', fontWeight: '900', color: colors.primary, fontSize: '18px' }}>{s.rataAkhir}</td>
                  <td style={{ textAlign: 'center' }}>
                    {/* Render status jika ada data[cite: 1] */}
                    {s.status ? (
                      <span style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', backgroundColor: s.status === 'LULUS' ? '#10b98120' : (s.status === 'REMEDIAL' ? '#ef444420' : '#f59e0b20'), color: s.status === 'LULUS' ? '#10b981' : (s.status === 'REMEDIAL' ? '#ef4444' : '#f59e0b') }}>
                        {s.status}
                      </span>
                    ) : "-"}
                  </td>
                  <td style={{ textAlign: 'center' }}><button onClick={() => setSelectedStudent(s)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Eye size={18} color={colors.primary}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: colors.cardBg, width: '90%', maxWidth: '600px', padding: '30px', borderRadius: '24px', position: 'relative', border: `1px solid ${colors.border}` }}>
            <button onClick={() => setSelectedStudent(null)} style={{ position: 'absolute', right: '25px', top: '25px', cursor: 'pointer', background: 'none', border: 'none' }}><X size={24} color={colors.textPrimary}/></button>
            <h3 style={{ color: colors.textPrimary, marginBottom: '20px' }}>{selectedStudent.nama}</h3>
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {selectedStudent.groupedData && Object.keys(selectedStudent.groupedData).sort((a, b) => {
                const order = ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"];
                return order.indexOf(a) - order.indexOf(b);
              }).map(bulan => (
                <div key={bulan} style={{ marginBottom: '25px' }}>
                  <div style={{ backgroundColor: colors.primary + '15', padding: '8px 15px', borderRadius: '8px', color: colors.primary, fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>{bulan}</div>
                  {selectedStudent.groupedData[bulan].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
                      <div>
                        <div style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: '13px' }}>{item.judul}</div>
                        <div style={{ color: colors.textMuted, fontSize: '11px' }}>{item.tipe} • Penugasan: {item.tglTugas}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: item.tipe.includes('Ujian') ? '#8b5cf6' : colors.primary }}>{item.skor}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
};

export default RekapNilai;