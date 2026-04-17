import React, { useState, useEffect } from 'react';
import GuruLayout from '../../../layouts/GuruLayout';
import { db, auth } from '../../../api/firebase';
import { ref, onValue, query, orderByChild, equalTo, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

import ListPengajuan from './ListPengajuan';
import DetailPengajuan from './DetailPengajuan';

const TambahanBelajar = () => {
  const [activeView, setActiveView] = useState('list'); 
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [daftarPengajuan, setDaftarPengajuan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Bagian useEffect di TambahanBelajar/index.jsx
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 1. Ambil data Siswa dulu buat referensi kelas
        onValue(ref(db, 'Siswa'), (siswaSnap) => {
          const allSiswa = siswaSnap.val() || {};

          // 2. Ambil data TambahanBelajar milik guru ini
          const pengajuanRef = query(ref(db, 'TambahanBelajar'), orderByChild('teacherId'), equalTo(user.uid));
          onValue(pengajuanRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const formattedData = Object.keys(data).map(key => {
                const item = data[key];
                // CARI KELAS & JENJANG DARI NODE SISWA SECARA OTOMATIS
                // Kita cari siswa yang punya userId atau studentId yang sama
                const infoSiswa = Object.values(allSiswa).find(s => s.userId === item.studentId || s.id === item.studentId);

                return {
                  id: key,
                  ...item,
                  nama_kelas: infoSiswa?.nama_kelas || "Tanpa Kelas",
                  jenjang: infoSiswa?.jenjang || "-"
                };
              });
              setDaftarPengajuan(formattedData);
            } else {
              setDaftarPengajuan([]);
            }
            setLoading(false);
          });
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleAction = async (id, newStatus, rejectionReason = "") => {
    try {
      await update(ref(db, `TambahanBelajar/${id}`), {
        status: newStatus,
        alasanPenolakan: rejectionReason,
        updatedAt: new Date().toISOString()
      });
      setActiveView('list');
    } catch (error) { alert("Gagal: " + error.message); }
  };

  return (
    <GuruLayout title="Tambahan Belajar">
      <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
        {activeView === 'list' && (
          <ListPengajuan 
            daftar={daftarPengajuan} loading={loading}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            onSelect={(item) => { setSelectedRequest(item); setActiveView('detail'); }}
          />
        )}
        {activeView === 'detail' && (
          <DetailPengajuan data={selectedRequest} onBack={() => setActiveView('list')} onConfirmAction={handleAction} />
        )}
      </div>
    </GuruLayout>
  );
};

export default TambahanBelajar;