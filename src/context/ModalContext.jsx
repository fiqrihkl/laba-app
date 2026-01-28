import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineX } from "react-icons/hi";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({ 
    show: false, title: "", message: "", type: "success", onConfirm: null 
  });

  const showModal = (title, message, type = "success", onConfirm = null) => {
    setModal({ show: true, title, message, type, onConfirm });
  };

  const closeModal = () => setModal({ ...modal, show: false });

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md italic">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl border border-slate-100"
            >
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${modal.type === 'danger' ? 'bg-red-50' : 'bg-green-50'}`}>
                {modal.type === 'danger' ? <HiOutlineExclamation className="w-10 h-10 text-red-500" /> : <HiOutlineCheckCircle className="w-10 h-10 text-green-500" />}
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{modal.title}</h2>
              <p className="text-[11px] font-bold text-slate-400 mb-8">{modal.message}</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { if(modal.onConfirm) modal.onConfirm(); closeModal(); }}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 ${modal.type === 'danger' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}
                >
                  {modal.onConfirm ? "Ya, Lanjutkan" : "Dimengerti"}
                </button>
                {modal.onConfirm && (
                  <button onClick={closeModal} className="text-[10px] font-black uppercase text-slate-400 tracking-widest py-2">Batal</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);