import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../api/firebase'; 
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { UserCircle, Loader2, Phone, User } from 'lucide-react';

const TabAnggota = ({ namaKelas }) => {
  const { colors } = useTheme();
  const [daftarMurid, setDaftarMurid] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!namaKelas) return;
    
    // 1. Ambil data Siswa berdasarkan nama_kelas
    const siswaRef = query(ref(db, 'Siswa'), orderByChild('nama_kelas'), equalTo(namaKelas));
    
    // 2. Ambil data Users untuk mendapatkan Nama Lengkap & Foto Asli
    const usersRef = ref(db, 'Users');

    onValue(usersRef, (usersSnapshot) => {
      const allUsers = usersSnapshot.val() || {};

      onValue(siswaRef, (siswaSnapshot) => {
        const dataSiswa = siswaSnapshot.val();
        
        if (dataSiswa) {
          const listLengkap = Object.keys(dataSiswa).map(key => {
            const siswaItem = dataSiswa[key];
            const userProfile = allUsers[siswaItem.userId] || {}; // Cross-ref pakai userId

            return {
              id: key,
              ...siswaItem,
              // Prioritaskan Nama dari node Users biar konsisten
              namaTampil: userProfile.nama || siswaItem.nama_siswa || "Murid",
              fotoTampil: userProfile.foto || siswaItem.fotoProfil || null,
              emailSiswa: userProfile.email || "-"
            };
          });
          setDaftarMurid(listLengkap);
        } else {
          setDaftarMurid([]);
        }
        setLoading(false);
      });
    });
  }, [namaKelas]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <Loader2 className="animate-spin" color={colors.primary} size={32} />
      <p style={{ color: colors.textMuted, marginTop: '10px', fontSize: '13px' }}>Memuat data kelas...</p>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ color: colors.textPrimary, fontSize: '15px', fontWeight: '800', margin: 0 }}>
          ANGGOTA KELAS {namaKelas}
        </h4>
        <span style={{ backgroundColor: colors.primary + '15', color: colors.primary, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
          {daftarMurid.length} Siswa
        </span>
      </div>

      {daftarMurid.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {daftarMurid.map((item) => (
            <div key={item.id} style={{ backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '15px', transition: 'transform 0.2s', cursor: 'default' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {item.fotoTampil ? (
                  <img src={item.fotoTampil} alt="profil" style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: colors.primary + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User color={colors.primary} size={24} />
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: '800', color: colors.textPrimary, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {item.namaTampil}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>{item.emailSiswa}</div>
                </div>
              </div>

              <div style={{ paddingTop: '15px', borderTop: `1px dashed ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>Wali Murid</span>
                  <span style={{ fontSize: '11px', color: colors.textPrimary, fontWeight: '700' }}>{item.namaOrtu || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>Kontak Ortu</span>
                  <a href={`https://wa.me/${item.noHpOrtu}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: colors.primary, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    <Phone size={12} /> {item.noHpOrtu || '-'}
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` }}>
          <p style={{ color: colors.textMuted, fontSize: '13px' }}>Belum ada siswa yang terdaftar di kelas ini.</p>
        </div>
      )}
    </div>
  );
};

export default TabAnggota;