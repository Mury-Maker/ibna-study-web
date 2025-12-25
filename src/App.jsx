import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import DashboardGuru from './pages/Guru/Dashboard';
import ProfileGuru from './pages/Guru/Profile';
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
          <Route path="/Guru/Jadwal" element={<div>Halaman Jadwal</div>} />
          <Route path="/Guru/Kelas" element={<div>Halaman Kelas</div>} />
          <Route path="/Guru/Rekap-Nilai" element={<div>Halaman Rekap Nilai</div>} />
          <Route path="/Guru/Tanya-PR" element={<div>Halaman Tanya PR</div>} />
          <Route path="/Guru/Tambahan-Belajar" element={<div>Halaman Tambahan Belajar</div>} />
          
          {/* Redirect jika halaman tidak ditemukan */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;