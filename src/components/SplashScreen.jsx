import React from "react";
import { motion } from "framer-motion";
import { HiOutlineSparkles } from "react-icons/hi";

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center italic"
    >
      {/* 🌌 Efek Cahaya Latar Premium */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/20 blur-[120px] rounded-full"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* 🛡️ Logo Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: [0.5, 1.1, 1], opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "backOut" }}
          className="w-28 h-28 bg-white rounded-[2.8rem] flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.4)] mb-8 border-4 border-white/10"
        >
          {/* Logo Gambar Aplikasi */}
          <img
            src="/logo/logo.png" // Path otomatis mengarah ke folder public
            className="w-16 h-16 object-contain"
            alt="Laskar Bahari Logo"
            />
        </motion.div>

        {/* 📝 Text Branding Animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-lg">
            LABA <span className="text-blue-500">APP</span>
          </h1>
          
          {/* Kepanjangan LABA APP */}
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-2 opacity-90">
            LAskar BAhari Application
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 text-white/40">
            <HiOutlineSparkles className="animate-pulse text-yellow-500" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em]">Level Up Your Adventure</p>
          </div>
        </motion.div>
      </div>

      {/* ⏳ Progress Bar Loader */}
      <div className="absolute bottom-28 w-56 h-[3px] bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        />
      </div>

      {/* 👤 Footer Identity Developer */}
      <div className="absolute bottom-10 text-center px-6">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] leading-relaxed">
          Developed by <span className="text-slate-400">Fiqri Haikal</span>
        </p>
        <p className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">
          © 2026 — Laskar Bahari SMPN 1 Biau
        </p>
      </div>
    </motion.div>
  );
}