import React, { createContext, useContext, useState } from 'react';
// Pastikan path ini sesuai dengan letak file ConfirmModal.jsx Anda
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger",
    confirmText: "Konfirmasi",
    cancelText: "Batal"
  });

  /**
   * Fungsi untuk memicu kemunculan modal konfirmasi
   * @param {Object} params - Objek konfigurasi modal
   */
  const confirm = ({ 
    title, 
    message, 
    onConfirm, 
    type = "danger", 
    confirmText = "Execute", 
    cancelText = "Abort" 
  }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: () => {
        // Eksekusi fungsi yang dikirim dari halaman
        if (onConfirm) onConfirm();
        // Otomatis tutup modal setelah konfirmasi
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const close = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {/* Komponen Modal yang akan muncul secara global di dalam provider */}
      <ConfirmModal 
        {...modalConfig} 
        onCancel={close}
      />
    </ConfirmContext.Provider>
  );
};

// Hook kustom agar mudah dipanggil di halaman lain
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};