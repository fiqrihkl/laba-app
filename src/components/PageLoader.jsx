import React from "react";
import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50"
    >
      {/* Container untuk Animasi Ring */}
      <div className="relative flex items-center justify-center">
        {/* Ring Luar yang Berputar */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-slate-200 border-t-indigo-600 rounded-full"
        />
        
        {/* Ikon atau Dot di Tengah */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-8 h-8 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200"
        />
      </div>

      {/* Teks Loading */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          NAVIGASI
        </h2>
        <div className="flex items-center gap-1 mt-1 justify-center">
          <span className="text-sm text-slate-500 font-medium">Menyiapkan data</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
            className="text-indigo-600 font-bold"
          >
            ...
          </motion.span>
        </div>
      </motion.div>

      {/* Bar Progress Halus di Bawah (Opsional) */}
      <div className="absolute bottom-10 w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-indigo-500"
        />
      </div>
    </motion.div>
  );
};

export default PageLoader;