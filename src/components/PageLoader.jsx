import React from "react";
import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col items-center justify-center italic"
    >
      {/* Efek Cahaya Halus */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full"></div>

      <div className="relative flex flex-col items-center">
        {/* Spinner Premium Custom */}
        <div className="relative w-16 h-16 mb-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-full h-full border-4 border-slate-100 border-t-blue-600 rounded-full"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img src="/logo/logo.png" className="w-6 h-6 object-contain" alt="L" />
          </motion.div>
        </div>

        {/* Text Loading */}
        <div className="text-center">
          <p className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] animate-pulse">
            Sinkronisasi Radar...
          </p>
          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            LAskar BAhari Application
          </p>
        </div>
      </div>
    </motion.div>
  );
}