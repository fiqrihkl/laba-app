import React from "react";
import { motion } from "framer-motion";

const AchievementRadar = ({ userData, userBadges }) => {
  return (
    <div className="px-6 mt-6 mb-40">
      <div className="bg-slate-900/40 rounded-[3.5rem] border border-white/5 p-10 shadow-inner">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[11px] font-black uppercase text-slate-500 italic tracking-[0.3em]">Achievement Radar</h2>
          <div className="bg-red-600/10 px-3 py-1 rounded-full border border-red-600/20">
            <span className="text-[9px] font-black text-red-500 uppercase">{userData?.tingkat || 'RAMU'}</span>
          </div>
        </div>

        <div className="space-y-8">
          {userBadges ? (
            Object.entries(userBadges).map(([key, badge]) => (
              <div key={key} className="group cursor-help">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${badge.isMax ? 'animate-ping' : ''}`} style={{ backgroundColor: badge.color }} />
                    <span>{badge.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg transition-all ${badge.isMax ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-slate-500'}`}>
                    {badge.currentCount} / {badge.total}
                  </span>
                </div>
                
                <div className="w-full bg-black h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${badge.percentage}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full relative ${
                      badge.color === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-yellow-300' :
                      badge.color === 'red' ? 'bg-gradient-to-r from-red-600 to-orange-400' :
                      badge.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-cyan-400' :
                      badge.color === 'green' ? 'bg-gradient-to-r from-green-600 to-emerald-400' :
                      'bg-gradient-to-r from-slate-600 to-slate-300'
                    }`} 
                  >
                    {badge.isMax && ( <div className="absolute inset-0 bg-white/20 animate-shimmer" /> )}
                  </motion.div>
                </div>
                {key === 'SPIRITUAL' && badge.currentCount < badge.total && (
                  <p className="text-[7px] font-bold text-slate-600 uppercase mt-2 ml-1 italic tracking-tighter"> 
                    * Poin 4 ({userData?.agama}) sinkron dengan database pusat. 
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest"> 
              Menghitung Koordinat Lencana... 
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementRadar;