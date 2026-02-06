import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineLogout, HiOutlineGift, HiOutlineX } from "react-icons/hi";

const DashboardModals = ({ 
  showLogoutConfirm, setShowLogoutConfirm, handleLogout,
  showDailyBonus, setShowDailyBonus,
  selectedAnnounce, setSelectedAnnounce
}) => {
  return (
    <AnimatePresence>
      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 w-full max-w-xs rounded-[3rem] p-10 text-center shadow-3xl border border-white/10">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/30"><HiOutlineLogout size={40} className="text-red-500" /></div>
            <h3 className="text-xl font-black uppercase italic text-white mb-2 tracking-tighter">Izin Pesiar?</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">Yakin mau keluar dari sistem Navigasi App?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Ya, Logout</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-white/5 text-slate-400 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 active:scale-95 transition-all">Batal</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* DAILY BONUS */}
      {showDailyBonus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-[#0f172a] w-full max-w-xs rounded-[4rem] p-12 text-center shadow-3xl border border-white/10 relative overflow-hidden">
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30"><HiOutlineGift size={56} className="text-yellow-500 animate-bounce" /></div>
            <h2 className="text-3xl font-black italic uppercase text-white leading-none">Daily Reward</h2>
            <div className="flex items-center justify-center gap-2 my-10"><span className="text-7xl font-black text-white italic tracking-tighter">+100</span><span className="text-2xl font-black text-yellow-500 italic">XP</span></div>
            <p className="text-[11px] font-bold text-emerald-400 mb-6 uppercase tracking-widest">Energi +40 & Streak +1!</p>
            <button onClick={() => setShowDailyBonus(false)} className="w-full bg-red-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Siap Berlayar!</button>
          </motion.div>
        </motion.div>
      )}

      {/* ANNOUNCEMENT DETAIL */}
      {selectedAnnounce && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 500 }} className="bg-slate-950 w-full max-w-sm rounded-[3.5rem] overflow-hidden border border-white/10 shadow-3xl">
            <div className="p-12 bg-gradient-to-br from-[#7f1d1d] to-[#450a0a] text-white relative">
              <button onClick={() => setSelectedAnnounce(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><HiOutlineX size={32} /></button>
              <span className="text-[10px] font-black uppercase bg-black/30 px-4 py-1.5 rounded-full border border-white/10">{selectedAnnounce.category}</span>
              <h2 className="text-3xl font-black italic uppercase mt-8 leading-tight tracking-tighter">{selectedAnnounce.title}</h2>
            </div>
            <div className="p-12 text-sm font-bold text-slate-400 italic leading-relaxed mb-6 max-h-[300px] overflow-y-auto custom-scroll">
              {selectedAnnounce.message || "Tetap aktif bersama Laskar Bahari!"}
              <button onClick={() => setSelectedAnnounce(null)} className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mt-10">Paham!</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DashboardModals;