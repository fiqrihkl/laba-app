import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineCheckCircle, 
  HiOutlineExclamation, 
  HiOutlineX, 
  HiOutlineInformationCircle,
  HiOutlineLightningBolt
} from "react-icons/hi";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({ 
    show: false, 
    title: "", 
    message: "", 
    type: "success", 
    onConfirm: null 
  });

  /**
   * Menggunakan useCallback agar fungsi showModal tidak berubah-ubah referensinya.
   * Ini krusial jika showModal dijadikan dependensi di dalam useEffect komponen lain.
   */
  const showModal = useCallback((title, message, type = "success", onConfirm = null) => {
    setModal({ 
      show: true, 
      title, 
      message, 
      type, 
      onConfirm 
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, show: false }));
  }, []);

  // Lock scroll saat modal aktif untuk UX yang lebih baik
  useEffect(() => {
    if (modal.show) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      // Listener tombol ESC untuk menutup modal secara instan
      const handleEsc = (e) => { 
        if (e.key === 'Escape') closeModal(); 
      };
      
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [modal.show, closeModal]);

  // Helper Tema Tactical untuk visual yang konsisten
  const getModalTheme = () => {
    switch (modal.type) {
      case 'danger': 
        return { 
          icon: <HiOutlineExclamation />, 
          color: 'text-red-500', 
          bgIcon: 'bg-red-500/10', 
          btn: 'bg-gradient-to-r from-red-600 to-red-900',
          glow: 'bg-red-600'
        };
      case 'info': 
        return { 
          icon: <HiOutlineInformationCircle />, 
          color: 'text-blue-500', 
          bgIcon: 'bg-blue-500/10', 
          btn: 'bg-gradient-to-r from-blue-600 to-blue-900',
          glow: 'bg-blue-600'
        };
      default: 
        return { 
          icon: <HiOutlineCheckCircle />, 
          color: 'text-emerald-500', 
          bgIcon: 'bg-emerald-500/10', 
          btn: 'bg-gradient-to-r from-emerald-600 to-emerald-900',
          glow: 'bg-emerald-600'
        };
    }
  };

  const theme = getModalTheme();

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 italic font-medium selection:bg-red-800">
            {/* Backdrop dengan Blur Tinggi - Klik di luar untuk menutup */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl"
            />

            {/* Modal Card - Tactical Glassmorphism Style */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-slate-900/40 w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.7)] border border-white/10 relative z-10 overflow-hidden"
            >
              {/* Background Glow Effect - Menambah kedalaman visual */}
              <div className={`absolute -top-20 -right-20 w-48 h-48 opacity-20 blur-[80px] rounded-full ${theme.glow}`} />

              {/* Tactical Close Button (Corner) */}
              <button 
                onClick={closeModal}
                className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors p-2"
                aria-label="Close Modal"
              >
                <HiOutlineX size={24} />
              </button>

              {/* Icon Container dengan Animasi Background */}
              <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner relative overflow-hidden ${theme.bgIcon}`}>
                <div className="text-4xl relative z-10">
                   {React.cloneElement(theme.icon, { className: theme.color })}
                </div>
                
                {/* Background Rotating Bolt - Memberikan kesan sistem yang sedang bekerja */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  className="absolute inset-0 opacity-10 flex items-center justify-center"
                >
                  <HiOutlineLightningBolt className={`w-16 h-16 ${theme.color}`} />
                </motion.div>
              </div>

              {/* Text Content */}
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">
                  {modal.title}
                </h2>
                <p className="text-[12px] font-bold text-slate-400 leading-relaxed italic mb-10 px-4">
                  {modal.message}
                </p>
              </div>
              
              {/* Action Buttons Section */}
              <div className="flex flex-col gap-4 relative z-10">
                <button 
                  autoFocus // Mengarahkan fokus otomatis saat modal muncul
                  onClick={() => { 
                    if(modal.onConfirm) modal.onConfirm(); 
                    closeModal(); 
                  }}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 text-white ${theme.btn} shadow-black/40`}
                >
                  {modal.onConfirm ? "Akses Otoritas" : "MENGERTI"}
                </button>
                
                {modal.onConfirm && (
                  <button 
                    onClick={closeModal} 
                    className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] py-2 hover:text-red-500 transition-colors"
                  >
                    Batalkan Operasi
                  </button>
                )}
              </div>

              {/* Decorative Brand Tag - Identitas Laskar Bahari Core */}
              <div className="mt-10 pt-6 border-t border-white/5 opacity-30 flex items-center justify-center gap-2">
                <div className="h-px w-4 bg-white/20"></div>
                <p className="text-[8px] font-black uppercase tracking-[0.6em] text-white/50">LASKAR BAHARI CORE</p>
                <div className="h-px w-4 bg-white/20"></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};