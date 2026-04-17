import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { Save, Loader2, Calendar, Edit3, FileSpreadsheet, User, Info, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const TabAbsensi = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [murid, setMurid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [absensi, setAbsensi] = useState({}); 
  const [rekapBulanan, setRekapBulanan] = useState({}); // Data AIS per siswa
  const [detailModal, setDetailModal] = useState(null); // Untuk menampilkan detail tanggal AIS
  const [namaKelasAsli, setNamaKelasAsli] = useState("");
  const [tanggalPilih, setTanggalPilih] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Ambil Info Kelas
        const kelasSnapshot = await get(ref(db, `Kelas/${kelasId}`));
        const infoKelas = kelasSnapshot.val();
        
        if (infoKelas) {
          const targetNamaKelas = infoKelas.nama_kelas;
          setNamaKelasAsli(targetNamaKelas);

          // 2. Ambil Master Users & Siswa
          onValue(ref(db, 'Users'), (usersSnapshot) => {
            const allUsers = usersSnapshot.val() || {};

            onValue(ref(db, 'Siswa'), (siswaSnapshot) => {
              const allSiswa = siswaSnapshot.val();
              if (allSiswa) {
                const listMurid = Object.keys(allSiswa)
                  .filter(key => allSiswa[key].nama_kelas === targetNamaKelas)
                  .map(key => {
                    const s = allSiswa[key];
                    const u = allUsers[s.userId] || {};
                    return {
                      id: key,
                      userId: s.userId,
                      namaTampil: u.nama || s.nama_siswa || "Murid",
                      ...s
                    };
                  });
                setMurid(listMurid);

                // 3. Ambil Semua Data Kehadiran untuk Rekap Bulanan
                onValue(ref(db, 'Kehadiran'), (kehadiranSnapshot) => {
                  const dataKehadiran = kehadiranSnapshot.val() || {};
                  const statusMapHarian = {};
                  const rekapMap = {};

                  // Inisialisasi Rekap
                  listMurid.forEach(m => {
                    statusMapHarian[m.id] = "Alpa";
                    rekapMap[m.id] = { Alpa: [], Izin: [], Sakit: [], Hadir: 0 };
                  });

                  // Pilih bulan dan tahun dari tanggalPilih
                  const [tahunSkrg, bulanSkrg] = tanggalPilih.split('-');

                  Object.values(dataKehadiran).forEach(record => {
                    const tglRecord = record.createdAt ? record.createdAt.substring(0, 10) : "";
                    const [tahunRec, bulanRec] = tglRecord.split('-');

                    // Logika Status Harian (Hanya untuk tanggal yang dipilih)
                    if (tglRecord === tanggalPilih && statusMapHarian.hasOwnProperty(record.studentId)) {
                      statusMapHarian[record.studentId] = record.status;
                    }

                    // Logika Rekap Bulanan (Akumulasi AIS dalam bulan yang sama)
                    if (tahunRec === tahunSkrg && bulanRec === bulanSkrg && rekapMap[record.studentId]) {
                      const st = record.status;
                      if (["Alpa", "Izin", "Sakit"].includes(st)) {
                        rekapMap[record.studentId][st].push(tglRecord);
                      } else if (st === "Hadir") {
                        rekapMap[record.studentId].Hadir += 1;
                      }
                    }
                  });

                  setAbsensi(statusMapHarian);
                  setRekapBulanan(rekapMap);
                  setLoading(false);
                });
              }
            });
          });
        }
      } catch (err) { 
        console.error(err); 
        setLoading(false); 
      }
    };
    fetchData();
  }, [kelasId, tanggalPilih]);

  const handleSimpanAbsensi = async () => {
    setIsSaving(true);
    try {
      const timestampFull = new Date().toISOString();
      const promises = murid.map((m) => {
        const customId = `${tanggalPilih}_${m.id}`;
        return set(ref(db, `Kehadiran/${customId}`), {
          studentId: m.id,
          nama_siswa: m.namaTampil,
          status: absensi[m.id],
          nama_kelas: namaKelasAsli,
          createdAt: timestampFull,
          scheduleId: "manual_entry"
        });
      });
      await Promise.all(promises);
      setIsEditing(false);
      alert("✅ Absensi Berhasil Disimpan!");
    } catch (error) { 
      alert(error.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleDownloadExcel = () => {
    const dataExport = murid.map(m => ({
      "NAMA SISWA": m.namaTampil,
      "TANGGAL": tanggalPilih,
      "STATUS HARI INI": absensi[m.id],
      "TOTAL HADIR (BULAN INI)": rekapBulanan[m.id]?.Hadir,
      "TOTAL ALPA": rekapBulanan[m.id]?.Alpa.length,
      "TOTAL IZIN": rekapBulanan[m.id]?.Izin.length,
      "TOTAL SAKIT": rekapBulanan[m.id]?.Sakit.length,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_Absensi");
    XLSX.writeFile(workbook, `Rekap_Absensi_${namaKelasAsli}_${tanggalPilih.substring(0,7)}.xlsx`);
  };

  // Komponen Badge AIS
  const AisBadge = ({ label, count, color, details, studentName }) => (
    <div 
      onClick={() => count > 0 && setDetailModal({ label, details, studentName })}
      style={{ 
        cursor: count > 0 ? 'pointer' : 'default',
        backgroundColor: color + '15',
        color: color,
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        border: `1px solid ${color}30`
      }}
    >
      {label[0]}: {count}
      {count > 0 && <Info size={12} />}
    </div>
  );

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}><Loader2 className="animate-spin" color={colors.primary} /></div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: colors.cardBg, padding: '8px 15px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <Calendar size={18} color={colors.primary} />
            <input type="date" value={tanggalPilih} onChange={(e) => setTanggalPilih(e.target.value)} style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', color: colors.textPrimary, fontWeight: '700' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '12px', color: colors.textMuted, fontWeight: '600' }}>
                REKAP BULAN: {new Date(tanggalPilih).toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadExcel} style={{ backgroundColor: '#10B981', color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} /> EXPORT REKAP
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} /> INPUT ABSENSI
            </button>
          ) : (
            <div style={{display:'flex', gap: '10px'}}>
              <button onClick={() => setIsEditing(false)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>BATAL</button>
              <button onClick={handleSimpanAbsensi} style={{ backgroundColor: '#10B981', color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} SIMPAN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '15px 20px', color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>NAMA SISWA</th>
              <th style={{ padding: '15px 20px', color: colors.textMuted, fontSize: '12px', fontWeight: '800', textAlign: 'center' }}>STATUS HARI INI</th>
              <th style={{ padding: '15px 20px', color: colors.textMuted, fontSize: '12px', fontWeight: '800', textAlign: 'center' }}>REKAP AIS BULAN INI</th>
            </tr>
          </thead>
          <tbody>
            {murid.map((m) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '10px', backgroundColor: colors.primary + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} color={colors.primary} />
                    </div>
                    <span style={{ color: colors.textPrimary, fontWeight: '700', fontSize: '14px' }}>{m.namaTampil}</span>
                  </div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {["Hadir", "Izin", "Sakit", "Alpa"].map((st) => {
                      const isActive = absensi[m.id] === st;
                      const colorsMap = { Hadir: '#10B981', Izin: '#F59E0B', Sakit: '#6366F1', Alpa: '#EF4444' };
                      return (
                        <button 
                          key={st} 
                          disabled={!isEditing} 
                          onClick={() => setAbsensi(p => ({...p, [m.id]: st}))}
                          style={{ 
                            padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: '900', cursor: isEditing ? 'pointer' : 'default',
                            backgroundColor: isActive ? colorsMap[st] : isDarkMode ? '#1e293b' : '#f1f5f9',
                            color: isActive ? "#fff" : colors.textMuted,
                            opacity: !isEditing && !isActive ? 0.5 : 1
                          }}
                        >
                          {st.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <AisBadge label="Alpa" count={rekapBulanan[m.id]?.Alpa.length || 0} color="#EF4444" details={rekapBulanan[m.id]?.Alpa} studentName={m.namaTampil} />
                    <AisBadge label="Izin" count={rekapBulanan[m.id]?.Izin.length || 0} color="#F59E0B" details={rekapBulanan[m.id]?.Izin} studentName={m.namaTampil} />
                    <AisBadge label="Sakit" count={rekapBulanan[m.id]?.Sakit.length || 0} color="#6366F1" details={rekapBulanan[m.id]?.Sakit} studentName={m.namaTampil} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detail AIS (Inovasi) */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '25px', borderRadius: '20px', width: '350px', border: `1px solid ${colors.border}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: colors.textPrimary, margin: 0, fontSize: '16px' }}>Detail {detailModal.label}</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '15px' }}>Siswa: <b>{detailModal.studentName}</b></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {detailModal.details.map((tgl, i) => (
                <div key={i} style={{ padding: '10px', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '10px', fontSize: '13px', color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={14} /> {new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabAbsensi;