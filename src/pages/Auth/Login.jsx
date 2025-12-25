import React, { useState } from 'react';
import { auth, db } from '../../api/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { theme } from '../../styles/theme';
import logoLogin from '../../assets/logoLogin.png'; 
import flayerLogin from '../../assets/flayerLogin.png'; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const snapshot = await get(ref(db, `Users/${userCredential.user.uid}`));
      if (snapshot.exists()) {
        const role = snapshot.val().role;
        if (role === "Admin") navigate('/admin/dashboard');
        else if (role === "Guru") navigate('/Guru/Dashboard');
      } else { setError("User tidak ditemukan di DB!"); }
    } catch (err) { setError("Email/Password salah!"); } 
    finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <div className="left-side" style={styles.leftSide}>
        <div style={styles.brandWrapper}>
          <img src={flayerLogin} alt="IBNA STUDY" style={styles.brandImg} />
        </div>
      </div>
      <div style={styles.rightSide}>
        <div style={styles.loginBox}>
          <img src={logoLogin} alt="Logo" style={{width: '120px', marginBottom: '10px'}} />
          <h2 style={{color: theme.colors.primary, margin: '0 0 10px 0'}}>Selamat Datang</h2>
          <p style={{fontSize: '14px', color: theme.colors.textMuted, marginBottom: '30px'}}>Sistem Informasi IBNA STUDY</p>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}><Mail size={18} color={theme.colors.textMuted} style={{marginRight: '10px'}} />
              <input type="email" placeholder="Email" style={styles.input} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={styles.inputGroup}><Lock size={18} color={theme.colors.textMuted} style={{marginRight: '10px'}} />
              <input type="password" placeholder="Password" style={styles.input} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; } @media (max-width: 850px) { .left-side { display: none !important; } }`}</style>
    </div>
  );
};

const styles = {
  container: { display: 'flex', width: '100vw', height: '100vh', backgroundColor: theme.colors.white, overflow: 'hidden', fontFamily: 'sans-serif' },
  leftSide: { flex: 1.2, backgroundColor: theme.colors.background, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  rightSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  brandImg: { width: '80%', maxWidth: '400px', objectFit: 'contain' },
  loginBox: { width: '100%', maxWidth: '350px', textAlign: 'center', padding: '20px' },
  inputGroup: { display: 'flex', alignItems: 'center', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', padding: '12px', marginBottom: '15px' },
  input: { border: 'none', outline: 'none', width: '100%', fontSize: '16px' },
  button: { padding: '12px', backgroundColor: theme.colors.primary, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  errorBox: { backgroundColor: '#fee2e2', color: theme.colors.danger, padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }
};

export default Login;