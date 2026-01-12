import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import GuruLayout from '../../../layouts/GuruLayout';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase';
import { ref, onValue } from 'firebase/database';

import TabMapel from './TabMapel';
import TabAbsensi from './TabAbsensi';
import TabAnggota from './TabAnggota';
import TabUjian from './TabUjian'; 

const KelasDetail = () => {
  const { kelasId } = useParams(); // ID kelas dari URL
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('Mapel');
  const [detailKelas, setDetailKelas] = useState({ nama_kelas: "Loading...", jenjang: "" });

  useEffect(() => {
    // Ambil info nama kelas
    const kelasRef = ref(db, `Kelas/${kelasId}`);
    onValue(kelasRef, (snap) => {
      if (snap.exists()) setDetailKelas(snap.val());
    });
  }, [kelasId]);

  return (
    <GuruLayout title={`Kelas ${detailKelas.nama_kelas} (${detailKelas.jenjang})`}>
      {/* Tab Header tetap sama seperti kode lo tadi */}
      <div style={{ display: 'flex', gap: '25px', borderBottom: `2px solid ${colors.border}`, marginBottom: '25px', overflowX: 'auto' }}>
        {['Mapel', 'Absensi', 'Anggota', 'Ujian'].map((tab) => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 5px', cursor: 'pointer', fontSize: '15px', fontWeight: '700',
            color: activeTab === tab ? (isDarkMode ? '#60A5FA' : colors.primary) : colors.textMuted,
            borderBottom: activeTab === tab ? `3px solid ${isDarkMode ? '#60A5FA' : colors.primary}` : '3px solid transparent'
          }}>{tab === 'Ujian' ? 'Ujian Perbulan' : tab}</div>
        ))}
      </div>

      <div style={{ width: '100%' }}>
        {activeTab === 'Mapel' && <TabMapel kelasId={kelasId} />}
        {activeTab === 'Absensi' && <TabAbsensi kelasId={kelasId} />}
        {/* Oper nama_kelas ke TabAnggota buat filter siswa */}
        {activeTab === 'Anggota' && <TabAnggota namaKelas={detailKelas.nama_kelas} />}
        {activeTab === 'Ujian' && <TabUjian kelasId={kelasId} />}
      </div>
    </GuruLayout>
  );
};

export default KelasDetail;