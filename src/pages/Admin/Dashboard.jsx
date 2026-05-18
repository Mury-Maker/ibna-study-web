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
  PieChart, Pie, Cell 
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
  const [dataJenjangSiswa, setDataJenjangSiswa] = useState([]); 
  
  // State Pendapatan
  const [totalUangPendaftaran, setTotalUangPendaftaran] = useState(0);
  const [totalUangBulanan, setTotalUangBulanan] = useState(0);
  
  const [historiPembayaran, setHistoriPembayaran] = useState([]);

  // Warna Khusus untuk Jenjang Siswa
  const JENJANG_COLORS = ['#EF4444', '#3B82F6', '#8B5CF6']; 

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

    // 2. Ambil Data Siswa
    const siswaRef = ref(db, 'Siswa');
    const unsubSiswa = onValue(siswaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listSiswa = Object.values(data);
        setTotalSiswa(listSiswa.length);

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
        ].filter(item => item.value > 0)); 

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
        const siswaSnap = await get(ref(db, 'Siswa'));
        const allSiswa = siswaSnap.val() || {};

        let tPendaftaran = 0;
        let tBulanan = 0;
        
        const payStats = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const labelDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
          payStats[labelDate] = { name: labelDate, pendaftaran: 0, bulanan: 0, details: [] };
        }

        // =========================================================================
        // STEP 1: PENGELOMPOKKAN & SELEKSI KETAT DATA GANDA (DITERIMA VS DITOLAK)
        // =========================================================================
        const groupedByPendaftaran = {};

        rawList.forEach(pay => {
          // Validasi data kotor dasar (harus berupa objek utuh & memiliki nominal/waktu)
          if (!pay || typeof pay !== 'object' || Object.keys(pay).length <= 2) return;
          const amount = Number(pay.jumlah_pembayaran) || Number(pay.nominal) || 0;
          const hasTime = pay.tanggal_upload || pay.tanggal || pay.createdAt;
          if (amount === 0 || !hasTime) return;

          let jenis = String(pay.jenis || 'pendaftaran').toLowerCase();
          if (jenis === 'pembayaran') jenis = 'pendaftaran';

          // Dapatkan status asli transaksi
          let statusPay = String(pay.status || '').toLowerCase();
          if (statusPay === '' && jenis === 'pendaftaran' && pay.pendaftaranId && allPendaftaran[pay.pendaftaranId]) {
            statusPay = String(allPendaftaran[pay.pendaftaranId].status || '').toLowerCase();
          }

          // Simpan status bersih ke objek pay untuk mempermudah pengecekan berikutnya
          pay.cleanStatus = statusPay;

          // Jika ini kategori pendaftaran les dan memiliki pendaftaranId
          if (jenis === 'pendaftaran' && pay.pendaftaranId) {
            const pid = pay.pendaftaranId;

            if (!groupedByPendaftaran[pid]) {
              groupedByPendaftaran[pid] = [];
            }
            groupedByPendaftaran[pid].push(pay);
          } else {
            // Untuk pembayaran bulanan atau yang tidak memiliki pendaftaranId, buat key unik sendiri agar tidak bertabrakan
            const uniqueId = pay.id || `BULANAN-${Math.random()}`;
            groupedByPendaftaran[uniqueId] = [pay];
          }
        });

        // =========================================================================
        // STEP 2: AMBIL HANYA YANG DITERIMA JIKA ADA DATA DITOLAK PADA ID YANG SAMA
        // =========================================================================
        const verifiedPayments = [];

        Object.values(groupedByPendaftaran).forEach(payments => {
          // Cari apakah di dalam grup pendaftaran ID yang sama ini ada data yang berstatus sukses/diterima/lunas
          const acceptedPay = payments.find(p => p.cleanStatus === 'diterima' || p.cleanStatus === 'lunas' || p.cleanStatus === 'sukses');

          if (acceptedPay) {
            // Jika ditemukan yang diterima, masukkan data yang diterima ini saja (Data ditolak otomatis dibuang)
            verifiedPayments.push(acceptedPay);
          } 
          // Jika di grup tersebut tidak ada satu pun yang diterima (misal hanya ada satu data dan statusnya Ditolak),
          // maka otomatis tidak dimasukkan ke verifiedPayments karena aturan Anda hanya memproses yang berstatus diterima.
        });

        // ====== PROSES DATA GRAFIK ======
        verifiedPayments.forEach(pay => {
          let jenis = String(pay.jenis || 'pendaftaran').toLowerCase();
          if (jenis === 'pembayaran') jenis = 'pendaftaran';

          const amount = Number(pay.jumlah_pembayaran) || Number(pay.nominal) || 0;

          let namaSiswa = 'Siswa Tidak Dikenal';
          let jenjang = 'Lainnya';
          let kelas = 'Lainnya';
          
          if (pay.pendaftaranId && allPendaftaran[pay.pendaftaranId]) {
            namaSiswa = allPendaftaran[pay.pendaftaranId].nama_siswa || pay.nama_user || namaSiswa;
            jenjang = allPendaftaran[pay.pendaftaranId].jenjang || jenjang;
            kelas = allPendaftaran[pay.pendaftaranId].nama_kelas || allPendaftaran[pay.pendaftaranId].kelas || kelas;
          } else if (pay.siswaId && allSiswa[pay.siswaId]) {
            namaSiswa = allSiswa[pay.siswaId].nama_siswa || pay.nama_user || namaSiswa;
            jenjang = allSiswa[pay.siswaId].jenjang || jenjang;
            kelas = allSiswa[pay.siswaId].nama_kelas || allSiswa[pay.siswaId].kelas || kelas;
          } else {
            namaSiswa = pay.nama_user || pay.nama_siswa || namaSiswa;
            jenjang = pay.jenjang || jenjang;
            kelas = pay.nama_kelas || pay.kelas || kelas;
          }

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
              
              payStats[labelDate].details.push({
                nama: namaSiswa,
                kelas: `${String(jenjang).toUpperCase()} - ${String(kelas).toUpperCase()}`,
                nominal: amount,
                jenis: jenis
              });
            }
          }
        });

        setTotalUangPendaftaran(tPendaftaran);
        setTotalUangBulanan(tBulanan);
        setDataPembayaranMingguan(Object.values(payStats));

        // ====== PROSES DATA TABEL (Hanya menampilkan data yang lolos seleksi Diterima) ======
        const sortedVerified = verifiedPayments.sort((a, b) => {
           const timeA = Number(a.tanggal_upload || a.tanggal || 0);
           const timeB = Number(b.tanggal_upload || b.tanggal || 0);
           return timeB - timeA;
        }).slice(0, 5); 
        
        const detailedList = sortedVerified.map((pay) => {
          let nSiswa = 'Siswa Tidak Dikenal';
          if (pay.pendaftaranId && allPendaftaran[pay.pendaftaranId]) {
            nSiswa = allPendaftaran[pay.pendaftaranId].nama_siswa || pay.nama_user || nSiswa;
          } else if (pay.nama_user) {
            nSiswa = pay.nama_user;
          }
          return { ...pay, nama_siswa: nSiswa };
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

  const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: colors.cardBg, 
          border: `1px solid ${colors.border}`, 
          borderRadius: '12px', 
          padding: '15px', 
          color: colors.textPrimary, 
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          minWidth: '220px'
        }}>
          <div style={{ fontWeight: '900', marginBottom: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '6px', fontSize: '13px' }}>Tanggal {label}</div>
          <div style={{ fontSize: '12px', color: colors.primary, fontWeight: '800', marginBottom: '4px' }}>Pendaftaran: Rp {data.pendaftaran.toLocaleString('id-ID')}</div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '800', marginBottom: '10px' }}>Bulanan: Rp {data.bulanan.toLocaleString('id-ID')}</div>
          
          {data.details && data.details.length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${colors.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>Detail Transaksi:</div>
              {data.details.map((trx, idx) => (
                 <div key={idx} style={{ 
                   fontSize: '11px', 
                   display: 'flex', 
                   flexDirection: 'column', 
                   marginBottom: '6px', 
                   backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                   padding: '8px', 
                   borderRadius: '6px' 
                 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'center' }}>
                     <span style={{ fontWeight: '800' }}>{trx.nama}</span>
                     <span style={{ fontWeight: '900', color: trx.jenis === 'bulanan' ? '#10B981' : colors.primary }}>
                       Rp {trx.nominal.toLocaleString('id-ID')}
                     </span>
                   </div>
                   <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '4px', fontWeight: '600' }}>
                     {trx.kelas} • <span style={{ textTransform: 'capitalize'}}>{trx.jenis}</span>
                   </div>
                 </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
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
            <span style={styles.labelHeader}>TOTAL PENGGUNA</span>
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

        {/* ---- BAGIAN GRAFIK ATAS ---- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '25px' }}>
          
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><BarChart3 size={18} color="#10B981"/> Grafik Pendapatan (7 Hari Terakhir)</h3>
            <div style={{ width: '100%', height: 250, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPembayaranMingguan}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="name" stroke={colors.textMuted} fontSize={10} />
                  <YAxis stroke={colors.textMuted} fontSize={10} tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltipBar />} cursor={{fill: isDarkMode ? '#334155' : '#f1f5f9'}} />
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
                      </tr>
                   );
                })}
                {historiPembayaran.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                      Belum ada transaksi pembayaran terbaru
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardAdmin;