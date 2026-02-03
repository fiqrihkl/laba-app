import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AnimatePresence } from "framer-motion";

// --- IMPORT KONTEKS & UI PREMIUM ---
import { ModalProvider } from "./context/ModalContext";
import SplashScreen from "./components/SplashScreen";
import PageLoader from "./components/PageLoader";

// --- IMPORT KOMPONEN UI ---
import Navbar from "./components/Navbar";
import NotificationListener from "./components/NotificationListener";

// --- IMPORT HALAMAN ---
import Login from "./pages/auth/Login";
import AktivasiAkun from "./pages/auth/AktivasiAkun";

// Anggota
import AnggotaDashboard from "./pages/anggota/AnggotaDashboard";
import Leaderboard from "./pages/anggota/Leaderboard";
import Profile from "./pages/anggota/Profile";
import Laporan from "./pages/anggota/Laporan";
import Announcements from "./pages/anggota/Announcements";
import DaftarSKU from "./pages/anggota/DaftarSKU";
import RiwayatStatus from "./pages/anggota/RiwayatStatus";
import LaporInsiden from "./pages/anggota/LaporInsiden";
import NaviChat from "./pages/anggota/NaviChat";
import PrintPiagam from "./pages/anggota/PrintPiagam";

// Pembina
import PembinaDashboard from "./pages/pembina/PembinaDashboard";
import ScannerPembina from "./pages/pembina/ScannerPembina";
import RiwayatPresensi from "./pages/pembina/RiwayatPresensi";
import VerifikasiSKU from "./pages/pembina/VerifikasiSKU";
import RekapitulasiSKU from "./pages/pembina/RekapitulasiSKU";
import MonitorSOS from "./pages/pembina/MonitorSOS";
import AdminHub from "./pages/pembina/AdminHub";
import StatistikSKU from "./pages/pembina/StatistikSKU";
import ExportPresensi from "./pages/pembina/ExportPresensi";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import KelolaPengguna from "./pages/admin/KelolaPengguna";
import KelolaInformasi from "./pages/admin/KelolaInformasi";
import ValidasiPoin from "./pages/admin/ValidasiPoin";
import StrukturOrganisasi from "./pages/admin/StrukturOrganisasi";
import AuditTrailLogs from "./pages/admin/AuditTrailLogs";
import KTAEditor from "./pages/admin/KTAEditor";
import KelolaMasterSKU from "./pages/admin/KelolaMasterSKU";
import VerifikasiTingkat from "./pages/admin/VerifikasiTingkat";
import InvestigasiSFH from "./pages/admin/InvestigasiSFH";

