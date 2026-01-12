import React, { useState, useEffect } from 'react';
import GuruLayout from '../../../layouts/GuruLayout';
import { useTheme } from '../../../context/ThemeContext';
import { db, auth } from '../../../api/firebase'; 
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

import ListPertanyaan from './ListPertanyaan';
import DetailPertanyaan from './DetailPertanyaan';
import FormJawaban from './FormJawaban';

const TanyaPR = () => {
  const { colors } = useTheme();
  const [activeView, setActiveView] = useState('list'); 
  const [selectedPR, setSelectedPR] = useState(null);
  const [daftarPR, setDaftarPR] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Mengambil data TanyaPR milik guru yang sedang login
        const prRef = query(ref(db, 'TanyaPR'), orderByChild('teacherId'), equalTo(user.uid));
        
        onValue(prRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const formattedData = Object.keys(data).map(key => ({ 
              id: key, 
              ...data[key],
              // PERBAIKAN: Gunakan nama_kelas sesuai struktur di database lo
              nama_kelas: data[key].nama_kelas || "XII-IPA-1", 
              jenjang: data[key].jenjang || "SMA",
              status: data[key].status || "Menunggu"
            }));
            setDaftarPR(formattedData);
          } else { 
            setDaftarPR([]); 
          }
          setLoading(false);
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <GuruLayout title="Tanya PR Siswa">
      <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', minHeight: '100vh' }}>
        {activeView === 'list' && (
          <ListPertanyaan 
            daftarPR={daftarPR} 
            loading={loading} 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onSelect={(pr) => { setSelectedPR(pr); setActiveView('detail'); }} 
          />
        )}
        
        {activeView === 'detail' && (
          <DetailPertanyaan data={selectedPR} onBack={() => setActiveView('list')} onReply={() => setActiveView('form')} />
        )}

        {activeView === 'form' && (
          <FormJawaban data={selectedPR} onBack={() => setActiveView('detail')} onSuccess={() => setActiveView('list')} />
        )}
      </div>
    </GuruLayout>
  );
};

export default TanyaPR;