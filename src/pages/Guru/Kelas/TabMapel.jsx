import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { BookOpen, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Tambahkan ini

const TabMapel = ({ kelasId }) => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate(); // Inisialisasi navigate
  const [mapels, setMapels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kelasId) return;
    const mapelRef = query(ref(db, 'Mapel'), orderByChild('classId'), equalTo(kelasId));
    onValue(mapelRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMapels(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else { setMapels([]); }
      setLoading(false);
    });
  }, [kelasId]);

  return (
    <div>
      {loading ? <div style={{textAlign:'center', padding:'40px'}}><Loader2 className="animate-spin"/></div> : 
        mapels.length > 0 ? mapels.map((mapel) => (
        <div 
          key={mapel.id} 
          style={{
            backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}`,
            marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
          }}
          // Navigasi ke halaman detail mapel yang baru
          onClick={() => navigate(`/Guru/Kelas/${kelasId}/Mapel/${mapel.id}`)}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
        >
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <div style={{padding:'10px', borderRadius:'12px', backgroundColor: colors.primary + '15', color: colors.primary}}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: isDarkMode ? '#60A5FA' : colors.primary }}>{mapel.nama}</div>
              <p style={{ fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>Klik untuk mengelola materi dan tugas.</p>
            </div>
          </div>
          <ChevronRight color={colors.border} />
        </div>
      )) : <div style={{textAlign:'center', padding:'50px', color: colors.textMuted, border:`2px dashed ${colors.border}`, borderRadius:'16px'}}>Belum ada mata pelajaran.</div>}
    </div>
  );
};

export default TabMapel;