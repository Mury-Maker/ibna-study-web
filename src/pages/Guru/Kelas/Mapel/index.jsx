import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuruLayout from '../../../../layouts/GuruLayout';
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, onValue } from 'firebase/database';
import TabTugas from './TabTugas';
import TabNilai from './TabNilai';
import { ChevronLeft } from 'lucide-react';

const MapelDetail = () => {
  const { kelasId, mapelId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Kuis & Materi');
  const [infoMapel, setInfoMapel] = useState(null);

  useEffect(() => {
    onValue(ref(db, `Mapel/${mapelId}`), (snap) => {
      if (snap.exists()) setInfoMapel(snap.val());
    });
  }, [mapelId]);

  const styles = {
    tabItem: (isActive) => ({
      padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '800',
      color: isActive ? colors.primary : colors.textMuted,
      borderBottom: isActive ? `3px solid ${colors.primary}` : '3px solid transparent',
      transition: '0.2s'
    })
  };

  return (
    <GuruLayout title={`Mapel ${infoMapel?.nama || ''}`}>
      <button onClick={() => navigate(`/Guru/Kelas/${kelasId}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', marginBottom: '15px', fontWeight: '700', fontSize: '13px' }}>
        <ChevronLeft size={16} /> Kembali ke Kelas
      </button>

      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>
        {['Kuis & Materi', 'Nilai'].map(tab => (
          <div key={tab} style={styles.tabItem(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
      </div>

      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'Kuis & Materi' && <TabTugas mapelId={mapelId} kelasId={kelasId} />}
        {activeTab === 'Nilai' && <TabNilai mapelId={mapelId} kelasId={kelasId} />}
      </div>
    </GuruLayout>
  );
};

export default MapelDetail;