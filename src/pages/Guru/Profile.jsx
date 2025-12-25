import React, { useEffect, useState } from 'react';
import GuruLayout from '../../layouts/GuruLayout';
import { auth, db } from '../../api/firebase';
import { ref, onValue } from 'firebase/database';
import { User } from 'lucide-react';
import { theme } from '../../styles/theme';

const ProfileGuru = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      onValue(ref(db, `Users/${user.uid}`), (snap) => setUserData(snap.val()));
    }
  }, []);

  const infoFields = [
    { label: 'Nama', value: userData?.nama || 'Sari' },
    { label: 'Email', value: userData?.email || 'aditya25104@gmail.com' },
    { label: 'Peran', value: userData?.role || 'Guru' },
    { label: 'No Hp', value: userData?.noHp || '085xxxxxxxxx' }
  ];

  return (
    <GuruLayout title="Profile">
      <div style={styles.card} className="profile-container">
        <div style={styles.leftSection}>
          <div style={styles.avatarCircle}><User size={70} color={theme.colors.textMuted} /></div>
          <button style={styles.editBtn}>Edit Profile</button>
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

const styles = {
  card: { display: 'flex', backgroundColor: theme.colors.white, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', padding: '40px', maxWidth: '850px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  leftSection: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: `1px solid ${theme.colors.border}`, paddingRight: '40px' },
  avatarCircle: { width: '140px', height: '140px', borderRadius: '50%', backgroundColor: theme.colors.contentBg, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', border: `1px solid ${theme.colors.border}` },
  editBtn: { padding: '8px 24px', border: `1px solid ${theme.colors.activeMenu}`, color: theme.colors.activeMenu, backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  rightSection: { flex: 1.5, paddingLeft: '40px' },
  infoRow: { marginBottom: '20px', borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: '8px' },
  label: { fontSize: '13px', color: theme.colors.textMuted, display: 'block', marginBottom: '4px' },
  value: { fontSize: '16px', fontWeight: '500', color: theme.colors.textPrimary, margin: 0 }
};

export default ProfileGuru;