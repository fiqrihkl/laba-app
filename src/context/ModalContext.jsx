import React, { createContext, useContext, useState } from "react";
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
    show: false, title: "", message: "", type: "success", onConfirm: null 
  });

  const showModal = (title, message, type = "success", onConfirm = null) => {
    setModal({ show: true, title, message, type, onConfirm });
  };

  const closeModal = () => setModal({ ...modal, show: false });

  // Helper untuk menentukan warna berdasarkan tipe
  const getModalTheme = () => {
    switch (modal.type) {
      case 'danger': return { icon: <HiOutlineExclamation />, color: 'text-red-500', bgIcon: 'bg-red-500/10', btn: 'bg-red-600' };
      case 'info': return { icon: <HiOutlineInformationCircle />, color: 'text-blue-500', bgIcon: 'bg-blue-500/10', btn: 'bg-blue-600' };
      default: return { icon: <HiOutlineCheckCircle />, color: 'text-emerald-500', bgIcon: 'bg-emerald-500/10', btn: 'bg-emerald-600' };
    }
  };

  const theme = getModalTheme();

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 italic font-medium selection:bg-red-800">
            {/* Backdrop dengan Blur Tinggi */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl"
            />

            {/* Modal Card - Glassmorphism Style */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900/60 w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 overflow-hidden"
            >
              {/* Background Glow Effect */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 opacity-20 blur-[60px] rounded-full ${modal.type === 'danger' ? 'bg-red-600' : 'bg-blue-600'}`} />

              {/* Icon Container */}
              <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner relative overflow-hidden ${theme.bgIcon}`}>
                <div className="text-4xl relative z-10">
                   {React.cloneElement(theme.icon, { className: theme.color })}
                </div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute inset-0 opacity-10"
                >
                  <HiOutlineLightningBolt className={`w-full h-full ${theme.color}`} />
                </motion.div>
              </div>

              {/* Text Content */}
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">
                  {modal.title}
                </h2>
                <p className="text-[12px] font-bold text-slate-400 leading-relaxed italic mb-10 px-2">
                  {modal.message}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-4 relative z-10">
                <button 
                  onClick={() => { if(modal.onConfirm) modal.onConfirm(); closeModal(); }}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all active:scale-95 text-white ${theme.btn} shadow-black/20`}
                >
                  {modal.onConfirm ? "Execute Order" : "Understood"}
                </button>
                
                {modal.onConfirm && (
                  <button 
                    onClick={closeModal} 
                    className="text-[10px] font-black uppercase text-slate-500 tracking-widest py-2 hover:text-white transition-colors"
                  >
                    Abort Mission
                  </button>
                )}
              </div>

              {/* Decorative Brand Tag */}
              <div className="mt-8 pt-6 border-t border-white/5 opacity-20">
                <p className="text-[7px] font-black uppercase tracking-[0.5em] text-white">Laskar Bahari Tactical Hub</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);