import React from 'react';
import GuruLayout from '../../layouts/GuruLayout';

const DashboardGuru = () => {
  return (
    <GuruLayout title="Dashboard">
      {/* Cukup tulis isi konten statistiknya saja di sini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
         <div style={cardStyle}>Nilai Terbaik</div>
         <div style={cardStyle}>Absensi</div>
      </div>
    </GuruLayout>
  );
};
const cardStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', minHeight: '200px' };
export default DashboardGuru;