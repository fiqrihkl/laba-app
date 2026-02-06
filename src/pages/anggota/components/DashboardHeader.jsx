import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiFire, HiOutlineLogout, HiOutlineStar, HiOutlineArchive, HiLightningBolt } from "react-icons/hi";
import { HiLightningBolt as HiBoltSolid } from "react-icons/hi";
import VakiAvatar from "../VakiAvatar";
import BeriSemangat from "../BeriSemangat";

const DashboardHeader = ({ 
  userData, 
  naviGreeting, 
  isEvolving, 
  onLogout, 
  onShowGallery,
  onNavigateChat
}) => {
  return (
    <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] px-6 pt-12 pb-24 relative overflow-visible rounded-b-[4rem] shadow-3xl z-[100]">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-b-[4rem]" />

      {/* Profil & Logout Row */}
      <div className="flex justify-between items-center relative z-[110] mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-slate-800 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-black text-xl tracking-tighter uppercase rounded-xl">
                  {userData?.nama ? userData.nama.substring(0, 2) : "LB"}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg">
              <HiFire className="text-yellow-400 animate-pulse" /> {userData?.streakCount || 1}
            </div>
            <div className="absolute -top-3 -left-3 bg-yellow-500 text-slate-900 px-2 py-1 rounded-lg text-[10px] font-black shadow-xl border-2 border-[#450a0a]">LV.{userData?.level || 1}</div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{userData?.nama?.split(' ')[0] || "Laskar"}</h1>
            <p className="text-[10px] font-black text-red-400 uppercase mt-1 tracking-widest">
               {userData?.energy < 30 ? "Exhausted Scout" : "Official Member"}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className="w-10 h-10 bg-white/5 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-red-600 transition-all active:scale-90 relative z-[120]">
          <HiOutlineLogout size={20} />
        </button>
      </div>

      {/* Vaki Avatar & Greeting Area */}
      <div className="mt-28 flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={naviGreeting}
            initial={{ opacity: 0, y: 10, scale: 0.8 }} 
            animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
            className={`absolute -top-24 z-30 backdrop-blur-2xl p-5 rounded-[2.5rem] text-[11px] font-black w-[85%] max-w-[280px] shadow-3xl border border-white/10 italic leading-relaxed text-center ${userData?.energy < 30 ? 'bg-red-900/80 text-red-100 border-red-500/40' : 'bg-white/10 text-white'}`}
          >
            "{naviGreeting}"
            <div className="text-[7px] mt-2 opacity-50 uppercase tracking-[0.3em] font-bold">Tap NAVI untuk bagi ceritamu hari ini</div>
            <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b border-white/10 ${userData?.energy < 30 ? 'bg-[#7f1d1d]' : 'bg-slate-800'}`}></div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center w-full relative mt-3">
          <motion.div layout className="relative w-64 h-64 cursor-pointer z-10" whileTap={{ scale: 0.95 }} onClick={onNavigateChat}>
            <VakiAvatar level={userData?.level || 1} userData={userData} isEvolving={isEvolving} className="w-full h-full" />
          </motion.div>
          <div className="relative z-20 flex items-center justify-center"> 
            <AnimatePresence mode="wait">
              <BeriSemangat userData={userData} />
            </AnimatePresence>
          </div>
        </div>

        {/* XP Points Display */}
        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className="mt-0 flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <motion.span layout className="text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
              {userData?.points || 0}
            </motion.span>
            <div className="flex flex-col text-yellow-400 leading-none">
              <HiLightningBolt size={32} className="animate-pulse" />
              <span className="text-2xl font-black italic">XP</span>
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
            Current <span className="text-yellow-500">Power Level</span>
          </p>
        </motion.div>
      </div>

      {/* Progress Bars Container */}
      <div className="mt-10 bg-black/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 relative z-10 shadow-3xl">
        <div className="flex justify-between items-center mb-6 px-2">
           <div className="bg-yellow-500/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-yellow-500/20">
            <HiOutlineStar className="text-yellow-400" />
            <span className="text-[11px] font-black text-yellow-500 uppercase tracking-tighter">LV. {userData?.level || 1}</span>
          </div>
          <button onClick={onShowGallery} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-white/5 shadow-inner">
            <HiOutlineArchive className="text-red-500" />
            <span className="text-[11px] font-black uppercase text-slate-300">Petualangan</span>
          </button>
        </div>
        
        {/* Energy Bar */}
        <div className="mb-6 px-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <HiBoltSolid className={userData?.energy < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"} /> Energi NAVI
            </span>
            <span className={`text-[10px] font-black ${userData?.energy < 30 ? 'text-red-500' : 'text-white'}`}>{userData?.energy || 100}%</span>
          </div>
          <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: `${userData?.energy || 100}%` }} className={`h-full rounded-full transition-colors duration-500 ${userData?.energy < 30 ? "bg-gradient-to-r from-red-600 to-orange-500" : "bg-gradient-to-r from-emerald-600 to-cyan-400"}`} />
          </div>
        </div>

        {/* XP Progression Bar */}
        <div className="flex justify-between items-center mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
          <span className="flex items-center gap-1 text-green-400"><HiOutlineStar className="w-3 h-3"/> Progression</span>
          <span>{Math.max(0, 2000 - (userData?.points || 0))} XP to Evolusi</span>
        </div>
        <div className="w-full bg-black/60 h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((userData?.points || 0) / 2000) * 100, 100)}%` }} className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full relative">
            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;