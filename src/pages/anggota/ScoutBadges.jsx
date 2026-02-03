import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineX, HiOutlineDownload, HiOutlineBadgeCheck, 
  HiOutlineLockClosed, HiOutlineInformationCircle 
} from "react-icons/hi";
import { db } from "../../firebase";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ScoutBadges({ userBadges, userData, onClose, showModal }) {
  const navigate = useNavigate();

  // --- FUNGSI KLAIM LENCANA ---
  const handleClaimBadge = async (badgeKey, badgeData) => {
    if (!userData?.docId) return;

    try {
      const userRef = doc(db, "users", userData.docId);
      
      // Simpan data klaim ke Firestore secara dinamis
      await updateDoc(userRef, {
        [`claimedBadges.${badgeKey}`]: {
          tier: badgeData.tier,
          claimedAt: new Date().toISOString(),
          level: userData.tingkat || "Ramu",
          categoryName: badgeData.name
        },
        // Memberikan Reward XP (Base 100 XP) menggunakan increment agar aman
        points: increment(100),
        lastActivity: serverTimestamp()
      });

      showModal(
        "LENCANA TERBUKA! 🎖️", 
        `Selamat! Kamu berhasil mengklaim Lencana ${badgeData.name} (${badgeData.tier}). Bonus +100 XP telah ditambahkan ke sistem radar kamu.`, 
        "success"
      );
    } catch (error) {
      console.error("Error claiming badge:", error);
      showModal("Gagal Klaim", "Terjadi gangguan sinkronisasi radar, coba lagi nanti.", "danger");
    }
  };

  // --- PENGECEKAN KLAIM ---
  const isAlreadyClaimed = (key, currentTier) => {
    // Memastikan lencana sudah ada dan tier-nya cocok
    return userData?.claimedBadges?.[key]?.tier === currentTier;
  };

  // --- INSTRUKSI DINAMIS (Sesuai dengan target kurikulum) ---
  const getInstruction = (key) => {
    const agama = userData?.agama || "Agama";
    const tingkatTarget = () => {
        const t = userData?.tingkat?.toUpperCase() || "";
        if (t === "RAMU") return "RAKIT";
        if (t === "RAKIT") return "TERAP";
        return "RAMU";
    };

    switch (key) {
      case 'SPIRITUAL': 
        return `Tuntaskan SKU Poin 1-3 & Seluruh Paket Poin 4 (${agama}) tingkat ${tingkatTarget()}.`;
      case 'EMOSIONAL': 
        return `Selesaikan butir SKU kategori Emosional tingkat ${tingkatTarget()}.`;
      case 'SOSIAL': 
        return `Selesaikan seluruh misi interaksi sosial tingkat ${tingkatTarget()}.`;
      case 'INTELEKTUAL': 
        return `Kuasai butir IPTEK & materi Bahari tingkat ${tingkatTarget()}.`;
      case 'FISIK': 
        return `Tuntaskan standar kesehatan & pertumbuhan tingkat ${tingkatTarget()}.`;
      default: 
        return "Selesaikan seluruh butir SKU dalam kategori ini.";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl flex flex-col max-h-[90vh]"
      >
        {/* HEADER SECTION */}
        <div className="p-8 bg-gradient-to-br from-red-900 via-[#450a0a] to-black flex justify-between items-center border-b border-white/5 relative">
           <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
           <div className="relative z-10">
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Medal Case</h2>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] mt-2">Koleksi Kecakapan Bahari</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90 border border-white/10 relative z-10">
            <HiOutlineX size={24} />
          </button>
        </div>

        {/* LIST LENCANA CONTAINER */}
        <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-6 bg-[#020617]">
          {userBadges && Object.entries(userBadges).length > 0 ? (
            Object.entries(userBadges).map(([key, badge]) => {
              const claimed = isAlreadyClaimed(key, badge.tier);
              const canClaim = badge.tier && !claimed;
              const isLocked = !badge.tier;

              return (
                <div key={key} className={`relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                  isLocked 
                  ? 'bg-black/40 border-white/5 opacity-50 grayscale' 
                  : 'bg-gradient-to-br from-slate-800/40 to-transparent border-white/10 shadow-xl'
                }`}>
                  
                  {/* Animasi Cahaya untuk Lencana yang bisa diklaim */}
                  {canClaim && (
                    <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
                  )}

                  <div className="flex items-start gap-5 relative z-10">
                    {/* ICON BADGE LOGIC */}
                    <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl relative shrink-0 border-2 transition-all duration-700 ${
                      badge.tier === 'GOLD' ? 'bg-yellow-500/20 border-yellow-500/50 shadow-yellow-500/20' : 
                      badge.tier === 'SILVER' ? 'bg-slate-400/20 border-slate-400/50 shadow-slate-400/20' : 
                      badge.tier === 'BRONZE' ? 'bg-orange-800/20 border-orange-800/50 shadow-orange-800/20' : 
                      'bg-slate-800 border-white/5'
                    }`}>
                      {badge.tier ? (
                        <motion.div
                          animate={canClaim ? { 
                            rotateY: [0, 180, 360],
                            scale: [1, 1.1, 1],
                            filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                          } : {}}
                          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        >
                          <HiOutlineBadgeCheck size={40} className={
                            badge.tier === 'GOLD' ? 'text-yellow-400' : 
                            badge.tier === 'SILVER' ? 'text-slate-300' : 'text-orange-500'
                          } />
                        </motion.div>
                      ) : (
                        <HiOutlineLockClosed size={30} className="text-slate-600" />
                      )}
                      
                      {badge.tier && (
                        <div className={`absolute -bottom-2 px-2 py-0.5 rounded-md shadow-lg border border-white/10 ${
                          badge.tier === 'GOLD' ? 'bg-yellow-600' : 'bg-slate-700'
                        }`}>
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter">{badge.tier}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-black italic uppercase text-sm tracking-tight ${isLocked ? 'text-slate-600' : 'text-white'}`}>
                          {badge.name}
                        </h3>
                        {claimed && <span className="text-[7px] bg-emerald-500 text-white px-2 py-1 rounded-full font-black uppercase">Stored</span>}
                      </div>
                      
                      {!isLocked && (
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight line-clamp-2 italic font-medium">
                          "{badge.competency}"
                        </p>
                      )}

                      {/* PROGRESS BAR */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                          <span>Progress Capaian</span>
                          <span className={isLocked ? "" : "text-emerald-400"}>{badge.currentCount} / {badge.total}</span>
                        </div>
                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(badge.percentage, 100)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full relative ${
                              badge.color === 'yellow' ? 'bg-gradient-to-r from-yellow-700 to-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                              badge.color === 'red' ? 'bg-gradient-to-r from-red-700 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                              badge.color === 'blue' ? 'bg-gradient-to-r from-blue-700 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                              badge.color === 'green' ? 'bg-gradient-to-r from-green-700 to-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white'
                            }`}
                          >
                            {badge.percentage >= 100 && (
                                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
                    {(!claimed || isLocked) && (
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <HiOutlineInformationCircle className="text-blue-400 shrink-0" size={16} />
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                          {getInstruction(key)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {canClaim && (
                        <button 
                          onClick={() => handleClaimBadge(key, badge)}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-900 hover:from-red-500 hover:to-red-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-950/40 active:scale-95 group"
                        >
                          <span className="group-hover:tracking-[0.3em] transition-all">⚡ Klaim Lencana Bahari ⚡</span>
                        </button>
                      )}
                      
                      {claimed && badge.tier === 'GOLD' && (
                        <button 
                          onClick={() => navigate(`/print-piagam/${key}`)}
                          className="flex-1 bg-white text-black hover:bg-slate-200 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-colors"
                        >
                          <HiOutlineDownload size={16} /> Unduh Piagam Emas
                        </button>
                      )}

                      {claimed && badge.tier !== 'GOLD' && (
                        <div className="flex-1 bg-emerald-500/10 py-3.5 rounded-2xl text-[9px] font-black text-emerald-500 uppercase text-center border border-emerald-500/20 tracking-widest flex items-center justify-center gap-2">
                          <HiOutlineBadgeCheck /> Koleksi Terdaftar
                        </div>
                      )}

                      {isLocked && (
                        <div className="flex-1 bg-white/5 py-3.5 rounded-2xl text-[8px] font-black text-slate-600 uppercase text-center border border-white/5 tracking-widest italic">
                          Radar: Butuh Verifikasi Tambahan
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 opacity-30 uppercase font-black text-[10px] tracking-[0.3em]">
              Menunggu Sinkronisasi Data Lencana...
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-950 text-center border-t border-white/5">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] leading-relaxed italic">
            Developed for <span className="text-red-500 font-bold">Laskar Bahari Navigator System</span> <br /> 
            v1.2 — Otoritas Kurikulum Pangkalan
          </p>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
      `}} />
    </motion.div>
  );
}

export default ScoutBadges;