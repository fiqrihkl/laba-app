import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";

// --- IMPORT CUSTOM HOOK LOGIKA ---
import { useAnggotaDashboard } from "../../hooks/useAnggotaDashboard";

// --- IMPORT SUB-KOMPONEN (HASIL CLEAN CODE) ---
import DashboardHeader from "./components/DashboardHeader"; 
import ActionGrid from "./components/ActionGrid";
import MissionBrief from "./components/MissionBrief";
import AchievementRadar from "./components/AchievementRadar";
import DashboardModals from "./components/DashboardModals";

// --- KOMPONEN LAIN ---
import KTAView from "../anggota/KTAView";
import ScoutGallery from "./ScoutGallery"; 
import ScoutBadges from "./ScoutBadges";

// --- IMPORT REACT ICONS ---
import { HiLightningBolt } from "react-icons/hi";

function AnggotaDashboard() {
  // --- STATE KHUSUS UI (DIPERTAHANKAN) ---
  const [showBadges, setShowBadges] = useState(false);
  const [showKTA, setShowKTA] = useState(false);
  const [showGallery, setShowGallery] = useState(false); 
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [selectedAnnounce, setSelectedAnnounce] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const { showModal } = useModal();

  // --- MENGAMBIL DATA & LOGIKA DARI HOOK ---
  const {
    userData,
    naviGreeting,
    announcements,
    userBadges,
    loading,
    isEvolving,
    initializeListeners,
    playCollectSound
  } = useAnggotaDashboard();

  // Inisialisasi data realtime saat komponen dimuat
  useEffect(() => {
    const cleanup = initializeListeners(setShowDailyBonus);
    return () => cleanup();
  }, []);

  // --- HANDLER INTERAKSI (Klaim XP Misi) ---
  const handleClaimXP = async (announce) => {
    if (!userData || userData.claimedXP?.includes(announce.id)) { 
      setSelectedAnnounce(announce); 
      return; 
    }
    try {
      await updateDoc(doc(db, "users", userData.docId), {
        points: increment(50), 
        energy: Math.min(100, (userData.energy || 0) + 5),
        claimedXP: arrayUnion(announce.id),
      });
      playCollectSound();
      showModal("Misi Berhasil!", "Kamu mendapatkan +50 XP & +5 Energi dari Brief ini!", "success");
      setSelectedAnnounce(announce);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => auth.signOut().then(() => navigate("/login"));

  // --- LOADING SCREEN ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <HiLightningBolt size={60} className="text-yellow-400" />
      </motion.div>
      <p className="font-black italic uppercase text-[10px] tracking-[0.4em] mt-8 text-slate-400 text-center">Syncing Scout Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans selection:bg-red-800 overflow-x-hidden italic">
      <div className="w-full max-md mx-auto bg-[#020617] min-h-screen flex flex-col relative shadow-2xl border-x border-white/5">
        
        {/* --- KOMPONEN HEADER (Profil, Energi, Progress Evolusi) --- */}
        <DashboardHeader 
          userData={userData}
          naviGreeting={naviGreeting}
          isEvolving={isEvolving}
          onLogout={() => setShowLogoutConfirm(true)}
          onShowGallery={() => setShowGallery(true)}
          onNavigateChat={() => navigate('/navi-chat')}
        />

        {/* --- KOMPONEN GRID TOMBOL NAVIGASI (KTA, Ranking, Struktur, Lencana) --- */}
        <ActionGrid 
          onShowKTA={() => setShowKTA(true)}
          onShowBadges={() => setShowBadges(true)}
          navigate={navigate}
        />

        {/* --- KOMPONEN SLIDER PENGUMUMAN --- */}
        <MissionBrief 
          announcements={announcements}
          userData={userData}
          onClaimXP={handleClaimXP}
        />

        {/* --- KOMPONEN RADAR PENCAPAIAN (Lencana Progres SKU) --- */}
        <AchievementRadar 
          userData={userData} 
          userBadges={userBadges} 
        />

        {/* --- KOMPONEN MODAL (Logout, Daily Reward, Detail Pengumuman) --- */}
        <DashboardModals 
          showLogoutConfirm={showLogoutConfirm}
          setShowLogoutConfirm={setShowLogoutConfirm}
          handleLogout={handleLogout}
          showDailyBonus={showDailyBonus}
          setShowDailyBonus={setShowDailyBonus}
          selectedAnnounce={selectedAnnounce}
          setSelectedAnnounce={setSelectedAnnounce}
        />

        {/* --- MODAL EXTERNAL (Lencana & Galeri) --- */}
        <AnimatePresence>
          {showBadges && (
            <ScoutBadges 
              userData={userData} 
              userBadges={userBadges} 
              onClose={() => setShowBadges(false)} 
            />
          )}
          {showGallery && ( 
            <ScoutGallery 
              userLevel={userData?.level || 1} 
              userData={userData} 
              onClose={() => setShowGallery(false)} 
            /> 
          )}
        </AnimatePresence>

        {/* --- MODAL KTA --- */}
        {showKTA && <KTAView userData={userData} onClose={() => setShowKTA(false)} />}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2.5s infinite linear; }
        .shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); }
      `}} />
    </div>
  );
}

export default AnggotaDashboard;