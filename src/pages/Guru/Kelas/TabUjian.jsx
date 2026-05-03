import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PlusCircle, FileText, ClipboardList, Edit3, Trash2, ChevronDown, ChevronUp, User, Clock, AlertCircle } from 'lucide-react';
import { db } from '../../../api/firebase';
import { ref, onValue, remove } from 'firebase/database';
import FormBuatUjian from './FormBuatUjian';

const TabUjian = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [daftarUjian, setDaftarUjian] = useState([]);
  const [listPengerjaan, setListPengerjaan] = useState([]); 
  const [dataSiswaLengkap, setDataSiswaLengkap] = useState({});
  const [selectedUjian, setSelectedUjian] = useState(null);
  const [expandedNilaiId, setExpandedNilaiId] = useState(null);

  useEffect(() => {
    if (!kelasId) return;

    // 1. Mapping Nama Siswa
    onValue(ref(db, 'Users'), (usersSnap) => {
      const allUsers = usersSnap.val() || {};
      onValue(ref(db, 'Siswa'), (siswaSnap) => {
        const mapping = {};
        if (siswaSnap.exists()) {
          siswaSnap.forEach(child => {
            const s = child.val();
            mapping[s.userId] = allUsers[s.userId]?.nama || s.nama_siswa || "Siswa";
          });
          setDataSiswaLengkap(mapping);
        }
      });
    });

    // 2. Data Ujian Perbulan
    onValue(ref(db, `UjianPerbulan/${kelasId}`), (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] }));
        setDaftarUjian(list.sort((a, b) => b.createdAt - a.createdAt));
      } else { setDaftarUjian([]); }
    });

    // 3. Hasil Nilai
    onValue(ref(db, 'Nilai'), (snap) => {
      if (snap.exists()) {
        setListPengerjaan(Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })));
      }
    });

  }, [kelasId]);

  const styles = {
    card: { backgroundColor: colors.cardBg, padding: '18px 20px', borderRadius: '16px', border: `1px solid ${colors.border}`, marginBottom: '15px' },
    table: { width: '100%', marginTop: '15px', borderCollapse: 'collapse', fontSize: '13px' },
    th: { textAlign: 'left', padding: '10px', color: colors.textMuted, borderBottom: `1px solid ${colors.border}` },
    td: { padding: '10px', borderBottom: `1px solid ${colors.border}`, color: colors.textPrimary }
  };

  if (isCreating) return <FormBuatUjian kelasId={kelasId} onBack={() => { setIsCreating(false); setSelectedUjian(null); }} editData={selectedUjian} />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h3 style={{ margin: 0, fontWeight: '800', color: colors.textPrimary }}>Ujian Perbulan ({kelasId})</h3>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: colors.primary, color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }} onClick={() => setIsCreating(true)}>
          <PlusCircle size={18} /> Buat Ujian
        </button>
      </div>

      {daftarUjian.map((item) => {
        const hasilSiswa = listPengerjaan.filter(n => n.kontenId === item.id);
        const isOpen = expandedNilaiId === item.id;
        return (
          <div key={item.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <ClipboardList size={24} color={colors.primary} />
                <div>
                  <h4 style={{ margin: 0, color: colors.textPrimary }}>{item.judul}</h4>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>{item.pertanyaan?.length || 0} Soal • Maks {item.poinMaksimal} Poin</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setExpandedNilaiId(isOpen ? null : item.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${colors.primary}`, color: colors.primary, background: 'none', cursor: 'pointer', fontSize: '12px' }}>
                   {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {isOpen ? 'Tutup' : `Nilai (${hasilSiswa.length})`}
                </button>
                <button onClick={() => { setSelectedUjian(item); setIsCreating(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Edit3 size={18} color={colors.textMuted}/></button>
                <button onClick={() => remove(ref(db, `UjianPerbulan/${kelasId}/${item.id}`))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} color="#ef4444"/></button>
              </div>
            </div>

            {isOpen && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Siswa</th>
                    <th style={styles.th}>Skor</th>
                    <th style={styles.th}>Waktu</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hasilSiswa.map(n => (
                    <tr key={n.id}>
                      <td style={styles.td}>{dataSiswaLengkap[n.studentId] || "Siswa"}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: n.isTerlambat ? '#ef4444' : colors.primary }}>{n.skor}</td>
                      <td style={styles.td}>{n.submittedAt ? new Date(n.submittedAt).toLocaleTimeString() : '-'}</td>
                      <td style={styles.td}>{n.isTerlambat ? 'TELAT (-5)' : 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabUjian;