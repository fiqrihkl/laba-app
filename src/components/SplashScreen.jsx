import React from "react";
import { motion } from "framer-motion";
import { HiOutlineSparkles } from "react-icons/hi";

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center italic selection:bg-red-800"
    >
      {/* 🌌 Atmosferik Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* 🛡️ Logo Animation - Tactical Glass Style */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: [0.5, 1.1, 1], opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "backOut" }}
          className="w-32 h-32 bg-white/5 backdrop-blur-2xl rounded-[3rem] flex items-center justify-center shadow-[0_0_100px_rgba(220,38,38,0.2)] mb-10 border border-white/10 group"
        >
          {/* Logo Laskar Bahari */}
          <motion.img
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            src="/logo/logo.png" 
            className="w-20 h-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            alt="Laskar Bahari Logo"
          />
        </motion.div>

        {/* 📝 Branding Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none italic">
            NAVIGASI <span className="text-red-600">APP</span>
          </h1>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">
            Navigator Digital Laskar Bahari
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-[1px] w-8 bg-red-900/50" />
            <HiOutlineSparkles className="animate-pulse text-red-500" size={14} />
            <div className="h-[1px] w-8 bg-red-900/50" />
          </div>
          <p className="text-[8px] font-black text-red-500 uppercase tracking-[0.5em] mt-2 opacity-60">Level Up Your Adventure</p>
        </motion.div>
      </div>

      {/* ⏳ Tactical Progress Bar */}
      <div className="absolute bottom-28 w-64 flex flex-col items-center">
        <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative border border-white/5">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-red-600 to-transparent"
            />
        </div>
        <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.6em] mt-4 animate-pulse">Initializing Data Link...</p>
      </div>

      {/* 👤 Footer Security Credits */}
      <div className="absolute bottom-10 text-center px-6">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] leading-relaxed italic">
          Developed by <span className="text-slate-400">Fiqri Haikal</span>
        </p>
        <p className="text-[7px] font-bold text-slate-800 uppercase tracking-[0.3em] mt-1">
          Secure Core v4.0 — SMPN 1 Biau
        </p>
      </div>
    </motion.div>
  );
}