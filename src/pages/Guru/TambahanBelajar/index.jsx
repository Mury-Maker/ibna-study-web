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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const pengajuanRef = query(ref(db, 'TambahanBelajar'), orderByChild('teacherId'), equalTo(user.uid));
        onValue(pengajuanRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setDaftarPengajuan(Object.keys(data).map(key => ({ id: key, ...data[key] })));
          } else { setDaftarPengajuan([]); }
          setLoading(false);
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