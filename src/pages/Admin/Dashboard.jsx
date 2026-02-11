import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, TrendingUp, DollarSign, Clock, Wallet, 
  ChevronRight, BarChart3, LineChart as LineChartIcon, ArrowUpRight 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const DashboardAdmin = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  // DATA DUMMY UNTUK GRAFIK KEUANGAN & USER
  const dataPendapatan = [
    { name: 'Jan', daftar: 4000, bulanan: 2400 },
    { name: 'Feb', daftar: 3000, bulanan: 1398 },
    { name: 'Mar', daftar: 2000, bulanan: 9800 },
    { name: 'Apr', daftar: 2780, bulanan: 3908 },
    { name: 'Mei', daftar: 1890, bulanan: 4800 },
  ];

  const dataUserBaru = [
    { name: 'Mng 1', users: 12 }, { name: 'Mng 2', users: 19 },
    { name: 'Mng 3', users: 15 }, { name: 'Mng 4', users: 22 },
  ];

  const styles = {
    container: { padding: '20px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease' },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '20px',
      marginBottom: '25px'
    },
    card: { 
      backgroundColor: colors.cardBg, 
      padding: '20px', 
      borderRadius: '16px', 
      border: `1px solid ${colors.border}`, 
      color: colors.textPrimary,
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    },
    labelHeader: {
      color: colors.textMuted,
      fontSize: '11px', 
      fontWeight: '800',
      letterSpacing: '1px',
      marginBottom: '10px',
      display: 'block'
    },
    sectionTitle: {
      fontSize: '15px', 
      fontWeight: '800', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      margin: '0 0 20px 0'
    }
  };

  return (
    <AdminLayout title="Pusat Kendali Admin">
      <div style={styles.container}>
        
        {/* TOP METRICS: USER & PENDAFTARAN */}
        <div style={styles.statsGrid}>
          <div style={styles.card}>
            <span style={styles.labelHeader}>USER LOGIN (HARI INI)</span>
            <div style={{fontSize: '28px', fontWeight: '900'}}>42 <span style={{fontSize: '14px', color: '#10B981'}}>+5</span></div>
            <Users size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>
          
          <div style={styles.card}>
            <span style={styles.labelHeader}>TOTAL PENDAFTAR LES</span>
            <div style={{fontSize: '28px', fontWeight: '900', color: colors.primary}}>156</div>
            <TrendingUp size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>

          <div style={styles.card}>
            <span style={styles.labelHeader}>UANG PENDAFTARAN</span>
            <div style={{fontSize: '22px', fontWeight: '900', color: '#10B981'}}>Rp 4.500.000</div>
            <Wallet size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>

          <div style={styles.card}>
            <span style={styles.labelHeader}>UANG BULANAN</span>
            <div style={{fontSize: '22px', fontWeight: '900', color: '#6366F1'}}>Rp 12.850.000</div>
            <DollarSign size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>
        </div>

        {/* GRAPHS SECTION: PERTUMBUHAN USER & KEUANGAN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '25px' }}>
          
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><LineChartIcon size={18} color={colors.primary}/> Analisis Keuangan (Daftar vs Bulanan)</h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPendapatan}>
                  <defs>
                    <linearGradient id="colorDaftar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} axisLine={false} />
                  <YAxis stroke={colors.textMuted} fontSize={10} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="daftar" stroke={colors.primary} fillOpacity={1} fill="url(#colorDaftar)" />
                  <Area type="monotone" dataKey="bulanan" stroke="#10B981" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><BarChart3 size={18} color="#FACC15"/> Pertumbuhan Siswa Baru (Mingguan)</h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataUserBaru}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} axisLine={false} />
                  <YAxis stroke={colors.textMuted} fontSize={10} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }} />
                  <Bar dataKey="users" fill={colors.primary} radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PAYMENT HISTORY TABLE */}
        <div style={{...styles.card, marginBottom: '25px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
            <h3 style={{...styles.sectionTitle, marginBottom: 0}}>
              <Clock size={18} color={colors.primary} /> Histori Pembayaran Terbaru
            </h3>
            <button style={{background: 'none', border: 'none', color: colors.primary, fontSize: '12px', fontWeight: '800', cursor: 'pointer'}}>DOWNLOAD LAPORAN</button>
          </div>
          
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', color: colors.textMuted}}>
                  <th style={{padding: '12px 8px'}}>SISWA</th>
                  <th style={{padding: '12px 8px'}}>JENIS</th>
                  <th style={{padding: '12px 8px'}}>JUMLAH</th>
                  <th style={{padding: '12px 8px'}}>TANGGAL</th>
                  <th style={{padding: '12px 8px'}}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nama: 'Farid Febriansyah', jenis: 'Bulanan', jumlah: 'Rp 350.000', tgl: '20 Jan 2026', status: 'Sukses' },
                  { nama: 'Budi Santoso', jenis: 'Pendaftaran', jumlah: 'Rp 150.000', tgl: '19 Jan 2026', status: 'Sukses' },
                  { nama: 'Siti Aminah', jenis: 'Bulanan', jumlah: 'Rp 350.000', tgl: '18 Jan 2026', status: 'Pending' },
                ].map((row, i) => (
                  <tr key={i} style={{borderBottom: `1px solid ${colors.border}`, fontSize: '14px'}}>
                    <td style={{padding: '15px 8px', fontWeight: '700'}}>{row.nama}</td>
                    <td style={{padding: '15px 8px'}}>{row.jenis}</td>
                    <td style={{padding: '15px 8px', fontWeight: '800', color: '#10B981'}}>{row.jumlah}</td>
                    <td style={{padding: '15px 8px', fontSize: '12px', color: colors.textMuted}}>{row.tgl}</td>
                    <td style={{padding: '15px 8px'}}>
                      <span style={{ 
                        fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px',
                        backgroundColor: row.status === 'Sukses' ? '#10B98120' : '#FACC1520',
                        color: row.status === 'Sukses' ? '#10B981' : '#B45309'
                      }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK ACTIONS FOR ADMIN */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
          <div style={{...styles.card, cursor: 'pointer', transition: '0.2s'}} onClick={() => navigate('/Admin/ManajemenUser')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h4 style={{margin: '0 0 5px 0'}}>Manajemen User</h4>
                <p style={{margin: 0, fontSize: '12px', color: colors.textMuted}}>Kelola akses guru dan pendaftaran siswa</p>
              </div>
              <ArrowUpRight size={20} color={colors.primary} />
            </div>
          </div>
          
          <div style={{...styles.card, cursor: 'pointer', transition: '0.2s'}} onClick={() => navigate('/Admin/KelolaPaket')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h4 style={{margin: '0 0 5px 0'}}>Harga & Paket Les</h4>
                <p style={{margin: 0, fontSize: '12px', color: colors.textMuted}}>Update biaya pendaftaran dan kursus bulanan</p>
              </div>
              <ArrowUpRight size={20} color={colors.primary} />
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default DashboardAdmin;