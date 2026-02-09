import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineX, HiOutlineDownload, HiOutlineBadgeCheck, 
  HiOutlineLockClosed, HiOutlineInformationCircle,
  HiOutlineClock
} from "react-icons/hi";
import { db } from "../../firebase";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ScoutBadges({ userBadges, userData, onClose, showModal }) {
  const navigate = useNavigate();
  
  /**
   * FIX LOGIKA TINGKATAN:
   * Menentukan tingkatan yang sedang dikerjakan saat ini (Active Mission)
   */
  const getTargetTingkat = () => {
    const t = userData?.tingkat?.toUpperCase() || "PENGGALANG";
    if (t === "PENGGALANG" || t === "BELUM ADA TINGKATAN") return "RAMU";
    if (t === "RAMU") return "RAKIT";
    if (t === "RAKIT") return "TERAP";
    return "TERAP"; 
  };

  const activeLevel = getTargetTingkat();
  
  // State viewLevel untuk kontrol Tab (Default ke misi aktif)
  const [viewLevel, setViewLevel] = useState(activeLevel);

  // Re-sync jika data profil user berubah di database
  useEffect(() => {
    setViewLevel(activeLevel);
  }, [activeLevel]);

  // Identifikasi apakah sedang melihat folder masa lalu atau misi aktif
  const isViewingCurrentActive = viewLevel === activeLevel;

  // List kategori statis agar UI tidak kosong saat pindah ke Tab Riwayat
  const categories = [
    { key: 'SPIRITUAL', name: 'Spiritual', color: 'yellow' },
    { key: 'EMOSIONAL', name: 'Emosional', color: 'red' },
    { key: 'SOSIAL', name: 'Sosial', color: 'blue' },
    { key: 'INTELEKTUAL', name: 'Intelektual', color: 'green' },
    { key: 'FISIK', name: 'Fisik', color: 'slate' }
  ];

  // --- FUNGSI KLAIM LENCANA ---
  const handleClaimBadge = async (badgeKey, badgeData) => {
    if (!userData?.docId) return;
    if (!isViewingCurrentActive) return;

    try {
      const userRef = doc(db, "users", userData.docId);
      
      await updateDoc(userRef, {
        [`claimedBadges.${badgeKey}_${viewLevel}`]: {
          tier: badgeData.tier,
          claimedAt: new Date().toISOString(),
          level: viewLevel,
          categoryName: badgeData.name,
          competency: badgeData.competency // Simpan deskripsi ke arsip agar history tetap informatif
        },
        points: increment(100),
        lastActivity: serverTimestamp()
      });

      showModal(
        "LENCANA TERBUKA! 🎖️", 
        `Selamat! Kamu berhasil mengklaim Lencana ${badgeData.name} (${badgeData.tier}) tingkat ${viewLevel}. Bonus +100 XP telah ditambahkan.`, 
        "success"
      );
    } catch (error) {
      console.error("Error claiming badge:", error);
      showModal("Gagal Klaim", "Terjadi gangguan sinkronisasi radar.", "danger");
    }
  };

  // --- PENGECEKAN DATA (Arsip vs Real-time) ---
  const getBadgeState = (key) => {
    const historyData = userData?.claimedBadges?.[`${key}_${viewLevel}`];
    const liveData = userBadges?.[key];

    // Jika ada di arsip, gunakan data arsip (Prioritas untuk History)
    if (historyData) {
      return { 
        claimed: true, 
        tier: historyData.tier, 
        name: historyData.categoryName, 
        competency: historyData.competency || "Misi telah diselesaikan.",
        percentage: 100,
        total: 0,
        currentCount: 0
      };
    }

    // Jika tidak ada di arsip, gunakan data live (Hanya jika viewLevel == activeLevel)
    if (isViewingCurrentActive && liveData) {
      return { ...liveData, claimed: false };
    }

    return null; // Terkunci
  };

  const getInstruction = (key) => {
    const agama = userData?.agama || "Agama";
    switch (key) {
      case 'SPIRITUAL': return `Tuntaskan SKU Poin 1-3 & Seluruh Paket Poin 4 (${agama}) tingkat ${viewLevel}.`;
      case 'EMOSIONAL': return `Selesaikan butir SKU kategori Emosional tingkat ${viewLevel}.`;
      case 'SOSIAL': return `Selesaikan seluruh misi interaksi sosial tingkat ${viewLevel}.`;
      case 'INTELEKTUAL': return `Kuasai butir IPTEK & materi Bahari tingkat ${viewLevel}.`;
      case 'FISIK': return `Tuntaskan standar kesehatan & pertumbuhan tingkat ${viewLevel}.`;
      default: return "Selesaikan seluruh butir SKU dalam kategori ini.";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md italic"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="p-8 bg-gradient-to-br from-red-900 via-[#450a0a] to-black flex justify-between items-center border-b border-white/5 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="relative z-10 text-left">
            <h2 className="text-2xl font-black uppercase text-white tracking-tighter leading-none">Status Lencana</h2>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <HiOutlineBadgeCheck /> Otoritas Radar: {viewLevel}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90 border border-white/10 relative z-10">
            <HiOutlineX size={24} />
          </button>
        </div>

        {/* NAVIGATION TAB */}
        <div className="flex bg-slate-950 p-2 border-b border-white/5 gap-1 shadow-inner">
          {["RAMU", "RAKIT", "TERAP"].map((lvl) => {
            const isActiveView = viewLevel === lvl;
            const levels = ["RAMU", "RAKIT", "TERAP"];
            // User tidak bisa melihat tingkat yang lebih tinggi dari apa yang sedang dia kerjakan sekarang
            const isLockedTab = levels.indexOf(lvl) > levels.indexOf(activeLevel);

            return (
              <button
                key={lvl}
                disabled={isLockedTab}
                onClick={() => setViewLevel(lvl)}
                className={`flex-1 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all ${
                  isActiveView 
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/40" 
                  : isLockedTab ? "opacity-10 cursor-not-allowed" : "text-slate-500 hover:bg-white/5"
                }`}
              >
                {lvl} {lvl === activeLevel && "⚡"}
              </button>
            );
          })}
        </div>

        {/* LIST LENCANA */}
        <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-6 bg-[#020617]">
          {categories.map((cat) => {
            const badge = getBadgeState(cat.key);
            const isLockedBadge = !badge;
            const claimed = badge?.claimed;

            return (
              <div key={cat.key} className={`relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                isLockedBadge 
                ? 'bg-black/40 border-white/5 opacity-50 grayscale' 
                : claimed ? 'bg-gradient-to-br from-emerald-900/10 to-transparent border-emerald-500/20' : 'bg-gradient-to-br from-slate-800/40 to-transparent border-white/10 shadow-xl'
              }`}>
                
                {(!claimed && badge?.tier) && (
                  <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
                )}

                <div className="flex items-start gap-5 relative z-10 text-left">
                  <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl relative shrink-0 border-2 transition-all duration-700 ${
                    badge?.tier === 'GOLD' ? 'bg-yellow-500/20 border-yellow-500/50 shadow-yellow-500/20' : 
                    badge?.tier === 'SILVER' ? 'bg-slate-400/20 border-slate-400/50 shadow-slate-400/20' : 
                    badge?.tier === 'BRONZE' ? 'bg-orange-800/20 border-orange-800/50 shadow-orange-800/20' : 
                    'bg-slate-800 border-white/5'
                  }`}>
                    {badge ? (
                      <motion.div animate={(!claimed && badge.tier) ? { rotateY: [0, 180, 360], scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 3 }}>
                        <HiOutlineBadgeCheck size={40} className={
                          badge.tier === 'GOLD' ? 'text-yellow-400' : 
                          badge.tier === 'SILVER' ? 'text-slate-300' : 'text-orange-500'
                        } />
                      </motion.div>
                    ) : (
                      <HiOutlineLockClosed size={30} className="text-slate-600" />
                    )}
                    
                    {badge?.tier && (
                      <div className={`absolute -bottom-2 px-2 py-0.5 rounded-md shadow-lg border border-white/10 ${badge.tier === 'GOLD' ? 'bg-yellow-600' : 'bg-slate-700'}`}>
                        <span className="text-[7px] font-black text-white uppercase tracking-tighter">{badge.tier}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-black uppercase text-sm tracking-tight ${isLockedBadge ? 'text-slate-600' : 'text-white'}`}>
                        {cat.name}
                      </h3>
                      {claimed && <span className="text-[7px] bg-emerald-500 text-white px-2 py-1 rounded-full font-black uppercase shadow-lg shadow-emerald-900/20">Tersimpan</span>}
                    </div>
                    
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight line-clamp-2 italic font-medium">
                      "{badge?.competency || getInstruction(cat.key)}"
                    </p>

                    {/* Progress Bar (Hanya untuk tingkatan aktif yang belum diklaim) */}
                    {isViewingCurrentActive && !claimed && badge && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                          <span>Status Pengisian</span>
                          <span className="text-emerald-400">{badge.currentCount} / {badge.total}</span>
                        </div>
                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(badge.percentage, 100)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${cat.key === 'SPIRITUAL' ? 'bg-yellow-500' : 'bg-red-500'}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
                  <div className="flex gap-2">
                    {/* Tombol Klaim (Hanya di tingkat aktif) */}
                    {isViewingCurrentActive && badge?.tier && !claimed && (
                      <button 
                        onClick={() => handleClaimBadge(cat.key, badge)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-900 hover:from-red-500 hover:to-red-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-950/40 active:scale-95 group"
                      >
                        <span className="group-hover:tracking-[0.3em] transition-all">⚡ Klaim Lencana {viewLevel} ⚡</span>
                      </button>
                    )}
                    
                    {/* Tombol Unduh Piagam (Tersedia untuk semua yang sudah diklaim) */}
                    {claimed && (
                      <button 
                        onClick={() => navigate(`/print-piagam/${cat.key}?level=${viewLevel}`)}
                        className="flex-1 bg-white text-black hover:bg-slate-200 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-colors"
                      >
                        <HiOutlineDownload size={16} /> Unduh Piagam {viewLevel}
                      </button>
                    )}

                    {/* Info Lock (Hanya di tingkat aktif) */}
                    {isLockedBadge && isViewingCurrentActive && (
                      <div className="flex-1 bg-white/5 py-3.5 rounded-2xl text-[8px] font-black text-slate-600 uppercase text-center border border-white/5 tracking-widest italic flex items-center justify-center gap-2">
                        <HiOutlineClock /> Radar: Misi Belum Tuntas
                      </div>
                    )}

                    {/* Info Riwayat Kosong */}
                    {!isViewingCurrentActive && !claimed && (
                       <div className="flex-1 bg-red-500/5 py-3.5 rounded-2xl text-[8px] font-black text-red-400 uppercase text-center border border-red-500/10 tracking-widest italic opacity-40">
                          Tidak diperoleh di tingkat {viewLevel}
                       </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-slate-950 text-center border-t border-white/5">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] leading-relaxed italic text-center w-full">
            Developed for <span className="text-red-500 font-bold">Laskar Bahari Navigator System</span> <br /> 
            v1.2 — Arsip Otoritas Manajemen Radar
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ScoutBadges;