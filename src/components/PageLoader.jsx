import React from "react";
import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] overflow-hidden"
    >
      {/* Efek Radar di Latar Belakang */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-red-500 rounded-full"
        />
      </div>

      {/* Container Utama Animasi */}
      <div className="relative flex items-center justify-center">
        {/* Ring Luar Dinamis (Style Radar Navigasi) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-2 border-dashed border-red-900/30 rounded-full"
        />
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute w-24 h-24 border-t-2 border-b-2 border-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)]"
        />
        
        {/* LOGO GUDEP DI TENGAH */}
        <motion.div
          animate={{ 
            scale: [0.95, 1.05, 0.95],
            filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] 
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-16 h-16 flex items-center justify-center"
        >
          <img 
            src="/logo/logo.png" 
            alt="Logo Gudep" 
            className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
            onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/1022/1022213.png" }}
          />
        </motion.div>
      </div>

      {/* Teks Identitas Navigasi */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 text-center italic"
      >
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
          NAVI<span className="text-red-600 text-sm italic ml-1">GASI</span>
        </h2>
        
        <div className="flex flex-col items-center gap-1 mt-3">
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
                Sinkronisasi Radar
             </span>
          </div>
          
          <motion.div 
            className="flex gap-1 mt-1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="w-1 h-1 bg-red-600 rounded-full" />
            <span className="w-1 h-1 bg-red-600 rounded-full" />
            <span className="w-1 h-1 bg-red-600 rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Bar Progress Bawah - Gaya Navigator */}
      <div className="absolute bottom-12 w-40 h-[2px] bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          animate={{ 
            left: ["-100%", "100%"],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute w-1/2 h-full bg-gradient-to-r from-transparent via-red-600 to-transparent"
        />
      </div>

      {/* Footer Label */}
      <div className="absolute bottom-6 opacity-20">
         <p className="text-[7px] font-black text-white uppercase tracking-[0.5em]">
            Otoritas Laskar Bahari v1.2
         </p>
      </div>
    </motion.div>
  );
};

export default PageLoader;