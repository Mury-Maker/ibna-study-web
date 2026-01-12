import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase'; 
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { UserCircle, Loader2 } from 'lucide-react';

const TabAnggota = ({ namaKelas }) => {
  const { colors } = useTheme();
  const [murid, setMurid] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!namaKelas) return;
    
    // Cari siswa yang memiliki field nama_kelas yang sama
    const siswaRef = query(ref(db, 'Siswa'), orderByChild('nama_kelas'), equalTo(namaKelas));
    
    onValue(siswaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMurid(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setMurid([]);
      }
      setLoading(false);
    });
  }, [namaKelas]);

  if (loading) return <div style={{textAlign:'center', padding:'20px'}}><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <h4 style={{ color: colors.textMuted, fontSize: '13px', marginBottom: '15px', fontWeight: '800' }}>
        DAFTAR MURID KELAS {namaKelas} ({murid.length})
      </h4>
      {murid.length > 0 ? murid.map((item) => (
        <div key={item.id} style={{ backgroundColor: colors.cardBg, padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', border: `1px solid ${colors.border}` }}>
          <UserCircle size={32} color={colors.primary} />
          <div>
            <div style={{ fontWeight: '700', color: colors.textPrimary }}>{item.nama_siswa}</div>
            <div style={{ fontSize: '12px', color: colors.textMuted }}>Ortu: {item.namaOrtu} • {item.noHpOrtu}</div>
          </div>
        </div>
      )) : <p style={{color: colors.textMuted, textAlign:'center'}}>Belum ada siswa di kelas ini.</p>}
    </div>
  );
};

export default TabAnggota;