import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuruLayout from '../../layouts/GuruLayout';
import { auth, db } from '../../api/firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth'; // Penting untuk handle refresh
import { User, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ProfileGuru = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme(); 
  const navigate = useNavigate();

  useEffect(() => {
    // Memantau status login saat refresh halaman
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `Users/${user.uid}`);
        const unsubscribeData = onValue(userRef, (snap) => {
          setUserData(snap.val());
          setLoading(false);
        });
        return () => unsubscribeData();
      } else {
        // Jika sesi habis atau tidak login, tendang ke Login
        navigate('/Login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const styles = {
    card: { 
      display: 'flex', backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, borderRadius: '12px', 
      padding: '40px', maxWidth: '850px', transition: 'all 0.3s ease'
    },
    leftSection: { 
      flex: 1, display: 'flex', flexDirection: 'column', 
      alignItems: 'center', borderRight: `1px solid ${colors.border}`, paddingRight: '40px' 
    },
    avatarCircle: { 
      width: '140px', height: '140px', borderRadius: '50%', 
      backgroundColor: colors.sidebarBg, display: 'flex', 
      justifyContent: 'center', alignItems: 'center', 
      marginBottom: '20px', border: `1px solid ${colors.border}`, overflow: 'hidden'
    },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
    editBtn: { 
      padding: '8px 24px', border: `1px solid ${colors.secondary}`, 
      color: colors.secondary, backgroundColor: 'transparent', 
      borderRadius: '6px', cursor: 'pointer', fontWeight: '600' 
    },
    rightSection: { flex: 1.5, paddingLeft: '40px' },
    infoRow: { marginBottom: '20px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' },
    label: { fontSize: '13px', color: colors.textMuted, display: 'block', marginBottom: '4px' },
    value: { fontSize: '16px', fontWeight: '500', color: colors.textPrimary, margin: 0 }
  };

  if (loading) {
    return (
      <GuruLayout title="Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.textPrimary }}>
          <Loader2 className="animate-spin" /> Memuat Profil...
        </div>
      </GuruLayout>
    );
  }

  const infoFields = [
    { label: 'Nama', value: userData?.nama || '-' },
    { label: 'Email', value: userData?.email || auth.currentUser?.email || '-' },
    { label: 'Peran', value: userData?.role || 'Guru' },
    { label: 'No Hp', value: userData?.noHp || '-' }
  ];

  return (
    <GuruLayout title="Profile">
      <div style={styles.card} className="profile-container">
        <div style={styles.leftSection}>
          <div style={styles.avatarCircle}>
            {userData?.foto ? (
              <img src={userData.foto} alt="Profile" style={styles.avatarImg} />
            ) : (
              <User size={70} color={colors.textMuted} />
            )}
          </div>
          <button style={styles.editBtn} onClick={() => navigate('/Guru/Profile/Edit')}>
            Edit Profile
          </button>
        </div>
        <div style={styles.rightSection}>
          {infoFields.map((field, idx) => (
            <div key={idx} style={styles.infoRow}>
              <span style={styles.label}>{field.label}</span>
              <p style={styles.value}>{field.value}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .profile-container { flex-direction: column !important; padding: 20px !important; }
          .profile-container > div { border: none !important; padding: 10px 0 !important; width: 100% !important; }
        }
      `}</style>
    </GuruLayout>
  );
};

export default ProfileGuru;