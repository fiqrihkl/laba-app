import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Konfirmasi", 
  cancelText = "Batal", 
  type = "danger",
  // PROPS BARU UNTUK INPUT ALASAN
  showInput = false,
  inputValue = "",
  onInputChange = () => {},
  inputPlaceholder = "Tulis alasan di sini..."
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-sm">
          {/* Overlay klik luar untuk membatalkan */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative z-10"
          >
            {/* ICON DYNAMIC COLOR */}
            <div className={`w-20 h-20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center transition-colors duration-500 ${
              type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
            }`}>
              <HiOutlineExclamationCircle size={40} className={type === 'danger' ? 'animate-pulse' : ''} />
            </div>
            
            <h3 className="text-white font-black uppercase tracking-tight text-xl mb-2 leading-none italic">
              {title}
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic mb-6 leading-relaxed px-2">
              {message}
            </p>

            {/* INPUT FIELD DYNAMIC (Hanya muncul jika showInput true) */}
            {showInput && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <textarea
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-[11px] font-bold text-slate-300 outline-none focus:border-red-500/50 transition-all resize-none h-24 uppercase italic tracking-tighter"
                />
                <p className="text-[8px] text-slate-600 mt-2 uppercase font-black tracking-tighter">* Alasan akan tercatat di log sistem</p>
              </motion.div>
            )}

            <div className="flex flex-col gap-3">
              {/* TOMBOL KONFIRMASI */}
              <button 
                onClick={onConfirm}
                className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] italic shadow-2xl transition-all active:scale-95 ${
                  type === 'danger' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-red-900/20' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-blue-900/20'
                }`}
              >
                {confirmText}
              </button>

              {/* TOMBOL BATAL */}
              <button 
                onClick={onCancel}
                className="w-full py-3 text-slate-600 font-black uppercase text-[9px] tracking-[0.2em] hover:text-white transition-colors italic"
              >
                {cancelText}
              </button>
            </div>

            {/* AKSEN DEKORATIF (OPTIONAL) */}
            <div className="absolute top-4 right-8 opacity-5 font-black text-4xl italic select-none pointer-events-none text-white">
              !
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}