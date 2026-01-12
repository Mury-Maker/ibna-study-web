import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuruLayout from '../../layouts/GuruLayout';
import { auth, db } from '../../api/firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { User, Loader2, Mail, Phone, ShieldCheck, Edit3 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ProfileGuru = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { colors, isDarkMode } = useTheme(); 
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `Users/${user.uid}`);
        const unsubscribeData = onValue(userRef, (snap) => {
          setUserData(snap.val());
          setLoading(false);
        });
        return () => unsubscribeData();
      } else {
        navigate('/Login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const styles = {
    container: { padding: '20px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease' },
    card: { 
      backgroundColor: colors.cardBg, 
      border: `1px solid ${colors.border}`, 
      borderRadius: '16px', 
      width: '100%', 
      overflow: 'hidden',
      boxSizing: 'border-box'
    },
    headerBg: {
      height: '120px',
      background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
      width: '100%'
    },
    profileContent: {
      padding: '0 40px 40px 40px',
      marginTop: '-60px',
      display: 'flex',
      gap: '40px',
      flexWrap: 'wrap'
    },
    leftSection: { 
      flex: '0 0 200px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center' 
    },
    avatarWrapper: { 
      width: '160px', height: '160px', borderRadius: '20px', 
      backgroundColor: colors.cardBg, display: 'flex', 
      justifyContent: 'center', alignItems: 'center', 
      marginBottom: '20px', border: `4px solid ${colors.cardBg}`, 
      overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
    editBtn: { 
      width: '100%', padding: '12px', backgroundColor: colors.primary, 
      color: '#fff', borderRadius: '10px', border: 'none', 
      cursor: 'pointer', fontWeight: '700', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
    },
    rightSection: { flex: 1, minWidth: '300px', paddingTop: '70px' },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px'
    },
    infoCard: {
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    iconBox: {
      width: '45px', height: '45px', borderRadius: '10px',
      backgroundColor: colors.primary + '15', color: colors.primary,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    label: { fontSize: '11px', color: colors.textMuted, fontWeight: '800', letterSpacing: '1px', display: 'block' },
    value: { fontSize: '15px', fontWeight: '700', color: colors.textPrimary, margin: '2px 0 0' }
  };

  if (loading) {
    return (
      <GuruLayout title="Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '40px', color: colors.textPrimary }}>
          <Loader2 className="animate-spin" /> Memuat Profil...
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout title="Informasi Profil">
      <div style={styles.container}>
        <div style={styles.card} className="profile-main-card">
          <div style={styles.headerBg} />
          
          <div style={styles.profileContent} className="profile-inner">
            <div style={styles.leftSection}>
              <div style={styles.avatarWrapper}>
                {userData?.foto ? (
                  <img src={userData.foto} alt="Profile" style={styles.avatarImg} />
                ) : (
                  <User size={80} color={colors.textMuted} />
                )}
              </div>
              <button style={styles.editBtn} onClick={() => navigate('/Guru/Profile/Edit')}>
                <Edit3 size={18} /> Edit Profile
              </button>
            </div>

            <div style={styles.rightSection}>
              <h2 style={{ margin: '0 0 5px 0', color: colors.textPrimary, fontSize: '24px', fontWeight: '800' }}>{userData?.nama || 'Nama Pengguna'}</h2>
              <p style={{ margin: '0 0 30px 0', color: colors.textMuted, fontSize: '14px' }}>Guru Profesional IBNA Study</p>

              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.iconBox}><Mail size={20} /></div>
                  <div>
                    <span style={styles.label}>EMAIL ADDRRESS</span>
                    <p style={styles.value}>{userData?.email || auth.currentUser?.email}</p>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.iconBox}><Phone size={20} /></div>
                  <div>
                    <span style={styles.label}>WHATSAPP NUMBER</span>
                    <p style={styles.value}>{userData?.noHp || '-'}</p>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.iconBox}><ShieldCheck size={20} /></div>
                  <div>
                    <span style={styles.label}>ACCOUNT ROLE</span>
                    <p style={styles.value}>{userData?.role || 'Guru'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .profile-inner { flex-direction: column !important; align-items: center !important; padding: 20px !important; }
          .profile-inner > div { width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </GuruLayout>
  );
};

export default ProfileGuru;