import React, { useState } from 'react';
import { auth, db } from '../../api/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Sun, Moon, Eye, EyeOff } from 'lucide-react'; 
import { useTheme } from '../../context/ThemeContext'; 
import logoLogin from '../../assets/logoLogin.png'; 
import flayerLogin from '../../assets/flayerLogin.png'; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State untuk mata
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const { colors, isDarkMode, toggleTheme } = useTheme(); 

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
      } else { 
        setError("User tidak ditemukan di database!"); 
      }
    } catch (err) { 
      setError("Email atau Password salah!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const styles = {
    container: { 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: colors.contentBg, 
      overflow: 'hidden', 
      fontFamily: 'sans-serif',
      position: 'relative',
      transition: 'background-color 0.3s ease'
    },
    themeToggle: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 100,
      padding: '10px',
      borderRadius: '50%',
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textPrimary,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
      outline: 'none', // Hapus outline
    },
    leftSide: { 
      flex: 1.2, 
      backgroundColor: colors.primary, 
      display: 'flex',
      height: '100%',
      overflow: 'hidden'
    },
    rightSide: { 
      flex: 1, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: colors.contentBg,
      transition: 'background-color 0.3s ease'
    },
    brandImg: { 
      width: '100%', 
      height: '100%', 
      objectFit: 'cover',
      display: 'block'
    },
    loginBox: { 
      width: '100%', 
      maxWidth: '400px', 
      textAlign: 'center', 
      padding: '40px 30px' 
    },
    logoContainer: {
      width: '220px', 
      margin: '0 auto 20px auto',
      outline: 'none', // Hapus outline di logo container
      userSelect: 'none' // Agar logo tidak bisa di-highlight biru
    },
    logoImg: {
      width: '100%',
      height: 'auto',
      objectFit: 'contain',
      outline: 'none', // Hapus outline di image
      filter: isDarkMode 
        ? 'drop-shadow(0 0 2px #ffffff)'
        : 'drop-shadow(0 0 0px #000000)'
    },
    inputGroup: { 
      display: 'flex', 
      alignItems: 'center', 
      border: `1px solid ${colors.border}`, 
      borderRadius: '8px', 
      padding: '12px 16px', 
      marginBottom: '16px',
      backgroundColor: colors.cardBg,
      transition: 'all 0.3s ease',
      position: 'relative'
    },
    input: { 
      border: 'none', 
      outline: 'none', 
      width: '100%', 
      fontSize: '15px',
      marginLeft: '10px',
      backgroundColor: 'transparent',
      color: colors.textPrimary 
    },
    eyeIcon: {
      cursor: 'pointer',
      color: colors.textMuted,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '10px',
      transition: 'opacity 0.2s',
      userSelect: 'none'
    },
    button: { 
      width: '100%',
      padding: '14px', 
      backgroundColor: colors.primary, 
      color: '#ffffff', 
      border: 'none', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      fontWeight: 'bold',
      fontSize: '16px',
      marginTop: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.3s ease',
      outline: 'none'
    }
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={toggleTheme} 
        style={styles.themeToggle}
        className="theme-btn"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="left-side" style={styles.leftSide}>
        <img src={flayerLogin} alt="Flayer" style={styles.brandImg} />
      </div>

      <div style={styles.rightSide}>
        <div style={styles.loginBox}>
          <div style={styles.logoContainer}>
            <img src={logoLogin} alt="Logo" style={styles.logoImg} />
          </div>
          
          <h2 style={{color: colors.primary, margin: '0 0 8px 0', fontSize: '26px', fontWeight: '800'}}>Selamat Datang</h2>
          <p style={{fontSize: '15px', color: colors.textMuted, marginBottom: '35px'}}>Silakan masuk ke akun Anda</p>
          
          {error && <div style={{...styles.errorBox, backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px'}}>{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <Mail size={20} color={colors.textMuted} />
              <input 
                type="email" 
                placeholder="Alamat Email" 
                style={styles.input} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div style={styles.inputGroup}>
              <Lock size={20} color={colors.textMuted} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Kata Sandi" 
                style={styles.input} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div 
                style={styles.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.button} className="login-btn">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memproses...</span>
                </>
              ) : "Masuk Sekarang"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px ${colors.cardBg} inset !important;
          -webkit-text-fill-color: ${colors.textPrimary} !important;
        }

        .login-btn:disabled {
          background-color: ${colors.primary} !important;
          opacity: 0.7 !important;
        }

        /* Hilangkan box biru/outline saat diklik pada elemen tertentu */
        button:focus, img:focus, div:focus {
          outline: none !important;
        }

        @media (max-width: 900px) {
          .left-side { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;