// Komponen Pembungkus untuk Animasi Rute
const AnimatedRoutes = ({ user, role, userData, installPrompt, loading }) => {
  const location = useLocation();

  // JIKA SEDANG SYNC DATA, TAMPILKAN PAGELOADER PREMIUM
  if (loading) {
    return <PageLoader />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/aktivasi" element={<AktivasiAkun />} />
        
        {/* LOGIC REDIRECT UTAMA */}
        <Route
          path="/"
          element={
            !user ? (
              <Login installPrompt={installPrompt} />
            ) : role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : role === "pembina" ? (
              <Navigate to="/pembina" replace />
            ) : role === "anggota" ? (
              <Navigate to="/anggota" replace />
            ) : (
              /* Safe Redirect jika data belum sinkron sepenuhnya */
              <Navigate to="/" replace onClick={() => signOut(auth)} />
            )
          }
        />

        {/* --- AKSES ADMIN & PEMBINA --- */}
        <Route path="/admin/verifikasi-tingkat" element={user && (role === "admin" || role === "pembina") ? <VerifikasiTingkat /> : <Navigate to="/" replace />} />
        <Route path="/pembina/verifikasi-sku" element={user && (role === "admin" || role === "pembina") ? <VerifikasiSKU /> : <Navigate to="/" replace />} />
        <Route path="/admin/investigasi-sfh" element={user && (role === "admin" || role === "pembina") ? <InvestigasiSFH /> : <Navigate to="/" replace />} />
        <Route path="/pembina/monitor-sos" element={user && (role === "admin" || role === "pembina") ? <MonitorSOS /> : <Navigate to="/" replace />} />

        {/* --- RUTE KHUSUS ADMIN --- */}
        <Route path="/admin" element={user && role === "admin" ? <AdminDashboard /> : <Navigate to="/" replace />} />
        <Route path="/admin/logs" element={user && role === "admin" ? <AuditTrailLogs /> : <Navigate to="/" replace />} />
        <Route path="/admin/kta-editor" element={user && role === "admin" ? <KTAEditor /> : <Navigate to="/" replace />} />
        <Route path="/admin/master-sku" element={user && (role === "admin" || role === "pembina") ? <KelolaMasterSKU /> : <Navigate to="/" replace />} />

        {/* --- RUTE OPERASIONAL LAINNYA --- */}
        <Route path="/kelola-pengguna" element={user && (role === "admin" || role === "pembina") ? <KelolaPengguna /> : <Navigate to="/" replace />} />
        <Route path="/admin/pengumuman" element={user && (role === "admin" || role === "pembina") ? <KelolaInformasi /> : <Navigate to="/" replace />} />
        <Route path="/admin/validasi-poin" element={user && (role === "admin" || role === "pembina") ? <ValidasiPoin /> : <Navigate to="/" replace />} />
        <Route path="/admin/struktur" element={user && (role === "admin" || role === "pembina" || role === "anggota") ? <StrukturOrganisasi /> : <Navigate to="/" replace />} />

        {/* --- RUTE KHUSUS PEMBINA --- */}
        <Route path="/pembina" element={user && role === "pembina" ? <PembinaDashboard /> : <Navigate to="/" replace />} />
        <Route path="/pembina/riwayat" element={user && (role === "admin" || role === "pembina") ? <RiwayatPresensi /> : <Navigate to="/" replace />} />
        <Route path="/pembina/scanner" element={user && role === "pembina" ? <ScannerPembina /> : <Navigate to="/" replace />} />
        <Route path="/pembina/rekap-sku" element={user && (role === "admin" || role === "pembina") ? <RekapitulasiSKU /> : <Navigate to="/" replace />} />
        <Route path="/pembina/admin-hub" element={user && (role === "admin" || role === "pembina") ? <AdminHub /> : <Navigate to="/" replace />} />
        <Route path="/pembina/statistik-sku" element={user && (role === "admin" || role === "pembina") ? <StatistikSKU /> : <Navigate to="/" replace />} />
        <Route path="/pembina/export-presensi" element={user && (role === "admin" || role === "pembina") ? <ExportPresensi /> : <Navigate to="/" replace />} />

        {/* --- RUTE ANGGOTA --- */}
        <Route path="/anggota" element={user && role === "anggota" ? <AnggotaDashboard /> : <Navigate to="/" replace />} />
        <Route path="/sku" element={user && role === "anggota" ? <DaftarSKU userData={userData} /> : <Navigate to="/" replace />} />
        <Route path="/riwayat-status" element={user && role === "anggota" ? <RiwayatStatus /> : <Navigate to="/" replace />} />
        <Route path="/lapor-insiden" element={user && role === "anggota" ? <LaporInsiden /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={user && (role === "admin" || role === "pembina" || role === "anggota") ? <Profile /> : <Navigate to="/" replace />} />
        <Route path="/laporan" element={user ? <Laporan /> : <Navigate to="/" replace />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/" replace />} />
        <Route path="/announcements" element={user && role === "anggota" ? <Announcements /> : <Navigate to="/" replace />} />
        <Route path="/navi-chat" element={<NaviChat />} />
        
        {/* RUTE BARU: PRINT PIAGAM */}
        <Route path="/print-piagam/:badgeKey" element={user && role === "anggota" ? <PrintPiagam /> : <Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [showSplash, setShowSplash] = useState(true); 
  const [deferredPrompt, setDeferredPrompt] = useState(null); 

  useEffect(() => {
    // 1. Timer Splash Screen Premium
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); 

    // 2. Listener PWA Install
    const installHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", installHandler);

    // 3. Listener Status Auth & Sync Firestore
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); 
      if (currentUser) {
        setUser(currentUser);
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("uid", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setRole(data.role);
            setUserData({ id: querySnapshot.docs[0].id, ...data });
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Auth Sync Error:", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setUserData(null);
      }
      setLoading(false); 
    });

    return () => {
      unsubscribe();
      clearTimeout(splashTimer);
      window.removeEventListener("beforeinstallprompt", installHandler);
    };
  }, []);

  return (
    <ModalProvider>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" />
        ) : (
          <Router>
            <div className="bg-slate-50 min-h-screen">
              {user && role && <NotificationListener user={user} />}
              
              {/* --- NAVBAR GLOBAL DENGAN SYNC USERDATA --- */}
              {user && role && <Navbar role={role} userData={userData} />}

              <div className={user ? "pb-24 md:pt-20 md:pb-0" : ""}>
                {/* 🚀 ANIMASI LOADING TRANSISI ANTAR RUTE */}
                <AnimatePresence mode="wait">
                   <AnimatedRoutes 
                    key={loading ? "loading" : "content"} // Force re-render saat status loading berubah
                    user={user} 
                    role={role} 
                    userData={userData} 
                    installPrompt={deferredPrompt}
                    loading={loading}
                  />
                </AnimatePresence>
              </div>
            </div>
          </Router>
        )}
      </AnimatePresence>
    </ModalProvider>
  );
}

export default App;