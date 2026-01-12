import React, { useState, useEffect } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { useTheme } from '../../context/ThemeContext';
import { Clock, ChevronRight, AlertCircle, Loader2, CalendarDays, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { db, auth } from '../../api/firebase'; 
import { ref, onValue, query, orderByChild, equalTo, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

const Jadwal = () => {
  const { colors, isDarkMode } = useTheme();
  const [dataJadwal, setDataJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State Filter
  const [hariFilter, setHariFilter] = useState("Semua");
  const [bulanFilter, setBulanFilter] = useState(new Date().getMonth() + 1);

  const listHari = ["Semua", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const listBulan = [
    { id: 1, nama: "Januari" }, { id: 2, nama: "Februari" }, { id: 3, nama: "Maret" },
    { id: 4, nama: "April" }, { id: 5, nama: "Mei" }, { id: 6, nama: "Juni" },
    { id: 7, nama: "Juli" }, { id: 8, nama: "Agustus" }, { id: 9, nama: "September" },
    { id: 10, nama: "Oktober" }, { id: 11, nama: "November" }, { id: 12, nama: "Desember" }
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Ambil referensi Kelas untuk mendapatkan detail nama_kelas & jenjang
          const kelasRef = ref(db, 'Kelas');
          const kelasSnapshot = await get(kelasRef);
          const dataKelas = kelasSnapshot.val() || {};

          // 2. Ambil referensi Mapel untuk mendapatkan nama mata pelajaran
          const mapelRef = ref(db, 'Mapel');
          const mapelSnapshot = await get(mapelRef);
          const dataMapel = mapelSnapshot.val() || {};

          // 3. Ambil Jadwal berdasarkan teacherId
          const jadwalRef = query(ref(db, 'Jadwal'), orderByChild('teacherId'), equalTo(user.uid));
          
          onValue(jadwalRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const list = Object.keys(data).map(key => {
                const item = data[key];
                const detailKelas = dataKelas[item.classId] || {};
                const detailMapel = dataMapel[item.subjectId] || {};
                
                return {
                  id: key,
                  ...item,
                  nama_kelas: detailKelas.nama_kelas || "Tanpa Kelas",
                  jenjang: detailKelas.jenjang || "SMA",
                  subjectName: detailMapel.nama || item.subjectId || "Mata Pelajaran"
                };
              });
              setDataJadwal(list);
            } else {
              setDataJadwal([]);
            }
            setLoading(false);
          });
        } catch (err) {
          setError("Gagal sinkronisasi database.");
          setLoading(false);
        }
      } else {
        setError("Sesi berakhir, silakan login kembali.");
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const filteredJadwal = dataJadwal.filter(item => 
    hariFilter === "Semua" || item.hari === hariFilter
  );

  const hariTampil = [...new Set(filteredJadwal.map(item => item.hari))];

  const styles = {
    container: { padding: '20px', animation: 'fadeIn 0.3s ease', width: '100%', boxSizing: 'border-box' },
    filterRow: { display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' },
    selectGroup: { 
      display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px 15px', flex: 1, minWidth: '200px' 
    },
    dropdown: { 
      background: 'none', border: 'none', outline: 'none', color: colors.textPrimary, 
      width: '100%', cursor: 'pointer', fontWeight: '600', fontSize: '14px' 
    },
    dayTitle: { 
      fontSize: '16px', fontWeight: '800', color: isDarkMode ? '#60A5FA' : colors.primary, 
      display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', 
      borderBottom: `2px solid ${colors.border}`, paddingBottom: '8px' 
    },
    jadwalCard: { 
      backgroundColor: colors.cardBg, padding: '18px 20px', borderRadius: '16px', 
      border: `1px solid ${colors.border}`, marginBottom: '12px', display: 'flex', 
      justifyContent: 'space-between', alignItems: 'center' 
    }
  };

  return (
    <GuruLayout title="Jadwal Mengajar">
      <div style={styles.container}>
        {!loading && !error && (
          <div style={styles.filterRow}>
            <div style={styles.selectGroup}>
              <Filter size={18} color={colors.primary} />
              <select style={styles.dropdown} value={hariFilter} onChange={(e) => setHariFilter(e.target.value)}>
                {listHari.map(h => <option key={h} value={h} style={{background: colors.cardBg}}>{h}</option>)}
              </select>
            </div>
            <div style={styles.selectGroup}>
              <CalendarIcon size={18} color={colors.primary} />
              <select style={styles.dropdown} value={bulanFilter} onChange={(e) => setBulanFilter(e.target.value)}>
                {listBulan.map(b => <option key={b.id} value={b.id} style={{background: colors.cardBg}}>{b.nama}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{textAlign:'center', padding:'100px'}}><Loader2 className="animate-spin" size={40} color={colors.primary} /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#E53E3E', padding: '50px' }}>
             <AlertCircle size={40} style={{ margin: '0 auto 10px' }} />
             <p>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
            {hariTampil.length > 0 ? hariTampil.map((hari) => (
              <div key={hari}>
                <div style={styles.dayTitle}>
                  <div style={{ width: '4px', height: '18px', backgroundColor: colors.secondary, borderRadius: '2px' }} />
                  {hari}
                </div>
                {filteredJadwal.filter(j => j.hari === hari).map((item) => (
                  <div key={item.id} style={styles.jadwalCard}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: colors.textPrimary }}>{item.nama_kelas}</div>
                      <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px' }}>{item.jenjang} • {item.subjectName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '8px', color: colors.primary, fontWeight: '700' }}>
                        <Clock size={14} /> {item.jamMulai} - {item.jamSelesai}
                      </div>
                    </div>
                    <ChevronRight size={18} color={colors.border} />
                  </div>
                ))}
              </div>
            )) : (
              <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '50px', color: colors.textMuted }}>
                <CalendarDays size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p>Tidak ada jadwal untuk kriteria tersebut.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </GuruLayout>
  );
};

export default Jadwal;