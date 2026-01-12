import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import DashboardGuru from './pages/Guru/Dashboard';
import ProfileGuru from './pages/Guru/Profile';
import Jadwal from './pages/Guru/Jadwal';
import KelasDetail from './pages/Guru/Kelas/KelasDetail';
import MapelDetail from './pages/Guru/Kelas/Mapel/index';
import KontenDetail from './pages/Guru/Kelas/Mapel/KontenDetail';
import RekapNilai from './pages/Guru/RekapNilai';
import TanyaPR from './pages/Guru/TanyaPR/index';
import TambahanBelajar from './pages/Guru/TambahanBelajar/index';
import EditProfileGuru from './pages/Guru/form/EditProfileGuru';
import Notifikasi from './pages/Guru/Notifikasi';
import NotFound from './pages/NotFound';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider lo

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Route Guru - Pastikan path sesuai dengan menu di Sidebar */}
          <Route path="/Guru/Dashboard" element={<DashboardGuru />} />
          <Route path="/Guru/Profile" element={<ProfileGuru />} />
          <Route path="/Guru/Jadwal" element={<Jadwal/>} />
          <Route path="/Guru/Kelas" element={<KelasDetail />} />
          <Route path="/Guru/Kelas/:kelasId" element={<KelasDetail />} />
          <Route path="/Guru/Kelas/:kelasId/Mapel/:mapelId" element={<MapelDetail />} />
          <Route path="/Guru/Kelas/:kelasId/Mapel/:mapelId/Detail/:kontenId" element={<KontenDetail />} />
          <Route path="/Guru/Rekap-Nilai" element={<RekapNilai/>} />
          <Route path="/Guru/Tanya-PR" element={<TanyaPR/>} />
          <Route path="/Guru/Tambahan-Belajar" element={<TambahanBelajar/>} />
          <Route path="/Guru/Profile/Edit" element={<EditProfileGuru />} />
          <Route path="/Guru/Notifikasi" element={<Notifikasi />} />
          {/* Redirect jika halaman tidak ditemukan */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;