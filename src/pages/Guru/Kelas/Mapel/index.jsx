import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuruLayout from '../../../../layouts/GuruLayout';
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, onValue } from 'firebase/database';
import TabTugas from './TabTugas';
import TabForum from './TabForum';
import TabNilai from './TabNilai';
import { ChevronLeft } from 'lucide-react';

const MapelDetail = () => {
  const { kelasId, mapelId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Forum');
  const [infoMapel, setInfoMapel] = useState(null);

  useEffect(() => {
    const mapelRef = ref(db, `Mapel/${mapelId}`);
    onValue(mapelRef, (snap) => {
      if (snap.exists()) setInfoMapel(snap.val());
    });
  }, [mapelId]);

  const styles = {
    tabItem: (isActive) => ({
      padding: '12px 0', cursor: 'pointer', fontSize: '15px', fontWeight: '700',
      color: isActive ? colors.primary : colors.textMuted,
      borderBottom: isActive ? `3px solid ${colors.primary}` : '3px solid transparent',
      transition: '0.2s', marginRight: '30px'
    })
  };

  return (
    // FIX: Judul Mapel dikelola oleh Layout utama agar tidak double
    <GuruLayout title={`Mapel ${infoMapel?.nama || ''}`}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate(`/Guru/Kelas/${kelasId}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', marginBottom: '10px', fontWeight: '700', fontSize: '14px' }}>
          <ChevronLeft size={18} /> Kembali ke Kelas
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: '25px' }}>
        {['Forum', 'Kuis & Materi', 'Nilai'].map(tab => (
          <div key={tab} style={styles.tabItem(activeTab === (tab === 'Kuis & Materi' ? 'Tugas Kelas' : tab))} onClick={() => setActiveTab(tab === 'Kuis & Materi' ? 'Tugas Kelas' : tab)}>
            {tab}
          </div>
        ))}
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'Forum' && <TabForum mapelId={mapelId} kelasId={kelasId} />}
        {activeTab === 'Tugas Kelas' && <TabTugas mapelId={mapelId} kelasId={kelasId} />}
        {activeTab === 'Nilai' && <TabNilai mapelId={mapelId} kelasId={kelasId} />}
      </div>
    </GuruLayout>
  );
};

export default MapelDetail;