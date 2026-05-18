import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../api/firebase';
import { ref, onValue, get } from 'firebase/database'; 
import AdminLayout from '../../layouts/AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, TrendingUp, DollarSign, Clock, Wallet, 
  BarChart3, LineChart as LineChartIcon, Eye, X, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
  PieChart, Pie, Cell // TAMBAHAN UNTUK PIE CHART
} from 'recharts';

const DashboardAdmin = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  // --- STATE DATA ---
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersToday, setUsersToday] = useState(0);
  const [totalSiswa, setTotalSiswa] = useState(0); 
  const [loading, setLoading] = useState(true);
  
  // State Grafik
  const [dataUserBaru, setDataUserBaru] = useState([]);
  const [dataPembayaranMingguan, setDataPembayaranMingguan] = useState([]);
  const [dataJenjangSiswa, setDataJenjangSiswa] = useState([]); // STATE BARU UNTUK JENJANG
  
  // State Pendapatan
  const [totalUangPendaftaran, setTotalUangPendaftaran] = useState(0);
  const [totalUangBulanan, setTotalUangBulanan] = useState(0);
  
  const [historiPembayaran, setHistoriPembayaran] = useState([]);

  // State Modal Detail
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Warna Khusus untuk Jenjang Siswa
  const JENJANG_COLORS = ['#EF4444', '#3B82F6', '#8B5CF6']; // Merah (SD), Biru (SMP), Ungu (SMA)

  useEffect(() => {
    // 1. Ambil Data Users
    const userRef = ref(db, 'Users');
    const d = new Date();
    const todayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    const unsubUsers = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        setTotalUsers(list.length);
        const todayCount = list.filter(user => user.tanggal_daftar === todayStr).length;
        setUsersToday(todayCount);

        const countsByDate = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const labelDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
          const fullDate = `${labelDate}/${date.getFullYear()}`;
          countsByDate[fullDate] = { name: labelDate, users: 0 };
        }
        list.forEach(user => {
          if (user.tanggal_daftar && countsByDate[user.tanggal_daftar]) {
            countsByDate[user.tanggal_daftar].users += 1;
          }
        });
        setDataUserBaru(Object.values(countsByDate));
      }
    });

    // 2. Ambil Data Siswa (Termasuk perhitungan Jenjang)
    const siswaRef = ref(db, 'Siswa');
    const unsubSiswa = onValue(siswaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listSiswa = Object.values(data);
        setTotalSiswa(listSiswa.length);

        // Hitung Jenjang
        let sd = 0, smp = 0, sma = 0;
        listSiswa.forEach(siswa => {
          const jenjang = String(siswa.jenjang || '').toUpperCase();
          const namaKelas = String(siswa.nama_kelas || '').toUpperCase();

          if (jenjang === 'SD' || namaKelas.includes('SD')) sd++;
          else if (jenjang === 'SMP' || namaKelas.includes('SMP') || namaKelas.includes('VII') || namaKelas.includes('VIII') || namaKelas.includes('IX')) smp++;
          else if (jenjang === 'SMA' || namaKelas.includes('SMA') || namaKelas.includes('X') || namaKelas.includes('XI') || namaKelas.includes('XII')) sma++;
        });

        setDataJenjangSiswa([
          { name: 'SD', value: sd },
          { name: 'SMP', value: smp },
          { name: 'SMA', value: sma }
        ].filter(item => item.value > 0)); // Hanya tampilkan yang ada datanya

      } else {
        setTotalSiswa(0);
        setDataJenjangSiswa([]);
      }
    });

    // 3. Ambil Data Pembayaran Realtime 
    const pembayaranRef = ref(db, 'PembayaranLes');
    const unsubPay = onValue(pembayaranRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawList = Object.values(data);
        const pendSnap = await get(ref(db, 'PendaftaranLes'));
        const allPendaftaran = pendSnap.val() || {};

        let tPendaftaran = 0;
        let tBulanan = 0;
        
        const payStats = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const labelDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
          payStats[labelDate] = { name: labelDate, pendaftaran: 0, bulanan: 0 };
        }

        rawList.forEach(pay => {
          let jenis = String(pay.jenis || 'pendaftaran').toLowerCase();
          if (jenis === 'pembayaran') jenis = 'pendaftaran';

          let statusAsli = '';
          if (jenis === 'pendaftaran' && pay.pendaftaranId && allPendaftaran[pay.pendaftaranId]) {
            statusAsli = String(allPendaftaran[pay.pendaftaranId].status || '').toLowerCase();
          } else {
            statusAsli = String(pay.status || '').toLowerCase();
          }

          const isVerified = statusAsli === 'diterima' || statusAsli === 'lunas' || statusAsli === 'sukses' || statusAsli === '';
          if (!isVerified) return;

          const amount = Number(pay.jumlah_pembayaran) || Number(pay.nominal) || 0;

          if (jenis === 'bulanan') tBulanan += amount;
          else tPendaftaran += amount;

          let uploadTime = pay.tanggal_upload || pay.tanggal || pay.createdAt || Date.now();
          if (typeof uploadTime === 'string' && !isNaN(uploadTime)) uploadTime = Number(uploadTime); 

          const payDate = new Date(uploadTime);
          if (!isNaN(payDate.getTime())) {
            const labelDate = `${String(payDate.getDate()).padStart(2, '0')}/${String(payDate.getMonth() + 1).padStart(2, '0')}`;
            if (payStats[labelDate]) {
              if (jenis === 'bulanan') payStats[labelDate].bulanan += amount;
              else payStats[labelDate].pendaftaran += amount;
            }
          }
        });

        setTotalUangPendaftaran(tPendaftaran);
        setTotalUangBulanan(tBulanan);
        setDataPembayaranMingguan(Object.values(payStats));

        // Ambil 5 Transaksi Terbaru
        const sortedRaw = rawList.sort((a, b) => {
           const timeA = Number(a.tanggal_upload || a.tanggal || 0);
           const timeB = Number(b.tanggal_upload || b.tanggal || 0);
           return timeB - timeA;
        }).slice(0, 5); 
        
        const detailedList = sortedRaw.map((pay) => {
          let namaSiswa = 'User Tidak Dikenal';
          if (pay.pendaftaranId && allPendaftaran[pay.pendaftaranId]) {
            namaSiswa = allPendaftaran[pay.pendaftaranId].nama_siswa || pay.nama_user || namaSiswa;
          } else if (pay.nama_user) {
            namaSiswa = pay.nama_user;
          }
          return { ...pay, nama_siswa: namaSiswa };
        });
        
        setHistoriPembayaran(detailedList);
      }
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubSiswa();
      unsubPay();
    };
  }, []);

  const formatYAxis = (tickItem) => {
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}K`;
    return tickItem;
  };

  const styles = {
    container: { padding: '20px', width: '100%', boxSizing: 'border-box' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' },
    card: { backgroundColor: colors.cardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${colors.border}`, color: colors.textPrimary, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    labelHeader: { color: colors.textMuted, fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '10px', display: 'block', textTransform: 'uppercase' },
    sectionTitle: { fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }
  };

  return (
    <AdminLayout title="Pusat Kendali Admin">
      <div style={styles.container}>
        
        {/* ---- KARTU STATISTIK ---- */}
        <div style={styles.statsGrid}>
          <div style={styles.card}>
            <span style={styles.labelHeader}>TOTAL USER AKUN</span>
            <div style={{fontSize: '28px', fontWeight: '900'}}>
              {loading ? "..." : totalUsers} 
              {usersToday > 0 && <span style={{fontSize: '14px', color: '#10B981', marginLeft: '8px'}}>+{usersToday}</span>}
            </div>
            <Users size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>
          
          <div style={styles.card}>
            <span style={styles.labelHeader}>TOTAL DATA SISWA</span>
            <div style={{fontSize: '28px', fontWeight: '900', color: colors.primary}}>
              {loading ? "..." : totalSiswa}
            </div>
            <TrendingUp size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>

          <div style={styles.card}>
            <span style={styles.labelHeader}>PENDAPATAN (PENDAFTARAN)</span>
            <div style={{fontSize: '22px', fontWeight: '900', color: colors.primary}}>
               Rp {totalUangPendaftaran.toLocaleString('id-ID')}
            </div>
            <Wallet size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>

          <div style={styles.card}>
            <span style={styles.labelHeader}>PENDAPATAN (BULANAN)</span>
            <div style={{fontSize: '22px', fontWeight: '900', color: '#10B981'}}>
               Rp {totalUangBulanan.toLocaleString('id-ID')}
            </div>
            <DollarSign size={40} style={{position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1}} />
          </div>
        </div>

        {/* ---- BAGIAN GRAFIK ATAS (Pendapatan & User Baru) ---- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '25px' }}>
          
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><BarChart3 size={18} color="#10B981"/> Grafik Pendapatan (7 Hari Terakhir)</h3>
            <div style={{ width: '100%', height: 250, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPembayaranMingguan}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} />
                  <YAxis stroke={colors.textMuted} fontSize={10} tickFormatter={formatYAxis} />
                  <Tooltip 
                    formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`]} 
                    contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                  <Bar dataKey="pendaftaran" name="Pendaftaran" fill={colors.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bulanan" name="Bulanan" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* Grafik Area User Baru */}
              <div style={{...styles.card, flex: 1}}>
                <h3 style={styles.sectionTitle}><LineChartIcon size={18} color={colors.primary}/> Aktivitas Pendaftaran Akun</h3>
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dataUserBaru}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                      <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} />
                      <YAxis stroke={colors.textMuted} fontSize={10} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="users" name="User Baru" stroke={colors.primary} fillOpacity={0.3} fill={colors.primary} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grafik Pie Data Jenjang Siswa */}
              <div style={{...styles.card, flex: 1}}>
                 <h3 style={styles.sectionTitle}><PieChartIcon size={18} color="#8B5CF6"/> Distribusi Jenjang Siswa</h3>
                 {dataJenjangSiswa.length > 0 ? (
                    <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataJenjangSiswa}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dataJenjangSiswa.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={JENJANG_COLORS[index % JENJANG_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: '12px' }} 
                                    itemStyle={{ color: colors.textPrimary, fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ width: '50%', paddingLeft: '10px' }}>
                            {dataJenjangSiswa.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: JENJANG_COLORS[idx % JENJANG_COLORS.length], marginRight: '10px' }}></div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>JENJANG {item.name}</div>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: colors.textPrimary }}>{item.value} <span style={{fontSize: '11px', fontWeight:'normal'}}>Siswa</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 ) : (
                    <div style={{height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, fontSize: '13px', fontWeight: '600'}}>Belum ada data siswa</div>
                 )}
              </div>
          </div>
        </div>

        {/* ---- TABEL TRANSAKSI TERBARU ---- */}
        <div style={{...styles.card, marginBottom: '25px'}}>
          <h3 style={styles.sectionTitle}><Clock size={18} color={colors.primary} /> Konfirmasi Pembayaran Terbaru (5 Data Terakhir)</h3>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{textAlign: 'left', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', color: colors.textMuted}}>
                  <th style={{padding: '12px 8px'}}>NAMA SISWA</th>
                  <th style={{padding: '12px 8px'}}>KATEGORI</th>
                  <th style={{padding: '12px 8px'}}>WAKTU UPLOAD</th>
                  <th style={{padding: '12px 8px'}}>JUMLAH</th>
                  <th style={{padding: '12px 8px', textAlign: 'center'}}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {historiPembayaran.map((row, i) => {
                   const rawDate = row.tanggal_upload || row.tanggal || Date.now();
                   const validDate = typeof rawDate === 'string' && !isNaN(rawDate) ? Number(rawDate) : rawDate;
                   
                   return (
                      <tr key={i} style={{borderBottom: `1px solid ${colors.border}`, fontSize: '14px'}}>
                        <td style={{padding: '15px 8px'}}>
                            <div style={{fontWeight: '700', color: colors.textPrimary}}>{row.nama_siswa}</div>
                        </td>
                        <td style={{padding: '15px 8px'}}>
                            <span style={{ 
                              padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                              backgroundColor: (row.jenis === 'bulanan') ? '#10B98115' : colors.primary + '15',
                              color: (row.jenis === 'bulanan') ? '#10B981' : colors.primary 
                            }}>
                              {row.jenis || 'PENDAFTARAN'}
                            </span>
                        </td>
                        <td style={{padding: '15px 8px'}}>
                            <div style={{fontWeight: '600'}}>{new Date(validDate).toLocaleDateString('id-ID')}</div>
                            <div style={{fontSize: '11px', color: colors.textMuted}}>{new Date(validDate).toLocaleTimeString('id-ID')}</div>
                        </td>
                        <td style={{padding: '15px 8px', fontWeight: '800', color: '#10B981'}}>
                            Rp {Number(row.jumlah_pembayaran || row.nominal || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{padding: '15px 8px', textAlign: 'center'}}>
                            <button 
                              onClick={() => { setSelectedData(row); setIsModalOpen(true); }}
                              style={{padding: '8px 12px', backgroundColor: colors.primary + '15', color: colors.primary, border: `1px solid ${colors.primary}50`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', transition: 'all 0.2s ease'}}
                            >
                              <Eye size={14} /> <span style={{fontSize: '11px', fontWeight: '800'}}>CEK</span>
                            </button>
                        </td>
                      </tr>
                   );
                })}
                {historiPembayaran.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                      Belum ada transaksi pembayaran terbaru
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---- MODAL DETAIL TRANSAKSI ---- */}
      {isModalOpen && selectedData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.cardBg, padding: '32px', borderRadius: '28px', width: '100%', maxWidth: selectedData.foto_bukti ? '700px' : '450px', border: `1px solid ${colors.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.textPrimary, fontSize: '22px', fontWeight: '900' }}>Ringkasan Transaksi</h3>
                <div style={{marginTop: '8px'}}>
                  <span style={{ 
                      padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                      backgroundColor: (selectedData.jenis === 'bulanan') ? '#10B98115' : colors.primary + '15',
                      color: (selectedData.jenis === 'bulanan') ? '#10B981' : colors.primary 
                  }}>
                    KATEGORI: {selectedData.jenis || 'PENDAFTARAN'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
                <X size={24} color={colors.textMuted} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: selectedData.foto_bukti ? '1.2fr 1fr' : '1fr', gap: '30px' }}>
              
              <div style={{ color: colors.textPrimary }}>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '15px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Siswa</label>
                    <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: '800' }}>{selectedData.nama_siswa}</p>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Tanggal Transaksi</label>
                    <p style={{ margin: '4px 0', fontWeight: '700', fontSize: '15px' }}>
                      {new Date(Number(selectedData.tanggal_upload || selectedData.tanggal || Date.now())).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#10B98108', borderRadius: '16px', border: '2px dashed #10B98150' }}>
                    <label style={{ fontSize: '10px', fontWeight: '900', color: '#10B981', textTransform: 'uppercase' }}>Total Nominal</label>
                    <p style={{ margin: '4px 0', fontWeight: '900', color: '#10B981', fontSize: '28px' }}>
                      Rp {Number(selectedData.jumlah_pembayaran || selectedData.nominal || 0).toLocaleString('id-ID')}
                    </p>
                </div>
              </div>

              {selectedData.foto_bukti && (
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Bukti Pembayaran</label>
                  <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${colors.border}`, backgroundColor: '#000' }}>
                    <img 
                      src={selectedData.foto_bukti} 
                      alt="Bukti Transaksi" 
                      style={{ width: '100%', height: '240px', objectFit: 'contain' }} 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Gambar+Gagal+Dimuat' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ padding: '14px 24px', backgroundColor: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
              >
                TUTUP
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default DashboardAdmin;