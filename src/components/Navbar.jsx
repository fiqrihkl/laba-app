import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import TombolSOS from "../pages/anggota/TombolSOS";

// IMPORT REACT ICONS
import { 
  HiOutlineBookOpen, 
  HiOutlineShieldCheck, 
  HiOutlineBell, 
  HiOutlineLogout,
  HiOutlineHome,
  HiOutlineQrcode,
  HiOutlineClipboardCheck,
  HiOutlineAcademicCap,
  HiLightningBolt,
  HiExclamation,
  HiX,
  HiOutlineChartBar
} from "react-icons/hi";

export default function Navbar({ role, userData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSfhMenu, setShowSfhMenu] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Identitas warna berdasarkan Role
  const isScout = role === "anggota";
  const activeColorClass = isScout ? "text-red-600" : "text-blue-500";
  const activeBorderClass = isScout ? "border-red-600" : "border-blue-500";

  const isChatPage = location.pathname === "/navi-chat";

  useEffect(() => {
    setImgError(false);
  }, [userData?.photoURL]);

  const handleLogout = () => {
    if (window.confirm("KELUAR DARI SISTEM NAVIGASI?")) {
      signOut(auth);
      navigate("/");
    }
  };

  if (isChatPage) return null;

  // Konfigurasi Menu berdasarkan Role
  const menuConfig = {
    admin: [
      { name: "Home", path: "/admin", icon: <HiOutlineHome size={26} /> },
      { name: "Verif", path: "/admin/verifikasi-tingkat", icon: <HiOutlineClipboardCheck size={26} /> },
      { name: "SFH", path: "/pembina/investigasi-sfh", icon: <HiOutlineShieldCheck size={26} /> },
      { name: "Feed", path: "/pembina/notifications", icon: <HiOutlineBell size={26} /> },
      { name: "Profil", path: "/profile", isAvatar: true },
    ],
    pembina: [
      { name: "Home", path: "/pembina", icon: <HiOutlineHome size={26} /> },
      { name: "Scanner", path: "/pembina/scanner", icon: <HiOutlineQrcode size={26} /> },
      { name: "Approval", path: "/pembina/verifikasi-sku", icon: <HiOutlineAcademicCap size={26} /> },
      { name: "Feed", path: "/pembina/notifications", icon: <HiOutlineBell size={26} /> },
      { name: "Profil", path: "/profile", isAvatar: true },
    ],
    anggota: [
      { name: "Home", path: "/anggota", icon: <HiOutlineHome size={26} /> },
      { name: "SKU", path: "/sku", icon: <HiOutlineBookOpen size={26} /> },
      { name: "SFH", path: "#", icon: <HiOutlineShieldCheck size={36} />, isSpecial: true },
      { name: "Notif", path: "/riwayat-status", icon: <HiOutlineBell size={26} /> },
      { name: "Profil", path: "/profile", isAvatar: true },
    ],
  };

  const activeMenu = menuConfig[role] || [];

  return (
    <>
      {/* 1. MODAL OVERLAY SOS (KHUSUS ANGGOTA) */}
      <AnimatePresence>
        {showSosModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-sm"
            >
              <button 
                onClick={() => setShowSosModal(false)}
                className="absolute -top-14 right-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all shadow-xl"
              >
                <HiX size={24} />
              </button>
              <TombolSOS userProfile={userData} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NAVBAR UTAMA */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[1000] italic font-medium">
        
        {/* OVERLAY DARK UNTUK MENU SFH ANGGOTA */}
        <AnimatePresence>
          {showSfhMenu && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSfhMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm h-screen w-screen -left-[50vw]"
              style={{ zIndex: -1 }}
            />
          )}
        </AnimatePresence>

        <div className="bg-[#020617]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,1)] border border-white/10 px-4 py-2 flex justify-between items-center relative">
          
          {activeMenu.map((item, idx) => {
            const isActive = location.pathname === item.path;

            // Tombol Khusus SFH (Tengah) untuk Anggota
            if (item.isSpecial) {
              return (
                <div key="sfh-central" className="relative">
                  <AnimatePresence>
                    {showSfhMenu && (
                      <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex items-end gap-6 justify-center w-[200px]">
                        <motion.button
                          initial={{ x: 20, y: 50, opacity: 0, scale: 0 }}
                          animate={{ x: -45, y: 0, opacity: 1, scale: 1 }}
                          exit={{ x: 20, y: 50, opacity: 0, scale: 0 }}
                          onClick={() => { setShowSfhMenu(false); setShowSosModal(true); }}
                          className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center text-red-600 shadow-xl border-4 border-red-600"
                        >
                          <HiLightningBolt size={24} className="animate-pulse" />
                          <span className="text-[9px] font-black italic uppercase">SOS</span>
                        </motion.button>

                        <motion.button
                          initial={{ x: -20, y: 50, opacity: 0, scale: 0 }}
                          animate={{ x: 45, y: 0, opacity: 1, scale: 1 }}
                          exit={{ x: -20, y: 50, opacity: 0, scale: 0 }}
                          onClick={() => { setShowSfhMenu(false); navigate("/lapor-insiden"); }}
                          className="w-16 h-16 bg-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl border-4 border-white"
                        >
                          <HiExclamation size={24} />
                          <span className="text-[9px] font-black italic uppercase">LAPOR</span>
                        </motion.button>
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="relative -top-12">
                    <motion.button 
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowSfhMenu(!showSfhMenu)}
                      className={`w-20 h-20 bg-gradient-to-b rounded-full flex flex-col items-center justify-center text-white shadow-2xl border-[6px] border-[#020617] transition-all duration-300 ${showSfhMenu ? 'from-orange-500 to-orange-700 rotate-180' : 'from-red-600 to-red-900'}`}
                    >
                      <HiOutlineShieldCheck size={36} />
                      <span className="text-[8px] font-black mt-1 uppercase">SFH</span>
                    </motion.button>
                  </div>
                </div>
              );
            }

            // Rendering Avatar Profil
            if (item.isAvatar) {
              return (
                <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1 p-2">
                  <div className={`w-8 h-8 rounded-full border-2 overflow-hidden shadow-lg transition-all flex items-center justify-center ${isActive ? `${activeBorderClass} scale-110` : "border-white/10 grayscale"}`}>
                    {userData?.photoURL && !imgError ? (
                      <img 
                        src={userData.photoURL} alt="Me" className="w-full h-full object-cover" 
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-[10px] uppercase`}>
                        {userData?.nama ? userData.nama.substring(0, 2) : "LB"}
                      </div>
                    )}
                  </div>
                  <span className={`text-[8px] font-black uppercase ${isActive ? activeColorClass : "text-slate-500"}`}>{item.name}</span>
                </Link>
              );
            }

            // Menu Standar
            return (
              <Link 
                key={item.path} to={item.path} 
                className={`flex flex-col items-center gap-1.5 p-2 transition-all ${isActive ? `${activeColorClass} scale-110` : "text-slate-500 hover:text-white"}`}
              >
                <div>{item.icon}</div>
                <span className="text-[8px] font-black uppercase">{item.name}</span>
              </Link>
            );
          })}

          {/* Tombol Logout Khusus Admin/Pembina */}
          {role !== "anggota" && (
            <button onClick={handleLogout} className="flex flex-col items-center gap-1.5 p-2 text-slate-500 hover:text-red-500 transition-colors">
              <HiOutlineLogout size={26} />
              <span className="text-[8px] font-black uppercase">Exit</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}