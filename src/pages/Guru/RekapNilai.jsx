import React, { useState, useEffect } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { db, auth } from '../../api/firebase'; 
import { ref, onValue, set, query, orderByChild, equalTo } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, RefreshCw, Eye, ShieldCheck, Lock, Unlock, Download, ChevronLeft, ChevronRight, FileText, X, AlertTriangle
} from 'lucide-react';

const RekapNilai = () => {
  const { colors, isDarkMode } = useTheme();
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [selectedMapelDetail, setSelectedMapelDetail] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [adaBelumDinilaiGlobal, setAdaBelumDinilaiGlobal] = useState(false); 
  
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [dataNilaiSiswa, setDataNilaiSiswa] = useState([]);
  const [allNilaiRaw, setAllNilaiRaw] = useState([]);
  const [allKontenRaw, setAllKontenRaw] = useState({});
  const [allUjianRaw, setAllUjianRaw] = useState({});
  const [allUsers, setAllUsers] = useState({});
  const [allMapelRaw, setAllMapelRaw] = useState({});
  const [statusKunciKelas, setStatusKunciKelas] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid);
        fetchData(user.uid);
      }
    });
    return () => unsubscribeAuth();
  }, [selectedPeriode, selectedYear, selectedKelas]);

  const fetchData = (uid) => {
    onValue(ref(db, 'Users'), (snap) => setAllUsers(snap.val() || {}));
    onValue(ref(db, 'Konten'), (snap) => setAllKontenRaw(snap.val() || {}));
    onValue(ref(db, 'UjianPerbulan'), (snap) => setAllUjianRaw(snap.val() || {}));
    onValue(ref(db, 'Mapel'), (snap) => setAllMapelRaw(snap.val() || {}));
    onValue(ref(db, 'Nilai'), (snap) => {
        const raw = snap.exists() ? Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })) : [];
        setAllNilaiRaw(raw);
    });

    const kelasQuery = query(ref(db, 'Kelas'), orderByChild('teacherId'), equalTo(uid));
    onValue(kelasQuery, (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, nama: snap.val()[k].nama_kelas }));
        setDaftarKelas(list);
      } else {
        setDaftarKelas([]);
      }
    });

    const periodeKey = `${selectedYear}_${selectedPeriode}`;
    onValue(ref(db, 'Laporan'), (snap) => {
      const dataLaporan = snap.val() || {};
      const mappingKunci = {};
      Object.keys(dataLaporan).forEach(namaKelas => {
        if (dataLaporan[namaKelas][periodeKey]?.metadata?.locked) mappingKunci[namaKelas] = true;
      });
      setStatusKunciKelas(mappingKunci);

      if (selectedKelas && dataLaporan[selectedKelas.nama]?.[periodeKey]) {
        setDataNilaiSiswa(dataLaporan[selectedKelas.nama][periodeKey].dataSiswa || []);
        const adaBelum = (dataLaporan[selectedKelas.nama][periodeKey].dataSiswa || []).some(s => s.status === "BELUM DINILAI");
        setAdaBelumDinilaiGlobal(adaBelum);
      } else if (selectedKelas && !isProcessing) {
        setDataNilaiSiswa([]);
        setAdaBelumDinilaiGlobal(false);
      }
    });
  };

  const handleProsesRekap = () => {
    if (statusKunciKelas[selectedKelas?.nama]) return;
    setIsProcessing(true);
    const currentRange = listPeriode.find(p => p.id === selectedPeriode).range;
    
    const mapelKelasIni = Object.keys(allMapelRaw)
      .filter(mId => allMapelRaw[mId].classId === selectedKelas.id)
      .map(mId => ({ id: mId, nama: allMapelRaw[mId].nama }));

    onValue(ref(db, 'Siswa'), (snapSiswa) => {
      const allSiswaData = snapSiswa.val() || {};
      const filteredSiswa = Object.values(allSiswaData).filter(s => s.nama_kelas === selectedKelas.nama);

      const kuisPeriodeIni = Object.keys(allKontenRaw).filter(kId => {
        const k = allKontenRaw[kId];
        if (k.kelasId !== selectedKelas.id || k.tipeKonten === "Materi") return false;
        const tglBuat = new Date(k.createdAt);
        return tglBuat.getFullYear().toString() === selectedYear && 
               tglBuat.getMonth() >= currentRange[0] && 
               tglBuat.getMonth() <= currentRange[1];
      });

      const ujianKelasIni = allUjianRaw[selectedKelas.id] || {};
      const ujianPeriodeIni = Object.keys(ujianKelasIni).filter(uId => {
        const u = ujianKelasIni[uId];
        const tglBuat = new Date(u.createdAt);
        return tglBuat.getFullYear().toString() === selectedYear && 
               tglBuat.getMonth() >= currentRange[0] && 
               tglBuat.getMonth() <= currentRange[1];
      });

      let adaBelumDinilaiSatuKelas = false; 

      const hasilFinal = filteredSiswa.map(s => {
        let adaBelumDinilaiSiswa = false;
        const nilaiPerMapel = [];

        // 1. EVALUASI UJIAN PERBULAN GLOBAL KELAS
        let totalSkorUjian = 0;
        let countUjianIkut = 0;
        let ujianBelumDinilai = false;

        ujianPeriodeIni.forEach(uId => {
          const n = allNilaiRaw.find(val => val.studentId === s.userId && val.kontenId === uId);
          if (n) {
            if (n.statusKoreksi === "Selesai") {
              totalSkorUjian += parseFloat(n.skor);
              countUjianIkut++;
            } else {
              adaBelumDinilaiSiswa = true;
              adaBelumDinilaiSatuKelas = true;
              ujianBelumDinilai = true;
            }
          }
        });
        const rataUjianGlobal = countUjianIkut > 0 ? totalSkorUjian / countUjianIkut : 0;

        // 2. KELOLA NILAI INDIVIDUAL PER MATA PELAJARAN
        let akumulasiKuisSemuaMapel = 0;
        let mapelPunyaKuisCount = 0;

        mapelKelasIni.forEach(mapel => {
          let sumKuisMapel = 0;
          let mapelBelumDinilai = false; 
          const kuisMapelIni = kuisPeriodeIni.filter(kId => allKontenRaw[kId].mapelId === mapel.id);
          
          kuisMapelIni.forEach(kId => {
            const n = allNilaiRaw.find(val => val.studentId === s.userId && val.kontenId === kId);
            if (n) {
              if (n.statusKoreksi === "Selesai") {
                sumKuisMapel += parseFloat(n.skor);
              } else {
                adaBelumDinilaiSiswa = true;
                adaBelumDinilaiSatuKelas = true;
                mapelBelumDinilai = true;
              }
            }
          });

          const rataKuisMapel = kuisMapelIni.length > 0 ? sumKuisMapel / kuisMapelIni.length : 0;
          
          // CRITICAL FIX: Abaikan dari pembagi jika mapel tersebut belum diterbitkan kuis/tugas
          if (kuisMapelIni.length > 0) {
            akumulasiKuisSemuaMapel += rataKuisMapel;
            mapelPunyaKuisCount++;
          }

          // Atur Status Kategorisasi Mapel secara Fleksibel
          let statusMapel = "KOSONG";
          if (mapelBelumDinilai) {
            statusMapel = "BELUM DINILAI";
          } else if (kuisMapelIni.length > 0) {
            statusMapel = rataKuisMapel >= 75 ? "LULUS" : "REMEDIAL";
          }

          nilaiPerMapel.push({
            mapelId: mapel.id,
            namaMapel: mapel.nama,
            rataKuis: kuisMapelIni.length > 0 ? rataKuisMapel.toFixed(1) : "-",
            nilaiAkhir: kuisMapelIni.length > 0 ? parseFloat(rataKuisMapel.toFixed(1)) : "-", 
            status: statusMapel,
            hasKuis: kuisMapelIni.length > 0
          });
        });

        // 3. MATRIKS FORMULA BOBOT (40% Kuis Aktif : 60% Ujian Global)
        const rataKuisGlobalSiswa = mapelPunyaKuisCount > 0 ? akumulasiKuisSemuaMapel / mapelPunyaKuisCount : 0;
        
        let skorAkhirSiswa = 0;
        if (mapelPunyaKuisCount > 0 || countUjianIkut > 0) {
          skorAkhirSiswa = (rataKuisGlobalSiswa * 0.4) + (rataUjianGlobal * 0.6);
        }

        // Penampung log riwayat aktivitas belajar bulanan
        const groupedData = {};
        const processDetail = (listIds, rawDataSource, tipeTugas) => {
          listIds.forEach(id => {
            const info = rawDataSource[id];
            const n = allNilaiRaw.find(val => val.studentId === s.userId && val.kontenId === id);
            const skor = n && n.statusKoreksi === "Selesai" ? parseFloat(n.skor) : 0;
            const bln = getNamaBulan(new Date(info.createdAt).getMonth());
            
            if (!groupedData[bln]) groupedData[bln] = [];
            groupedData[bln].push({
              judul: info.judul,
              skor: skor,
              tglTugas: new Date(info.createdAt).toLocaleDateString('id-ID'),
              tipe: tipeTugas,
              mapelId: info.mapelId || "UjianAkumulatif",
              mapelNama: allMapelRaw[info.mapelId]?.nama || "Ujian Akumulatif Kelas",
              status: n ? n.statusKoreksi : "Tidak Mengerjakan"
            });
          });
        };

        processDetail(kuisPeriodeIni, allKontenRaw, 'Kuis/Tugas');
        processDetail(ujianPeriodeIni, ujianKelasIni, 'Ujian Perbulan');

        let statusSiswa = adaBelumDinilaiSiswa ? "BELUM DINILAI" : (skorAkhirSiswa >= 75 ? "LULUS" : "REMEDIAL");

        return {
          id: s.userId,
          nama: allUsers[s.userId]?.nama || s.nama_siswa || "Siswa",
          rataAkhir: parseFloat(skorAkhirSiswa.toFixed(1)), 
          status: statusSiswa,
          nilaiPerMapel,
          rataUjianGlobal: rataUjianGlobal.toFixed(1), 
          statusUjianCard: ujianBelumDinilai ? "BELUM DINILAI" : (countUjianIkut > 0 ? (rataUjianGlobal >= 75 ? "LULUS" : "REMEDIAL") : "KOSONG"),
          groupedData
        };
      });

      setAdaBelumDinilaiGlobal(adaBelumDinilaiSatuKelas); 
      setDataNilaiSiswa(hasilFinal);
      setIsProcessing(false);
      setCurrentPage(1);
    }, { onlyOnce: true });
  };

  const handleSimpanLaporanFinal = async () => {
    if (dataNilaiSiswa.length === 0) return alert("Sinkronisasi data dulu!");
    if (adaBelumDinilaiGlobal) return alert("❌ Gagal Mengunci! Selesaikan penilaian yang berstatus BELUM DINILAI.");
    const path = `Laporan/${selectedKelas.nama}/${selectedYear}_${selectedPeriode}`;
    try {
      await set(ref(db, path), {
        metadata: { 
          periode: listPeriode.find(p => p.id === selectedPeriode).nama, 
          generatedAt: new Date().toISOString(), 
          locked: true,
          teacherId: userUid 
        },
        dataSiswa: dataNilaiSiswa
      });
      alert("✅ Laporan Berhasil Dikunci!");
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleDownloadRekapPDF = () => {
    if (dataNilaiSiswa.length === 0) return alert("Tidak ada data untuk diunduh!");
    if (adaBelumDinilaiGlobal) return alert("❌ Unduhan Ditolak! Masih ada tugas dengan status BELUM DINILAI.");
    const doc = new jsPDF();
    const periodeNama = listPeriode.find(p => p.id === selectedPeriode).nama;
    
    doc.setFontSize(15);
    doc.text("LAPORAN REKAPITULASI NILAI AKHIR PER MAPEL", 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`IBNA Study - Kelas: ${selectedKelas.nama} | Periode: ${periodeNama}`, 105, 22, { align: 'center' });
    doc.line(15, 26, 195, 26);

    const mapelHeaders = dataNilaiSiswa[0]?.nilaiPerMapel.map(m => m.namaMapel) || [];
    const tableColumn = ["NO", "NAMA SISWA", ...mapelHeaders, "RATA UJIAN", "TOTAL AKHIR", "STATUS"];

    const tableRows = dataNilaiSiswa.map((s, i) => {
      const nilaiMapels = s.nilaiPerMapel.map(m => m.nilaiAkhir);
      return [i + 1, s.nama.toUpperCase(), ...nilaiMapels, s.rataUjianGlobal, s.rataAkhir, s.status];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [26, 54, 93], halign: 'center', fontSize: 9 },
      styles: { fontSize: 9 }
    });
    doc.save(`Rekap_Nilai_Lengkap_${selectedKelas.nama}.pdf`);
  };

  const handleDownloadDetailPDFAll = () => {
    if (dataNilaiSiswa.length === 0) return alert("Tidak ada data untuk diunduh!");
    if (adaBelumDinilaiGlobal) return alert("❌ Cetak Raport Ditolak! Selesaikan penilaian yang berstatus BELUM DINILAI.");
    const doc = new jsPDF();
    const periodeNama = listPeriode.find(p => p.id === selectedPeriode).nama;
    
    dataNilaiSiswa.forEach((student, index) => {
      if (index > 0) doc.addPage();
      doc.setFontSize(15);
      doc.text("RAPORT CAPAIAN HASIL BELAJAR SISWA", 105, 15, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`Nama : ${student.nama.toUpperCase()}`, 15, 25);
      doc.text(`Kelas : ${selectedKelas.nama} | Periode: ${periodeNama}`, 15, 31);
      doc.line(15, 35, 195, 35);

      doc.text("A. CAPAIAN NILAI MATA PELAJARAN & UJIAN", 15, 43);
      const rowsMapel = student.nilaiPerMapel.map((m, idx) => [idx + 1, m.namaMapel, "Kuis Harian", m.rataKuis, m.status]);
      rowsMapel.push([student.nilaiPerMapel.length + 1, "UJIAN PERBULAN AKUMULATIF", "Evaluasi Kelas", student.rataUjianGlobal, student.statusUjianCard]);

      autoTable(doc, {
        head: [["NO", "KOMPONEN EVALUASI", "KATEGORI", "NILAI RATA-RATA", "STATUS"]],
        body: rowsMapel,
        startY: 47,
        theme: 'grid',
        headStyles: { fillColor: [26, 54, 93] }
      });

      let currentY = doc.lastAutoTable.finalY + 10;
      doc.text("B. LOG RIWAYAT AKTIVITAS PEMBELAJARAN", 15, currentY);
      currentY += 4;

      Object.keys(student.groupedData || {}).forEach((bulan) => {
        const itemsBulan = student.groupedData[bulan];
        if (itemsBulan.length === 0) return;

        doc.setFont(undefined, 'bold');
        doc.text(`Bulan: ${bulan}`, 15, currentY);
        currentY += 3;
        
        autoTable(doc, {
          head: [["NO", "JUDUL EVALUASI/UJIAN", "KETERANGAN", "TIPE", "SKOR"]],
          body: itemsBulan.map((item, idx) => [idx + 1, item.judul, item.mapelNama, item.tipe, item.status === "Selesai" ? item.skor : (item.status === "Tidak Mengerjakan" ? "0" : "?")]),
          startY: currentY,
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] }
        });
        currentY = doc.lastAutoTable.finalY + 8;
      });

      doc.setFont(undefined, 'bold');
      doc.text(`((Total Nilai Kuis 40%)+(Total Nilai Ujian Bulanan 60%) : 2) \nTOTAL FORMULA RATA-RATA AKADEMIK : ${student.rataAkhir} (${student.status})`, 15, currentY + 4);
    });
    doc.save(`Raport_Detail_Lengkap_${selectedKelas.nama}.pdf`);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataNilaiSiswa.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataNilaiSiswa.length / itemsPerPage);

  if (!selectedKelas) {
    return (
      <GuruLayout title="Rekap Nilai">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <h3 style={{ color: colors.textPrimary, fontWeight: '900' }}>Kelas Anda</h3>
            <select 
              style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary, fontWeight: '800' }} 
              value={selectedPeriode} 
              onChange={(e) => setSelectedPeriode(e.target.value)}
            >
              {listPeriode.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {daftarKelas.map((kls) => (
              <div key={kls.id} style={{ padding: '24px', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, borderTop: `4px solid ${statusKunciKelas[kls.nama] ? '#10b981' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: colors.textPrimary, fontWeight: '900' }}>{kls.nama}</h3>
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
          <button onClick={() => {setSelectedKelas(null); setDataNilaiSiswa([]); setExpandedStudentId(null); setAdaBelumDinilaiGlobal(false);}} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><ArrowLeft size={18}/> Kembali</button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {!statusKunciKelas[selectedKelas.nama] ? (
              <>
                <button onClick={handleProsesRekap} style={{ padding: '10px 20px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""}/> Sinkronisasi
                </button>
                {dataNilaiSiswa.length > 0 && (
                  <button 
                    onClick={handleSimpanLaporanFinal} 
                    disabled={adaBelumDinilaiGlobal}
                    style={{ padding: '10px 20px', backgroundColor: adaBelumDinilaiGlobal ? '#cbd5e1' : '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: adaBelumDinilaiGlobal ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    <ShieldCheck size={18}/> Kunci FINAL
                  </button>
                )}
              </>
            ) : (
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ padding: '10px 24px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '10px', fontWeight: 'bold', border: '1px solid #10b98150', display:'flex', alignItems:'center', gap:'8px' }}>
                  <ShieldCheck size={18}/> LAPORAN TERKUNCI FINAL
                </div>
                <button 
                  onClick={handleDownloadRekapPDF} 
                  disabled={adaBelumDinilaiGlobal}
                  style={{ padding: '10px 20px', backgroundColor: adaBelumDinilaiGlobal ? '#cbd5e1' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: adaBelumDinilaiGlobal ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <Download size={18}/> Rekap PDF
                </button>
                <button 
                  onClick={handleDownloadDetailPDFAll} 
                  disabled={adaBelumDinilaiGlobal}
                  style={{ padding: '10px 20px', backgroundColor: adaBelumDinilaiGlobal ? '#cbd5e1' : '#8b5cf6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: adaBelumDinilaiGlobal ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <FileText size={18}/> Detail PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {adaBelumDinilaiGlobal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', color: '#b45309', fontWeight: 'bold', marginBottom: '20px', fontSize: '14px' }}>
            <AlertTriangle size={20} color="#d97706"/>
            <span>Peringatan: Terdapat komponen evaluasi siswa yang BELUM DINILAI. Fitur Penguncian Laporan dan Cetak PDF dinonaktifkan sementara demi menjaga validitas data raport.</span>
          </div>
        )}

        <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '18px', textAlign: 'left', color: colors.textMuted, fontSize: '12px', fontWeight: '900' }}>NAMA SISWA</th>
                <th style={{ padding: '18px', color: colors.textMuted, fontSize: '12px', fontWeight: '900', textAlign: 'center' }}>RATA AKADEMIK</th>
                <th style={{ padding: '18px', color: colors.textMuted, fontSize: '12px', fontWeight: '900', textAlign: 'center' }}>STATUS AKHIR</th>
                <th style={{ padding: '18px', color: colors.textMuted, fontSize: '12px', fontWeight: '900', textAlign: 'center' }}>RINCIAN MAPEL</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((s) => {
                const isExpanded = expandedStudentId === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.border}`, backgroundColor: isExpanded ? (isDarkMode ? 'rgba(255,255,255,0.01)' : '#f8fafc') : 'transparent', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '18px', color: colors.textPrimary, fontWeight: 'bold' }}>{s.nama}</td>
                      <td style={{ textAlign: 'center', fontWeight: '900', color: colors.primary }}>{s.rataAkhir}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', backgroundColor: s.status === 'LULUS' ? '#10b98120' : (s.status === 'REMEDIAL' ? '#ef444420' : '#f59e0b20'), color: s.status === 'LULUS' ? '#10b981' : (s.status === 'REMEDIAL' ? '#ef4444' : '#f59e0b') }}>{s.status}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => setExpandedStudentId(isExpanded ? null : s.id)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: isExpanded ? colors.primary + '15' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <Eye size={18} color={isExpanded ? '#10b981' : colors.primary}/>
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : '#f8fafc' }}>
                        <td colSpan="4" style={{ padding: '0px 24px 24px 24px' }}>
                          <div style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                              
                              {/* DYNAMIC CARD RENDERING FOR INDIVIDUAL MAPEL */}
                              {s.nilaiPerMapel.map((m, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => {
                                    if(!m.hasKuis) return;
                                    setSelectedMapelDetail({
                                      namaSiswa: s.nama,
                                      namaMapel: `Kuis Harian: ${m.namaMapel}`,
                                      mapelId: m.mapelId,
                                      isUjian: false,
                                      groupedData: s.groupedData
                                    });
                                  }}
                                  style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: m.hasKuis ? 'pointer' : 'default', transition: 'transform 0.15s, border-color 0.15s' }}
                                  onMouseEnter={(e) => { if(m.hasKuis) { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                  onMouseLeave={(e) => { if(m.hasKuis) { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                >
                                  <div>
                                    <div style={{ color: colors.textPrimary, fontWeight: '800', fontSize: '14px' }}>{m.namaMapel}</div>
                                    <div style={{ color: colors.textMuted, fontSize: '11px', marginTop: '2px' }}>
                                      {m.status === "BELUM DINILAI" ? "Ada kuis belum diperiksa" : (!m.hasKuis ? "Belum diterbitkan kuis" : `Rata-rata Kuis: ${m.rataKuis}`)}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: m.status === "BELUM DINILAI" ? "#f59e0b" : (m.status === "KOSONG" ? "#64748b" : colors.primary) }}>
                                      {m.status === "BELUM DINILAI" ? "?" : m.rataKuis}
                                    </div>
                                    <span style={{ 
                                      fontSize: '10px', 
                                      fontWeight: 'bold', 
                                      color: m.status === 'LULUS' ? '#10b981' : (m.status === 'BELUM DINILAI' ? '#f59e0b' : (m.status === 'KOSONG' ? '#64748b' : '#ef4444')) 
                                    }}>
                                      {m.status}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {/* MANDATORY EXAM CARD EVALUATION */}
                              <div 
                                onClick={() => {
                                  if(s.statusUjianCard === "KOSONG") return;
                                  setSelectedMapelDetail({
                                    namaSiswa: s.nama,
                                    namaMapel: "Ujian Perbulan (Akumulatif Kelas)",
                                    mapelId: "UjianAkumulatif",
                                    isUjian: true,
                                    groupedData: s.groupedData
                                  });
                                }}
                                style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: s.statusUjianCard !== "KOSONG" ? 'pointer' : 'default', transition: 'transform 0.15s, border-color 0.15s', borderLeft: `4px solid ${colors.primary}` }}
                                onMouseEnter={(e) => { if(s.statusUjianCard !== "KOSONG") { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                onMouseLeave={(e) => { if(s.statusUjianCard !== "KOSONG") { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; } }}
                              >
                                <div>
                                  <div style={{ color: colors.primary, fontWeight: '900', fontSize: '14px' }}>UJIAN PERBULAN</div>
                                  <div style={{ color: colors.textMuted, fontSize: '11px', marginTop: '2px' }}>
                                    {s.statusUjianCard === "BELUM DINILAI" ? "Ada lembar ujian belum dinilai" : (s.statusUjianCard === "KOSONG" ? "Belum diselenggarakan" : "Evaluasi Akumulatif Kelas")}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '16px', fontWeight: '900', color: s.statusUjianCard === "BELUM DINILAI" ? "#f59e0b" : (s.statusUjianCard === "KOSONG" ? "#64748b" : colors.primary) }}>
                                    {s.statusUjianCard === "BELUM DINILAI" ? "?" : (s.statusUjianCard === "KOSONG" ? "-" : s.rataUjianGlobal)}
                                  </div>
                                  <span style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 'bold', 
                                    color: s.statusUjianCard === 'LULUS' ? '#10b981' : (s.statusUjianCard === 'BELUM DINILAI' ? '#f59e0b' : (s.statusUjianCard === 'KOSONG' ? '#64748b' : '#ef4444')) 
                                  }}>
                                    {s.statusUjianCard}
                                  </span>
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TASKS SUB-MODAL POPUP */}
      {selectedMapelDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: colors.cardBg, width: '90%', maxWidth: '600px', padding: '30px', borderRadius: '24px', position: 'relative', border: `1px solid ${colors.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setSelectedMapelDetail(null)} style={{ position: 'absolute', right: '25px', top: '25px', cursor: 'pointer', background: 'none', border: 'none' }}><X size={24} color={colors.textPrimary}/></button>
            
            <h3 style={{ color: colors.textPrimary, fontWeight: '900', margin: 0 }}>{selectedMapelDetail.namaMapel}</h3>
            <p style={{ color: colors.textMuted, fontSize: '13px', marginTop: '4px', marginBottom: '20px' }}>Siswa: {selectedMapelDetail.namaSiswa}</p>
            
            <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '5px' }}>
              {Object.keys(selectedMapelDetail.groupedData || {}).map(bulan => {
                const itemsBulanIni = selectedMapelDetail.groupedData[bulan].filter(item => {
                  if (selectedMapelDetail.isUjian) {
                    return item.mapelId === "UjianAkumulatif";
                  } else {
                    return item.mapelId === selectedMapelDetail.mapelId;
                  }
                });

                if (itemsBulanIni.length === 0) return null;

                return (
                  <div key={bulan} style={{ marginBottom: '20px' }}>
                    <div style={{ backgroundColor: colors.primary + '15', padding: '6px 14px', borderRadius: '8px', color: colors.primary, fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>{bulan.toUpperCase()}</div>
                    {itemsBulanIni.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px', borderBottom: `1px solid ${colors.border}` }}>
                        <div>
                          <div style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: '13px' }}>{item.judul}</div>
                          <div style={{ color: colors.textMuted, fontSize: '11px', marginTop: '2px' }}>{item.tipe} | Status: <span style={{ fontWeight: '600', color: item.status === "Selesai" ? '#10b981' : (item.status === "Tidak Mengerjakan" ? '#ef4444' : '#f59e0b') }}>{item.status}</span></div>
                        </div>
                        <div style={{ fontWeight: '900', fontSize: '15px', color: item.status === "Selesai" ? colors.primary : (item.status === "Tidak Mengerjakan" ? '#ef4444' : '#f59e0b'), alignSelf: 'center' }}>
                          {item.status === "Selesai" ? item.skor : (item.status === "Tidak Mengerjakan" ? "0" : "?")}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  );
};

export default RekapNilai;