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
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { AnimatePresence } from "framer-motion";

// --- IMPORT KONTEKS & UI PREMIUM ---
import { ModalProvider } from "./context/ModalContext";
import { ConfirmProvider } from "./pages/pembina/context/ConfirmContext"; 
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
import ProfileAnggota from "./pages/anggota/Profile"; 
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
import NotificationList from "./pages/pembina/NotificationList";
import ProfilePembina from "./pages/pembina/Profile"; 

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

  console.log("[NAVIGASI DEBUG] Status:", { 
    path: location.pathname, 
    isLoading: loading, 
    hasUser: !!user, 
    role: role 
  });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/aktivasi" element={<AktivasiAkun />} />
        
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
              <div className="flex items-center justify-center h-screen bg-[#020617]">
                <div className="text-center font-sans italic">
                  <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Menyinkronkan profil...</p>
                  <button 
                    onClick={() => signOut(auth)} 
                    className="mt-4 text-[8px] font-black text-red-500 uppercase tracking-tighter underline"
                  >
                    Batal & Keluar
                  </button>
                </div>
              </div>
            )
          }
        />

        {/* --- AKSES ADMIN & PEMBINA --- */}
        <Route path="/admin/verifikasi-tingkat" element={user && (role === "admin" || role === "pembina") ? <VerifikasiTingkat /> : <Navigate to="/" replace />} />
        <Route path="/pembina/verifikasi-sku" element={user && (role === "admin" || role === "pembina") ? <VerifikasiSKU /> : <Navigate to="/" replace />} />
        <Route path="/pembina/investigasi-sfh" element={user && (role === "admin" || role === "pembina") ? <InvestigasiSFH /> : <Navigate to="/" replace />} />
        <Route path="/pembina/monitor-sos" element={user && (role === "admin" || role === "pembina") ? <MonitorSOS /> : <Navigate to="/" replace />} />
        <Route path="/admin/master-sku" element={user && (role === "admin" || role === "pembina") ? <KelolaMasterSKU /> : <Navigate to="/" replace />} />
        <Route path="/pembina/notifications" element={user && (role === "admin" || role === "pembina") ? <NotificationList /> : <Navigate to="/" replace />} />

        {/* --- RUTE KHUSUS ADMIN --- */}
        <Route path="/admin" element={user && role === "admin" ? <AdminDashboard /> : <Navigate to="/" replace />} />
        <Route path="/admin/logs" element={user && role === "admin" ? <AuditTrailLogs /> : <Navigate to="/" replace />} />
        <Route path="/admin/kta-editor" element={user && role === "admin" ? <KTAEditor /> : <Navigate to="/" replace />} />

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
        <Route path="/laporan" element={user ? <Laporan /> : <Navigate to="/" replace />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/" replace />} />
        <Route path="/announcements" element={user && role === "anggota" ? <Announcements /> : <Navigate to="/" replace />} />
        <Route path="/navi-chat" element={<NaviChat />} />
        
        {/* --- RUTE PROFIL --- */}
        <Route 
          path="/profile" 
          element={
            user && (role === "admin" || role === "pembina") 
            ? <ProfilePembina /> 
            : user && role === "anggota" 
            ? <ProfileAnggota /> 
            : <Navigate to="/" replace />
          } 
        />
        
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

  // --- 1. LOGIKA SESSION TIMEOUT & HEARTBEAT ---
  useEffect(() => {
    if (user && role === "anggota" && userData) {
      const userRef = doc(db, "users", userData.id);
      
      // A. Cek Durasi Inaktivitas (Protokol Keamanan 24 Jam)
      const checkSession = () => {
        if (userData.lastSeen) {
          // Konversi Firestore Timestamp ke JavaScript Date object
          const lastActive = userData.lastSeen.toDate ? userData.lastSeen.toDate() : new Date(userData.lastSeen);
          const now = new Date();
          const diffInHours = (now - lastActive) / (1000 * 60 * 60);

          // Jika sudah lebih dari 24 jam tidak ada aktivitas digital, paksa logout
          if (diffInHours > 24) {
            console.warn("[SECURITY] Intelligence session expired (>24h). Force logout initiated.");
            signOut(auth);
            return true;
          }
        }
        return false;
      };

      const isExpired = checkSession();
      if (isExpired) return;

      // B. Set Status Online & Perbarui Heartbeat (lastSeen)
      updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      }).catch(err => console.error("Heartbeat Start Error:", err));

      // C. Cleanup: Set Status Offline saat aplikasi ditutup
      return () => {
        updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }).catch(err => console.error("Heartbeat Stop Error:", err));
      };
    }
  }, [user, role, userData]);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); 

    const installHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", installHandler);

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
          console.error("[AUTH ERROR] Syncing Firestore:", error);
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
      <ConfirmProvider> 
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : (
            <Router>
              <div className="bg-[#020617] min-h-screen">
                {user && role && (
                  <>
                    <NotificationListener user={user} />
                    <Navbar role={role} userData={userData} />
                  </>
                )}
                
                <div className={user ? "pb-24 md:pt-20 md:pb-0" : ""}>
                  <AnimatedRoutes 
                    key={loading ? "loading" : "content"} 
                    user={user} 
                    role={role} 
                    userData={userData} 
                    installPrompt={deferredPrompt}
                    loading={loading}
                  />
                </div>
              </div>
            </Router>
          )}
        </AnimatePresence>
      </ConfirmProvider>
    </ModalProvider>
  );
}

export default App;