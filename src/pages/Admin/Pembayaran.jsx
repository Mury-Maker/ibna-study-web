import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { ref, onValue, update, push, get } from 'firebase/database';
import { 
  CheckCircle, Clock, Eye, X, CreditCard, CalendarDays, 
  TrendingUp, DollarSign, Download, ChevronLeft, ChevronRight,
  AlertCircle, AlertTriangle, XCircle, Search 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AdminLayout from '../../layouts/AdminLayout';

// IMPORT UNTUK PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminVerifikasiPembayaran = () => {
  const { colors, isDarkMode } = useTheme();
  const [daftarPembayaran, setDaftarPembayaran] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingProcess, setIsLoadingProcess] = useState(false);
  
  // --- STATE NOTIFIKASI & MODAL CUSTOM ---
  const [notif, setNotif] = useState({ show: false, message: '', type: 'success' });
  const [approveModal, setApproveModal] = useState({ show: false, data: null });
  const [rejectModal, setRejectModal] = useState({ show: false, data: null, reason: '' });

  // State Filter & Pencarian
  const [activeTab, setActiveTab] = useState('pending'); 
  const [filterJenis, setFilterJenis] = useState('semua');
  const [filterJenjang, setFilterJenjang] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchName, setSearchName] = useState(''); 

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fungsi Pemicu Notifikasi Melayang (Toast)
  const pemicuNotif = (message, type = 'success') => {
    setNotif({ show: true, message, type });
    setTimeout(() => {
      setNotif({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Fungsi Parser Waktu Aman
  const parseTime = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const strVal = String(val);
    if (/^\d+$/.test(strVal)) return Number(strVal);
    const d = new Date(val).getTime();
    return isNaN(d) ? 0 : d;
  };

  useEffect(() => {
    const pembayaranRef = ref(db, 'PembayaranLes');
    const unsubscribe = onValue(pembayaranRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = await Promise.all(
          Object.keys(data).map(async (key) => {
            const pembayaran = data[key];
            let pendaftaranData = {};

            if (pembayaran.pendaftaranId) {
              const pendaftaranSnap = await get(ref(db, `PendaftaranLes/${pembayaran.pendaftaranId}`));
              pendaftaranData = pendaftaranSnap.val() || {};
            }

            let jenjangOtomatis = pendaftaranData.jenjang || pembayaran.jenjang || '-';
            const namaKelas = (pendaftaranData.nama_kelas || pembayaran.nama_kelas || '').toUpperCase();
            
            if (jenjangOtomatis === '-' || !jenjangOtomatis) {
              if (namaKelas.includes('X') || namaKelas.includes('SMA')) jenjangOtomatis = 'SMA';
              else if (namaKelas.includes('VII') || namaKelas.includes('SMP')) jenjangOtomatis = 'SMP';
              else if (namaKelas.includes('SD')) jenjangOtomatis = 'SD';
            }

            // Ambil Nama Siswa
            let namaSiswaFix = pembayaran.nama_siswa || pembayaran.nama_user || pendaftaranData.nama_siswa || pendaftaranData.nama_user || null;
            if (!namaSiswaFix && pembayaran.userId) {
                const userSnap = await get(ref(db, `Users/${pembayaran.userId}`));
                if (userSnap.exists()) {
                    namaSiswaFix = userSnap.val().nama || userSnap.val().nama_lengkap || userSnap.val().username;
                }
            }

            const jenisPembayaran = pembayaran.jenis === 'pembayaran' ? 'pendaftaran' : (pembayaran.jenis || 'pendaftaran');
            const statusSaatIni = pembayaran.status || pendaftaranData.status || 'Pending';
            
            const statusStr = String(statusSaatIni).trim().toLowerCase();
            const isVerified = ['diterima', 'lunas', 'sukses'].includes(statusStr);
            const isRejected = statusStr === 'ditolak';

            const timestamp = parseTime(pembayaran.tanggal_upload || pembayaran.tanggal || pembayaran.createdAt);

            return {
              id: key,
              ...pembayaran,
              userId: pembayaran.userId || pendaftaranData.userId || null,
              nama_siswa: namaSiswaFix || 'Tanpa Nama',
              namaOrtu: pembayaran.namaOrtu || pendaftaranData.namaOrtu || '-',
              noHpOrtu: pembayaran.noHpOrtu || pendaftaranData.noHpOrtu || '-',
              nama_kelas: pembayaran.nama_kelas || pendaftaranData.nama_kelas || '-',
              jenjang: jenjangOtomatis,
              nama_paket: pembayaran.nama_paket || pendaftaranData.nama_paket || '-',
              bulan_dibayar: pembayaran.bulan || pembayaran.bulanDibayar || pembayaran.bulan_dibayar || '-',
              jumlah_pembayaran: Number(pembayaran.jumlah_pembayaran || pembayaran.nominal || 0),
              status_pembayaran: statusSaatIni,
              catatan_admin: pembayaran.catatan_admin || pendaftaranData.catatan_admin || '',
              jenis: jenisPembayaran,
              timestamp: timestamp, 
              isVerified: isVerified,
              isRejected: isRejected,
              // === TAMBAHAN: Ambil classId & packageId/paketId ===
              classId: pembayaran.classId || pendaftaranData.classId || '',
              paketId: pembayaran.paketId || pendaftaranData.paketId || pembayaran.packageId || pendaftaranData.packageId || ''
            };
          })
        );

        // LOGIKA DEDUPLIKASI CERDAS
        const uniqueData = new Map();
        
        list.forEach(item => {
          let keyUnik = item.id; 
          const statusGroup = item.isRejected ? 'ditolak' : (item.isVerified ? 'diterima' : 'pending');
          
          if (item.jenis === 'pendaftaran' && item.pendaftaranId) {
            keyUnik = `pendaftaran_${item.pendaftaranId}_${statusGroup}`;
          } else if (item.jenis === 'bulanan' && item.userId && item.bulan_dibayar) {
            keyUnik = `bulanan_${item.userId}_${item.bulan_dibayar}_${statusGroup}`;
          }
          
          if (!uniqueData.has(keyUnik)) {
            uniqueData.set(keyUnik, item);
          } else {
            const existingItem = uniqueData.get(keyUnik);
            if (item.timestamp > existingItem.timestamp) {
              uniqueData.set(keyUnik, item);
            }
          }
        });

        const finalDataList = Array.from(uniqueData.values());
        setDaftarPembayaran(finalDataList.sort((a, b) => b.timestamp - a.timestamp));

      } else {
        setDaftarPembayaran([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterJenis, filterJenjang, startDate, endDate, searchName]);

  useEffect(() => {
    if (activeTab === 'pending') {
      if (filterJenis !== 'semua') setFilterJenis('semua');
      if (filterJenjang !== 'semua') setFilterJenjang('semua');
      if (startDate !== '') setStartDate('');
      if (endDate !== '') setEndDate('');
      if (searchName !== '') setSearchName('');
    }
  }, [activeTab]);

  const filteredData = daftarPembayaran.filter(item => {
    const matchTab = activeTab === 'pending' ? (!item.isVerified && !item.isRejected) : (item.isVerified || item.isRejected);
    
    const matchJenis = filterJenis === 'semua' ? true : item.jenis === filterJenis;
    const matchJenjang = filterJenjang === 'semua' ? true : item.jenjang === filterJenjang;
    
    let matchDate = true;
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      matchDate = matchDate && item.timestamp >= start;
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      matchDate = matchDate && item.timestamp <= end;
    }

    const matchName = searchName === '' ? true : item.nama_siswa.toLowerCase().includes(searchName.toLowerCase());

    return matchTab && matchJenis && matchJenjang && matchDate && matchName;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const totalPendapatan = activeTab === 'verified' 
    ? filteredData.filter(item => !item.isRejected).reduce((sum, item) => sum + item.jumlah_pembayaran, 0) 
    : 0;
  
  const totalTransaksiSukses = filteredData.filter(item => !item.isRejected).length;

  // ================= DOWNLOAD PDF =================
  const handleDownloadPDF = () => {
    const dataForPdf = filteredData.filter(item => !item.isRejected);

    if (dataForPdf.length === 0) {
      pemicuNotif("Tidak ada transaksi sukses untuk diunduh!", "error");
      return;
    }
    
    const doc = new jsPDF('l', 'mm', 'a4');
    
    const renderHeader = () => {
      doc.setFontSize(18);
      doc.setTextColor(26, 54, 93);
      doc.text('LAPORAN KEUANGAN IBNA STUDY', 148, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'} | Jenjang: ${filterJenjang.toUpperCase()}`, 148, 22, { align: 'center' });
      doc.line(15, 26, 282, 26);
    };

    renderHeader();

    const dataPendaftaran = dataForPdf.filter(d => d.jenis === 'pendaftaran');
    const dataBulanan = dataForPdf.filter(d => d.jenis === 'bulanan');

    let finalY = 35;

    if (dataPendaftaran.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("A. DATA PEMBAYARAN PENDAFTARAN", 15, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [["NO", "TANGGAL", "NAMA SISWA", "JENJANG", "PAKET LES", "NOMINAL"]],
        body: dataPendaftaran.map((item, i) => [
          i + 1,
          new Date(item.timestamp).toLocaleDateString('id-ID'),
          item.nama_siswa.toUpperCase(),
          item.jenjang,
          item.nama_paket,
          `Rp ${item.jumlah_pembayaran.toLocaleString('id-ID')}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: { 5: { halign: 'right' } },
      });
      finalY = doc.lastAutoTable.finalY + 15;
    }

    if (dataBulanan.length > 0) {
      if (finalY > 170) { doc.addPage(); finalY = 20; }
      doc.setFontSize(12);
      doc.text("B. DATA PEMBAYARAN SPP BULANAN", 15, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [["NO", "TANGGAL", "NAMA SISWA", "JENJANG", "BULAN DIBAYAR", "NOMINAL"]],
        body: dataBulanan.map((item, i) => [
          i + 1,
          new Date(item.timestamp).toLocaleDateString('id-ID'),
          item.nama_siswa.toUpperCase(),
          item.jenjang,
          item.bulan_dibayar.toUpperCase(),
          `Rp ${item.jumlah_pembayaran.toLocaleString('id-ID')}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] },
        columnStyles: { 5: { halign: 'right' } },
      });
      finalY = doc.lastAutoTable.finalY + 15;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL PENDAPATAN: Rp ${totalPendapatan.toLocaleString('id-ID')}`, 282, finalY, { align: 'right' });

    doc.save(`Laporan_Keuangan_IbnaStudy_${new Date().getTime()}.pdf`);
  };

  // ================= FUNGSI VERIFIKASI (APPROVE) DENGAN NOTIFIKASI =================
  const executeApprove = async () => {
    setIsLoadingProcess(true);
    try {
      const data = approveModal.data;
      const now = new Date();
      const isoString = now.toISOString();
      const updates = {};
      
      updates[`PembayaranLes/${data.id}/status`] = 'Diterima';
      updates[`PembayaranLes/${data.id}/tanggal_verifikasi`] = isoString;
      updates[`PembayaranLes/${data.id}/catatan_admin`] = null;

      if (data.jenis === 'pendaftaran' && data.pendaftaranId) {
        updates[`PendaftaranLes/${data.pendaftaranId}/status`] = 'Diterima';
        updates[`PendaftaranLes/${data.pendaftaranId}/catatan_admin`] = null;

        const newSiswaKey = push(ref(db, 'Siswa')).key;
        updates[`Siswa/${newSiswaKey}`] = {
          userId: data.userId || null,
          nama_siswa: data.nama_siswa,
          namaOrtu: data.namaOrtu,
          noHpOrtu: data.noHpOrtu,
          nama_kelas: data.nama_kelas,
          jenjang: data.jenjang,
          // === TAMBAHAN: Assign classId & packageId dari data PendaftaranLes ===
          classId: data.classId || '',
          packageId: data.paketId || '', // Menggunakan packageId (sebutan standar tabel Anda)
          status: "Aktif",
          tanggal_bergabung: isoString
        };
        if (data.userId) {
          updates[`Users/${data.userId}/role`] = 'Siswa';
        }
      }

      // Logika Tambah Notifikasi ke Firebase
      const tanggalFormat = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const waktuFormat = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const notifKey = push(ref(db, 'Notifications')).key;
      
      updates[`Notifications/${notifKey}`] = {
        aktivitas: 'Verifikasi Pembayaran',
        nama_user: data.nama_siswa,
        tanggal: tanggalFormat,
        waktu: waktuFormat,
        timestamp: now.getTime()
      };

      await update(ref(db), updates);
      pemicuNotif("Verifikasi Berhasil Disetujui!", "success");
      
      setApproveModal({ show: false, data: null });
      setIsModalOpen(false);
    } catch (error) { 
      pemicuNotif("Gagal melakukan verifikasi.", "error"); 
    } finally {
      setIsLoadingProcess(false);
    }
  };

  // ================= FUNGSI TOLAK (REJECT) DENGAN NOTIFIKASI =================
  const executeReject = async () => {
    if (!rejectModal.reason || rejectModal.reason.trim() === '') {
      pemicuNotif("Alasan penolakan wajib diisi!", "error");
      return;
    }

    setIsLoadingProcess(true);
    try {
      const data = rejectModal.data;
      const now = new Date();
      const updates = {};
      
      updates[`PembayaranLes/${data.id}/status`] = 'Ditolak';
      updates[`PembayaranLes/${data.id}/catatan_admin`] = rejectModal.reason;
      
      if (data.jenis === 'pendaftaran' && data.pendaftaranId) {
        updates[`PendaftaranLes/${data.pendaftaranId}/status`] = 'Ditolak';
        updates[`PendaftaranLes/${data.pendaftaranId}/catatan_admin`] = rejectModal.reason;
      }
      
      // Logika Tambah Notifikasi ke Firebase
      const tanggalFormat = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const waktuFormat = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const notifKey = push(ref(db, 'Notifications')).key;
      
      updates[`Notifications/${notifKey}`] = {
        aktivitas: 'Tolak Pembayaran',
        nama_user: data.nama_siswa,
        tanggal: tanggalFormat,
        waktu: waktuFormat,
        timestamp: now.getTime()
      };
      
      await update(ref(db), updates);
      pemicuNotif("Pembayaran berhasil ditolak.", "success");
      
      setRejectModal({ show: false, data: null, reason: '' });
      setIsModalOpen(false);
    } catch (error) {
      pemicuNotif("Gagal menolak pembayaran.", "error");
    } finally {
      setIsLoadingProcess(false);
    }
  };

  const styles = {
    statusToggle: { display: 'inline-flex', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px', border: `1px solid ${colors.border}` },
    tabBtn: (active) => ({ padding: '8px 20px', cursor: 'pointer', backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.textMuted, border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', transition: '0.3s' }),
    pillBtn: (active) => ({ padding: '8px 18px', cursor: 'pointer', backgroundColor: active ? colors.primary + '15' : 'transparent', color: active ? colors.primary : colors.textMuted, border: `1.5px solid ${active ? colors.primary : colors.border}`, borderRadius: '50px', fontWeight: '600', fontSize: '12px', transition: '0.2s' }),
    badge: (jenis) => ({ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', backgroundColor: jenis === 'bulanan' ? '#F59E0B15' : '#3B82F615', color: jenis === 'bulanan' ? '#F59E0B' : '#3B82F6', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' }),
    card: { backgroundColor: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    dateInput: { padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb', color: colors.textPrimary, fontSize: '12px', fontWeight: '600', outline: 'none' },
    searchInput: { width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', border: `1.5px solid ${colors.border}`, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb', color: colors.textPrimary, fontSize: '13px', fontWeight: '500', outline: 'none', boxSizing: 'border-box' },
    toastNotification: (type) => ({
      position: 'fixed', top: '20px', right: '20px',
      backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
      color: '#fff', padding: '16px 24px', borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1200, 
      display: 'flex', alignItems: 'center', gap: '12px',
      fontWeight: '600', fontSize: '14px', animation: 'slideIn 0.3s ease-out'
    }),
    modalActionOverlay: {
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1100, padding: '20px' 
    },
    modalActionContent: {
      backgroundColor: colors.cardBg, padding: '30px 20px', borderRadius: '20px', 
      width: '100%', maxWidth: '400px', textAlign: 'center', 
      border: `1px solid ${colors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
    }
  };

  return (
    <AdminLayout title={activeTab === 'pending' ? "Verifikasi Pembayaran" : "Laporan Keuangan"}>
      
      {notif.show && (
        <div style={styles.toastNotification(notif.type)}>
          {notif.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notif.message}</span>
          <button 
            onClick={() => setNotif({ ...notif, show: false })} 
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '10px', padding: 0, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {approveModal.show && (
        <div style={styles.modalActionOverlay}>
          <div style={styles.modalActionContent}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#10B98115', borderRadius: '50%' }}>
                <CheckCircle size={40} color="#10B981" />
              </div>
            </div>
            <h3 style={{ color: colors.textPrimary, margin: '0 0 10px 0', fontWeight: '800' }}>Konfirmasi Persetujuan</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin menyetujui pembayaran <b>{approveModal.data?.jenis}</b> ini?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setApproveModal({ show: false, data: null })} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', flex: 1 }}>
                Batal
              </button>
              <button onClick={executeApprove} disabled={isLoadingProcess} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#10B981', color: '#fff', cursor: isLoadingProcess ? 'not-allowed' : 'pointer', fontWeight: '700', flex: 1, opacity: isLoadingProcess ? 0.7 : 1 }}>
                {isLoadingProcess ? 'Memproses...' : 'Ya, Setujui'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal.show && (
        <div style={styles.modalActionOverlay}>
          <div style={styles.modalActionContent}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <div style={{ padding: '15px', backgroundColor: '#EF444415', borderRadius: '50%' }}>
                <AlertTriangle size={40} color="#EF4444" />
              </div>
            </div>
            <h3 style={{ color: colors.textPrimary, margin: '0 0 10px 0', fontWeight: '800' }}>Tolak Pembayaran</h3>
            <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              Silakan berikan alasan mengapa pembayaran ini ditolak (wajib).
            </p>
            
            <textarea 
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})}
              placeholder="Contoh: Bukti transfer buram, nominal tidak sesuai..."
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', 
                border: `1px solid ${colors.border}`, 
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                color: colors.textPrimary, resize: 'none', height: '100px',
                boxSizing: 'border-box', marginBottom: '20px', fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRejectModal({ show: false, data: null, reason: '' })} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontWeight: '700', flex: 1 }}>
                Batal
              </button>
              <button onClick={executeReject} disabled={isLoadingProcess} style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#EF4444', color: '#fff', cursor: isLoadingProcess ? 'not-allowed' : 'pointer', fontWeight: '700', flex: 1, opacity: isLoadingProcess ? 0.7 : 1 }}>
                {isLoadingProcess ? 'Memproses...' : 'Tolak Bukti'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: colors.textPrimary, fontWeight: '900', fontSize: '26px', margin: 0 }}>
              {activeTab === 'pending' ? 'Verifikasi Pembayaran' : 'Laporan Keuangan'}
            </h2>
            <p style={{ color: colors.textMuted, marginTop: '4px' }}>
              {activeTab === 'pending' ? 'Pantau dan validasi bukti transaksi masuk' : 'Rekapitulasi pendapatan berdasarkan transaksi yang disetujui'}
            </p>
          </div>
          
          {activeTab === 'verified' && (
            <button 
              onClick={handleDownloadPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            >
              <Download size={18} /> Unduh Laporan PDF
            </button>
          )}
        </div>

        {activeTab === 'verified' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ ...styles.card, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`, color: '#fff', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Total Pendapatan Filter</p>
                  <h3 style={{ margin: '10px 0 0', fontSize: '32px', fontWeight: '900' }}>Rp {totalPendapatan.toLocaleString('id-ID')}</h3>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '50%' }}>
                  <DollarSign size={32} color="#fff" />
                </div>
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' }}>Total Transaksi Sukses</p>
                  <h3 style={{ margin: '10px 0 0', fontSize: '28px', fontWeight: '900', color: colors.textPrimary }}>{totalTransaksiSukses} <span style={{ fontSize: '14px', color: colors.textMuted }}>Data</span></h3>
                </div>
                <div style={{ backgroundColor: colors.primary + '15', padding: '15px', borderRadius: '50%' }}>
                  <TrendingUp size={32} color={colors.primary} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...styles.card, marginBottom: '25px', padding: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
            <div style={styles.statusToggle}>
              <button style={styles.tabBtn(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
                <Clock size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Menunggu
              </button>
              <button style={styles.tabBtn(activeTab === 'verified')} onClick={() => setActiveTab('verified')}>
                <CheckCircle size={16} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Selesai
              </button>
            </div>

            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
              <input 
                type="text" 
                placeholder="Cari nama siswa..." 
                value={searchName} 
                onChange={(e) => setSearchName(e.target.value)} 
                style={styles.searchInput} 
              />
            </div>
          </div>

          {activeTab === 'verified' && (
            <div style={{ 
              marginTop: '20px', 
              paddingTop: '20px', 
              borderTop: `1px dashed ${colors.border}`, 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '30px'
            }}>
              
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, marginBottom: '10px', letterSpacing: '0.5px' }}>JENIS TRANSAKSI</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['semua', 'pendaftaran', 'bulanan'].map(j => (
                    <button key={j} style={styles.pillBtn(filterJenis === j)} onClick={() => setFilterJenis(j)}>{j.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, marginBottom: '10px', letterSpacing: '0.5px' }}>JENJANG PENDIDIKAN</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['semua', 'SD', 'SMP', 'SMA'].map(j => (
                    <button key={j} style={styles.pillBtn(filterJenjang === j)} onClick={() => setFilterJenjang(j)}>{j.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, marginBottom: '10px', letterSpacing: '0.5px' }}>RENTANG TANGGAL</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateInput} />
                  <span style={{ color: colors.textMuted, fontWeight: 'bold' }}>-</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
                </div>
              </div>

            </div>
          )}
        </div>

        <div style={{ backgroundColor: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: '11px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '20px' }}>Informasi Siswa</th>
                <th style={{ padding: '20px' }}>Kategori / Jenjang</th>
                <th style={{ padding: '20px' }}>Paket / Bulan</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>Nominal</th>
                <th style={{ padding: '20px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${colors.border}`, transition: '0.3s' }}>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: '800', color: colors.textPrimary, fontSize: '15px' }}>{item.nama_siswa}</div>
                    <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarDays size={12}/> {new Date(item.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.badge(item.jenis)}>
                        {item.jenis === 'bulanan' ? <CalendarDays size={12} /> : <CreditCard size={12} />} {item.jenis}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: colors.primary }}>{item.jenjang}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px', color: colors.textPrimary }}>
                    {item.jenis === 'bulanan' ? (
                        <div style={{ fontWeight: '800', color: colors.primary }}>{(item.bulan_dibayar || '').toUpperCase()}</div>
                    ) : (
                        <div style={{ fontWeight: '700' }}>{item.nama_paket}</div>
                    )}
                  </td>
                  <td style={{ padding: '20px', fontWeight: '900', fontSize: '16px', textAlign: 'right' }}>
                    <div style={{ color: item.isRejected ? '#EF4444' : '#10B981' }}>
                      Rp {Number(item.jumlah_pembayaran || 0).toLocaleString('id-ID')}
                    </div>
                    {item.isRejected && (
                      <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', fontWeight: '800' }}>DITOLAK</div>
                    )}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <button 
                      onClick={() => { setSelectedData(item); setIsModalOpen(true); }} 
                      style={{ padding: '10px', backgroundColor: colors.primary + '10', color: colors.primary, border: 'none', borderRadius: '12px', cursor: 'pointer' }}
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: colors.textMuted, fontWeight: '600' }}>Data tidak ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredData.length > itemsPerPage && (
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', borderTop: `1px solid ${colors.border}` }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: colors.textPrimary }}><ChevronLeft size={20}/></button>
              <span style={{ fontWeight: 'bold', color: colors.textPrimary, fontSize: '14px' }}>Halaman {currentPage} dari {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.cardBg, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: colors.textPrimary }}><ChevronRight size={20}/></button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ 
            backgroundColor: colors.cardBg, 
            padding: '32px', 
            borderRadius: '28px', 
            width: '100%', 
            maxWidth: selectedData.jenis === 'bulanan' ? '450px' : '750px', 
            border: `1px solid ${colors.border}`, 
            maxHeight: '90vh', 
            overflowY: 'auto' 
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.textPrimary, fontSize: '22px', fontWeight: '900' }}>
                  Detail {selectedData.jenis === 'bulanan' ? 'Biaya Bulanan SPP' : 'Pendaftaran Siswa'}
                </h3>
                <div style={{marginTop: '8px'}}><span style={styles.badge(selectedData.jenis)}>KATEGORI: {selectedData.jenis}</span></div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
                <X size={24} color={colors.textMuted} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: selectedData.jenis === 'bulanan' ? '1fr' : '1.2fr 1fr', gap: '30px' }}>
              
              <div style={{ color: colors.textPrimary }}>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '15px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Siswa</label>
                    <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: '800' }}>{selectedData.nama_siswa}</p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Jenjang</label>
                      <p style={{ margin: '4px 0', fontWeight: '800', fontSize: '15px', color: colors.primary }}>{selectedData.jenjang}</p>
                  </div>
                  {selectedData.jenis === 'bulanan' ? (
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Bulan Dibayar</label>
                        <p style={{ margin: '4px 0', fontWeight: '800', fontSize: '15px' }}>{(selectedData.bulan_dibayar || '-').toUpperCase()}</p>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>Paket Les</label>
                        <p style={{ margin: '4px 0', fontWeight: '700', fontSize: '15px' }}>{selectedData.nama_paket}</p>
                    </div>
                  )}
                </div>

                {selectedData.jenis !== 'bulanan' && (
                  <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase' }}>WhatsApp Orang Tua</label>
                      <p style={{ margin: '4px 0', fontWeight: '700' }}>{selectedData.noHpOrtu}</p>
                  </div>
                )}

                <div style={{ padding: '20px', backgroundColor: '#10B98108', borderRadius: '16px', border: '2px dashed #10B98150' }}>
                    <label style={{ fontSize: '10px', fontWeight: '900', color: '#10B981', textTransform: 'uppercase' }}>Total Nominal</label>
                    <p style={{ margin: '4px 0', fontWeight: '900', color: '#10B981', fontSize: '28px' }}>
                      Rp {Number(selectedData.jumlah_pembayaran || 0).toLocaleString('id-ID')}
                    </p>
                </div>
              </div>

              {selectedData.jenis !== 'bulanan' && (
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '900', color: colors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    Bukti Pembayaran / Transfer
                  </label>
                  <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${colors.border}`, backgroundColor: '#000' }}>
                    <img 
                      src={selectedData.bukti_pembayaran || selectedData.foto_bukti || selectedData.url_bukti || 'https://via.placeholder.com/300?text=Tidak+Ada+Bukti'} 
                      alt="Bukti Transfer" 
                      style={{ width: '100%', height: '280px', objectFit: 'contain' }} 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Gambar+Gagal+Dimuat' }}
                    />
                  </div>
                  <button 
                    onClick={() => window.open(selectedData.bukti_pembayaran || selectedData.foto_bukti || selectedData.url_bukti, '_blank')}
                    disabled={!(selectedData.bukti_pembayaran || selectedData.foto_bukti || selectedData.url_bukti)}
                    style={{ width: '100%', marginTop: '12px', padding: '10px', backgroundColor: colors.primary + '10', color: colors.primary, border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '12px', cursor: (selectedData.bukti_pembayaran || selectedData.foto_bukti || selectedData.url_bukti) ? 'pointer' : 'not-allowed', opacity: (selectedData.bukti_pembayaran || selectedData.foto_bukti || selectedData.url_bukti) ? 1 : 0.5 }}
                  >
                    Buka Gambar Penuh
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {selectedData.isRejected ? (
                <div style={{ width: '100%', padding: '18px', backgroundColor: '#EF444415', color: '#EF4444', borderRadius: '18px', textAlign: 'center', border: '1px solid #EF4444' }}>
                  <div style={{ fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', marginBottom: '6px' }}>
                    <XCircle size={20} /> PEMBAYARAN DITOLAK
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Alasan: {selectedData.catatan_admin || 'Tidak ada alasan spesifik'}</div>
                </div>
              ) : activeTab === 'verified' || selectedData.isVerified ? (
                <div style={{ width: '100%', padding: '18px', backgroundColor: '#10B98115', color: '#10B981', borderRadius: '18px', textAlign: 'center', fontWeight: '800', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <CheckCircle size={24} /> {selectedData.jenis === 'bulanan' ? 'DATA SPP BULANAN' : 'PEMBAYARAN TELAH DIVERIFIKASI'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                  <button 
                    disabled={isLoadingProcess}
                    onClick={() => setRejectModal({ show: true, data: selectedData, reason: '' })} 
                    style={{ flex: 1, padding: '18px', backgroundColor: 'transparent', color: '#EF4444', border: '2px solid #EF4444', borderRadius: '18px', cursor: isLoadingProcess ? 'not-allowed' : 'pointer', fontWeight: '900', fontSize: '14px', opacity: isLoadingProcess ? 0.5 : 1 }}
                  >
                    TOLAK BUKTI
                  </button>
                  <button 
                    disabled={isLoadingProcess}
                    onClick={() => setApproveModal({ show: true, data: selectedData })} 
                    style={{ flex: 1.5, padding: '18px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '18px', cursor: isLoadingProcess ? 'not-allowed' : 'pointer', fontWeight: '900', fontSize: '14px', boxShadow: isLoadingProcess ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.3)', opacity: isLoadingProcess ? 0.5 : 1 }}
                  >
                    VERIFIKASI & TERIMA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </AdminLayout>
  );
};

export default AdminVerifikasiPembayaran;