import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { Save, Loader2, Calendar, Edit3, XCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx'; // Pastikan sudah npm install xlsx

const TabAbsensi = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [murid, setMurid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [absensi, setAbsensi] = useState({}); 
  const [namaKelasAsli, setNamaKelasAsli] = useState("");
  const [tanggalPilih, setTanggalPilih] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const kelasSnapshot = await get(ref(db, `Kelas/${kelasId}`));
        const infoKelas = kelasSnapshot.val();
        if (infoKelas) {
          setNamaKelasAsli(infoKelas.nama_kelas);
          onValue(ref(db, 'Siswa'), (snapshotSiswa) => {
            const allSiswa = snapshotSiswa.val();
            if (allSiswa) {
              const list = Object.keys(allSiswa)
                .filter(key => allSiswa[key].nama_kelas === infoKelas.nama_kelas)
                .map(key => ({ id: key, ...allSiswa[key] }));
              setMurid(list);

              onValue(ref(db, 'Kehadiran'), (snapshotKehadiran) => {
                const dataKehadiran = snapshotKehadiran.val();
                const statusMap = {};
                list.forEach(m => statusMap[m.id] = "Alpa");
                if (dataKehadiran) {
                  Object.values(dataKehadiran).forEach(record => {
                    const tglRecord = record.createdAt ? record.createdAt.substring(0, 10) : "";
                    if (tglRecord === tanggalPilih && statusMap.hasOwnProperty(record.studentId)) {
                      statusMap[record.studentId] = record.status;
                    }
                  });
                }
                setAbsensi(statusMap);
                setLoading(false);
              });
            }
          });
        }
      } catch (err) { console.error(err); setLoading(false); }
    };
    fetchData();
  }, [kelasId, tanggalPilih]);

  // FUNGSI EXPORT EXCEL GAGAH
  const handleDownloadExcel = () => {
    if (murid.length === 0) return alert("Tidak ada data siswa.");
    const dataExport = murid.map(m => ({
      "NAMA SISWA": m.nama_siswa,
      "TANGGAL": tanggalPilih,
      "STATUS": absensi[m.id] || "Alpa",
      "KELAS": namaKelasAsli
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");
    XLSX.writeFile(workbook, `Absensi_${namaKelasAsli}_${tanggalPilih}.xlsx`);
  };

  const handleSimpanAbsensi = async () => {
    setIsSaving(true);
    try {
      const timestampFull = new Date().toISOString();
      const promises = murid.map((m) => {
        const customId = `${tanggalPilih}_${m.id}`;
        return set(ref(db, `Kehadiran/${customId}`), {
          studentId: m.id,
          nama_siswa: m.nama_siswa,
          status: absensi[m.id],
          nama_kelas: namaKelasAsli,
          createdAt: timestampFull,
          scheduleId: "manual_entry"
        });
      });
      await Promise.all(promises);
      setIsEditing(false);
      alert("✅ Absensi Berhasil Diperbarui!");
    } catch (error) { alert(error.message); } finally { setIsSaving(false); }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}><Loader2 className="animate-spin" /></div>;

  return (
    <div style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} color={colors.primary} />
          <input type="date" value={tanggalPilih} onChange={(e) => setTanggalPilih(e.target.value)} 
            style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, color: colors.textPrimary }} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadExcel} style={{ backgroundColor: '#10B981', color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : '#f3f4f6', color: isDarkMode ? '#60A5FA' : colors.primary, padding: '10px 20px', borderRadius: '10px', border: `1px solid ${isDarkMode ? '#60A5FA' : colors.primary}`, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} /> Edit
            </button>
          ) : (
            <div style={{display:'flex', gap: '10px'}}>
              <button onClick={() => setIsEditing(false)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSimpanAbsensi} style={{ backgroundColor: colors.primary, color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: colors.textMuted, fontSize: '12px' }}>
              <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border}` }}>NAMA SISWA</th>
              <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border}`, textAlign: 'center' }}>STATUS ({tanggalPilih})</th>
            </tr>
          </thead>
          <tbody>
            {murid.map((m) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '15px', color: colors.textPrimary, fontWeight: '600' }}>{m.nama_siswa}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', opacity: isEditing ? 1 : 0.6 }}>
                    {["Hadir", "Izin", "Alpa"].map((st) => (
                      <button key={st} disabled={!isEditing} onClick={() => setAbsensi(p => ({...p, [m.id]: st}))}
                        style={{ padding: '6px 15px', borderRadius: '8px', border: '1px solid', fontSize: '11px', fontWeight: '800', cursor: isEditing ? 'pointer' : 'default', backgroundColor: absensi[m.id] === st ? (st==='Hadir'?'#10B981':st==='Izin'?'#F59E0B':'#EF4444') : "transparent", color: absensi[m.id] === st ? "#fff" : "#888", borderColor: absensi[m.id] === st ? 'transparent' : colors.border }}>
                        {st.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabAbsensi;