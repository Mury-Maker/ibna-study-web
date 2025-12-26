import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { auth, db } from '../../../api/firebase'; 
import { ref, get } from 'firebase/database';
import { UserCircle, Users, Loader2 } from 'lucide-react';

const TabAnggota = () => {
  const { colors, isDarkMode } = useTheme();
  const [guruData, setGuruData] = useState({ nama: "Memuat...", foto: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Mengambil data nama dan profilUrl dari Database
          const snapshot = await get(ref(db, `Users/${user.uid}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setGuruData({
              nama: data.nama || "Guru IBNA",
              foto: data.profilUrl || null // Field foto profil lo di database
            });
          }
        } catch (error) {
          console.error("Error fetch data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, []);

  const styles = {
    sectionTitle: { color: colors.textMuted, fontSize: '14px', marginBottom: '15px', fontWeight: '600' },
    memberCard: {
      backgroundColor: isDarkMode ? '#1E293B' : colors.sidebarBg,
      padding: '12px 15px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '10px',
      border: `1px solid ${colors.border}`
    },
    // Style khusus untuk foto profil bulat
    avatar: {
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: `2px solid ${isDarkMode ? '#60A5FA' : colors.primary}`
    },
    avatarPlaceholder: {
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textMuted
    }
  };

  return (
    <div>
      <h4 style={styles.sectionTitle}>Pengajar</h4>
      <div style={styles.memberCard}>
        {loading ? (
          <Loader2 size={20} className="animate-spin" color={colors.textMuted} />
        ) : (
          <>
            {/* Logika Tampilan Foto Profil */}
            {guruData.foto ? (
              <img src={guruData.foto} alt="Profil" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                <Users size={18} />
              </div>
            )}
            <span style={{ fontWeight: '700', color: colors.textPrimary }}>
              {guruData.nama}
            </span>
          </>
        )}
      </div>

      <h4 style={{ ...styles.sectionTitle, marginTop: '25px' }}>Murid</h4>
      {['John', 'Tiery', 'Henry', 'Chris'].map((nama, i) => (
        <div key={i} style={styles.memberCard}>
          <div style={styles.avatarPlaceholder}>
             <UserCircle size={20} />
          </div>
          <span style={{ fontWeight: '600', color: colors.textPrimary }}>{nama}</span>
        </div>
      ))}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default TabAnggota;