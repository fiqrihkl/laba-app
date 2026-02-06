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
    cancelText: "Batal",
    // STATE BARU UNTUK INPUT ALASAN
    showInput: false,
    inputValue: "",
    inputPlaceholder: "Tulis alasan di sini..."
  });

  /**
   * Fungsi untuk memicu kemunculan modal konfirmasi
   * Mendukung penambahan input teks jika showInput bernilai true
   */
  const confirm = ({ 
    title, 
    message, 
    onConfirm, 
    type = "danger", 
    confirmText = "Execute", 
    cancelText = "Abort",
    showInput = false,
    inputPlaceholder = "Tulis alasan di sini..."
  }) => {
    // Reset input setiap kali confirm dipanggil
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      showInput,
      inputPlaceholder,
      inputValue: "", // Reset string kosong
      onConfirm: (currentInputValue) => {
        // Mengirimkan inputValue kembali ke fungsi pemanggil
        if (onConfirm) onConfirm(currentInputValue);
        // Otomatis tutup modal
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const close = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // Fungsi internal untuk mengupdate tulisan saat user mengetik di modal
  const handleInputChange = (val) => {
    setModalConfig(prev => ({ ...prev, inputValue: val }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {/* Komponen Modal dengan sinkronisasi state input */}
      <ConfirmModal 
        {...modalConfig} 
        onCancel={close}
        onInputChange={handleInputChange} // Meneruskan fungsi perubahan teks
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