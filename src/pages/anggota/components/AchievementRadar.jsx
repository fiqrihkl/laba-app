import React from "react";
import { motion } from "framer-motion";

const AchievementRadar = ({ userData, userBadges }) => {
  /**
   * LOGIKA TARGET TINGKAT:
   * Menentukan label tingkatan mana yang sedang dikejar/ditampilkan progresnya.
   */
  const getTargetLabel = () => {
    const t = userData?.tingkat?.toUpperCase() || "PENGGALANG";
    if (t === "PENGGALANG" || t === "BELUM ADA TINGKATAN") return "RAMU";
    if (t === "RAMU") return "RAKIT";
    if (t === "RAKIT") return "TERAP";
    return t; // Tetap TERAP jika sudah maksimal
  };

  const targetTingkat = getTargetLabel();

  return (
    <div className="px-6 mt-6 mb-40 italic">
      <div className="bg-slate-900/40 rounded-[3.5rem] border border-white/5 p-10 shadow-inner backdrop-blur-sm">
        {/* HEADER RADAR */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Radar Progres SKU</h2>
            <p className="text-[8px] text-slate-600 uppercase font-bold mt-1 tracking-widest">Sinkronisasi Misi Aktif</p>
          </div>
          <div className="bg-red-600/10 px-4 py-1.5 rounded-full border border-red-600/20 shadow-lg shadow-red-900/20">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">
              TARGET: {targetTingkat}
            </span>
          </div>
        </div>

        {/* LIST PROGRES PER KATEGORI */}
        <div className="space-y-8">
          {userBadges ? (
            Object.entries(userBadges).map(([key, badge]) => (
              <div key={key} className="group cursor-help">
                {/* LABEL & ANGKA */}
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full shadow-lg ${badge.isMax ? 'animate-ping' : ''}`} 
                      style={{ backgroundColor: badge.color }} 
                    />
                    <span className="group-hover:text-white transition-colors">{badge.name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg transition-all border ${
                    badge.isMax 
                    ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' 
                    : 'bg-white/5 text-slate-500 border-white/5'
                  }`}>
                    {badge.currentCount} / {badge.total}
                  </span>
                </div>
                
                {/* PROGRESS BAR CONTAINER */}
                <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5 relative">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${Math.min(badge.percentage, 100)}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full relative shadow-lg ${
                      badge.color === 'yellow' ? 'bg-gradient-to-r from-yellow-700 to-yellow-300' :
                      badge.color === 'red' ? 'bg-gradient-to-r from-red-700 to-orange-500' :
                      badge.color === 'blue' ? 'bg-gradient-to-r from-blue-700 to-cyan-500' :
                      badge.color === 'green' ? 'bg-gradient-to-r from-green-700 to-emerald-500' :
                      'bg-gradient-to-r from-slate-600 to-slate-400'
                    }`} 
                  >
                    {/* EFEK SHIMMER UNTUK YANG SUDAH MAX */}
                    {badge.isMax && (
                      <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                    )}
                  </motion.div>
                </div>

                {/* INFO TAMBAHAN SPESIFIK */}
                {key === 'SPIRITUAL' && badge.currentCount < badge.total && (
                  <div className="flex items-center gap-1.5 mt-2.5 ml-1">
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    <p className="text-[7px] font-bold text-slate-600 uppercase italic tracking-tighter"> 
                      * Poin 4 ({userData?.agama || 'Agama'}) terintegrasi otomatis dengan radar pusat. 
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              <p className="italic text-[10px] font-black uppercase tracking-[0.4em]"> 
                Memindai Koordinat Capaian... 
              </p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
      `}} />
    </div>
  );
};

export default AchievementRadar;