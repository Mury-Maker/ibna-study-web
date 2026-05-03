import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { Save, Loader2, Calendar, Edit3, FileSpreadsheet, User, Info, X, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

const TabAbsensi = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [murid, setMurid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [absensi, setAbsensi] = useState({}); 
  const [rekapSemester, setRekapSemester] = useState({});
  const [namaKelasAsli, setNamaKelasAsli] = useState("");
  const [tanggalPilih, setTanggalPilih] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedSemester, setSelectedSemester] = useState(new Date().getMonth() >= 6 ? "Ganjil" : "Genap");
  const [selectedYear] = useState("2026");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const kelasSnapshot = await get(ref(db, `Kelas/${kelasId}`));
        const infoKelas = kelasSnapshot.val();
        
        if (infoKelas) {
          const targetNamaKelas = infoKelas.nama_kelas;
          setNamaKelasAsli(targetNamaKelas);

          onValue(ref(db, 'Users'), (usersSnapshot) => {
            const allUsers = usersSnapshot.val() || {};

            onValue(ref(db, 'Siswa'), (siswaSnapshot) => {
              const allSiswa = siswaSnapshot.val() || {};
              const listMurid = Object.keys(allSiswa)
                .filter(key => allSiswa[key].nama_kelas === targetNamaKelas)
                .map(key => ({
                  id: key,
                  userId: allSiswa[key].userId,
                  namaTampil: allUsers[allSiswa[key].userId]?.nama || allSiswa[key].nama_siswa || "Murid",
                }));
              setMurid(listMurid);

              onValue(ref(db, 'Kehadiran'), (kehadiranSnapshot) => {
                const dataKehadiran = kehadiranSnapshot.val() || {};
                const statusMapHarian = {};
                const rekapMap = {};

                listMurid.forEach(m => {
                  statusMapHarian[m.id] = "Alpa"; 
                  rekapMap[m.id] = { Alpa: 0, Izin: 0, Sakit: 0, Hadir: 0 };
                });

                Object.values(dataKehadiran).forEach(record => {
                  if (record.nama_kelas !== targetNamaKelas) return;

                  const tglRecord = record.createdAt ? record.createdAt.substring(0, 10) : "";
                  const dateObj = new Date(tglRecord);
                  const blnRec = dateObj.getMonth();
                  const thnRec = dateObj.getFullYear().toString();

                  const isGanjil = blnRec >= 6 && blnRec <= 11;
                  const isGenap = blnRec >= 0 && blnRec <= 5;
                  const matchSemester = (selectedSemester === "Ganjil" && isGanjil) || (selectedSemester === "Genap" && isGenap);

                  if (tglRecord === tanggalPilih && statusMapHarian.hasOwnProperty(record.studentId)) {
                    statusMapHarian[record.studentId] = record.status;
                  }

                  if (thnRec === selectedYear && matchSemester && rekapMap[record.studentId]) {
                    rekapMap[record.studentId][record.status] += 1;
                  }
                });

                setAbsensi(statusMapHarian);
                setRekapSemester(rekapMap);
                setLoading(false);
              });
            });
          });
        }
      } catch (err) { console.error(err); setLoading(false); }
    };
    fetchData();
  }, [kelasId, tanggalPilih, selectedSemester, selectedYear]);

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
      alert("✅ Absensi hari ini berhasil dicatat!");
    } catch (error) { alert(error.message); } finally { setIsSaving(false); }
  };

  const handleKunciSemester = async () => {
    const confirm = window.confirm(`Kunci rekap semester ${selectedSemester} ${selectedYear}?`);
    if (!confirm) return;
    const path = `Laporan_Absensi/${namaKelasAsli}/${selectedYear}_${selectedSemester}`;
    await set(ref(db, path), {
      metadata: { semester: selectedSemester, tahun: selectedYear, lockedAt: new Date().toISOString() },
      dataRekap: rekapSemester
    });
    alert("✅ Rekap Semester Berhasil Dikunci!");
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}><Loader2 className="animate-spin" color={colors.primary} /></div>;

  return (
    <div style={{ padding: '10px' }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, display: 'block', marginBottom: '5px' }}>PERIODE SEMESTER</label>
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ padding: '8px 15px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: colors.textPrimary, fontWeight: '700' }}>
                    <option value="Ganjil">GANJIL (JULI - DESEMBER)</option>
                    <option value="Genap">GENAP (JANUARI - JUNI)</option>
                </select>
            </div>
            <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, display: 'block', marginBottom: '5px' }}>TANGGAL ABSEN</label>
                <input type="date" value={tanggalPilih} onChange={(e) => setTanggalPilih(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: colors.textPrimary, fontWeight: '700' }} />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleKunciSemester} style={{ backgroundColor: '#8b5cf6', color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> KUNCI SEMESTER
            </button>
            <button onClick={() => setIsEditing(true)} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} /> INPUT ABSENSI
            </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>NAMA SISWA</th>
              <th style={{ padding: '15px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>STATUS HARI INI</th>
              <th style={{ padding: '15px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', fontWeight: '800' }}>REKAP SEMESTER</th>
            </tr>
          </thead>
          <tbody>
            {murid.map((m) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '15px 20px', color: colors.textPrimary, fontWeight: '700' }}>{m.namaTampil}</td>
                <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', backgroundColor: colors.primary + '15', color: colors.primary }}>
                        {(absensi[m.id] || "ALPA").toUpperCase()}
                    </span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}><div style={{ color: '#10B981', fontWeight: '900' }}>{rekapSemester[m.id]?.Hadir || 0}</div><div style={{ fontSize: '9px', color: colors.textMuted }}>HADIR</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ color: '#F59E0B', fontWeight: '900' }}>{rekapSemester[m.id]?.Izin || 0}</div><div style={{ fontSize: '9px', color: colors.textMuted }}>IZIN</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ color: '#6366F1', fontWeight: '900' }}>{rekapSemester[m.id]?.Sakit || 0}</div><div style={{ fontSize: '9px', color: colors.textMuted }}>SAKIT</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ color: '#EF4444', fontWeight: '900' }}>{rekapSemester[m.id]?.Alpa || 0}</div><div style={{ fontSize: '9px', color: colors.textMuted }}>ALPA</div></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* MODAL INPUT ABSENSI - UPDATED UI */}
      {isEditing && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
             <div style={{ backgroundColor: colors.cardBg, padding: '30px', borderRadius: '24px', width: '550px', border: `1px solid ${colors.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h3 style={{ color: colors.textPrimary, margin: 0 }}>Input Absen {tanggalPilih}</h3>
                    <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X /></button>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '25px', paddingRight: '10px' }}>
                    {murid.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${colors.border}` }}>
                            <span style={{ color: colors.textPrimary, fontSize: '14px', fontWeight: '600', maxWidth: '150px' }}>{m.namaTampil}</span>
                            
                            {/* SEGMENTED CONTROL BUTTONS */}
                            <div style={{ display: 'flex', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                {["Hadir", "Izin", "Sakit", "Alpa"].map((st) => {
                                    const isActive = absensi[m.id] === st;
                                    const colorMap = { Hadir: '#10B981', Izin: '#F59E0B', Sakit: '#6366F1', Alpa: '#EF4444' };
                                    return (
                                        <button 
                                            key={st}
                                            onClick={() => setAbsensi(p => ({...p, [m.id]: st}))}
                                            style={{ 
                                                padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                                backgroundColor: isActive ? colorMap[st] : 'transparent',
                                                color: isActive ? '#fff' : colors.textMuted,
                                                boxShadow: isActive ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >
                                            {st.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textPrimary, fontWeight: '700', cursor: 'pointer' }}>BATAL</button>
                    <button onClick={handleSimpanAbsensi} style={{ backgroundColor: colors.primary, color: '#fff', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} SIMPAN ABSEN
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default TabAbsensi;