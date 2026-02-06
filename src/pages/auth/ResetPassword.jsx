import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import { 
  HiOutlineLockClosed, 
  HiOutlineShieldCheck, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineArrowNarrowLeft,
  HiOutlineExclamationCircle
} from "react-icons/hi";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(null); // null: checking, true: valid, false: invalid
  const [emailUser, setEmailUser] = useState("");

  const navigate = useNavigate();
  const { showModal } = useModal();
  
  // Menangkap oobCode (Out of Band Code) yang dikirim Firebase melalui email
  const oobCode = searchParams.get("oobCode");

  // Validasi kode keamanan dari URL segera setelah halaman dimuat
  useEffect(() => {
    if (!oobCode) {
      setIsValidCode(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmailUser(email);
        setIsValidCode(true);
      })
      .catch((error) => {
        console.error("Verification Error:", error);
        setIsValidCode(false);
      });
  }, [oobCode]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showModal("Proteksi Lemah", "Password minimal harus terdiri dari 6 karakter.", "danger");
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal("Ketidakcocokan", "Konfirmasi password tidak sesuai dengan password baru.", "danger");
      return;
    }

    setLoading(true);
    try {
      // Mengirimkan password baru ke Firebase menggunakan oobCode
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      showModal(
        "Berhasil", 
        "Kata sandi Anda telah diperbarui. Silakan masuk kembali dengan kredensial baru Anda.", 
        "success"
      );
      
      // Kembali ke halaman login setelah sukses
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      showModal("Gagal Eksekusi", "Tautan ini telah kedaluwarsa atau sudah pernah digunakan sebelumnya.", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Tampilan jika link tidak valid atau oobCode salah/expired
  if (isValidCode === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 italic">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center bg-slate-900/40 p-12 rounded-[3rem] border border-white/5 backdrop-blur-xl"
        >
          <HiOutlineExclamationCircle size={60} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-white font-black text-2xl uppercase tracking-tighter mb-4">Otorisasi Gagal</h1>
          <p className="text-slate-500 text-[10px] mb-10 uppercase tracking-[0.2em] leading-relaxed">
            Tautan pemulihan tidak valid atau sudah kedaluwarsa.<br />Silakan ajukan permintaan reset password kembali.
          </p>
          <button 
            onClick={() => navigate("/")} 
            className="text-white bg-red-600 px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 mx-auto active:scale-95 transition-all shadow-xl shadow-red-900/20"
          >
            <HiOutlineArrowNarrowLeft size={16} /> Kembali ke Beranda
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden italic font-medium selection:bg-red-800">
      
      {/* Atmospheric Background (Identik dengan Login) */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-900/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              whileHover={{ rotate: 5 }}
              className="w-20 h-20 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 shadow-2xl"
            >
              <HiOutlineShieldCheck size={40} className="text-red-600" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic">
              RESET <span className="text-red-600">PASSWORD</span>
            </h1>
            <div className="mt-4 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">
                Target: {emailUser || "Mencadangkan Data..."}
              </p>
            </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-8 md:p-12">
            <form onSubmit={handleReset} className="space-y-6">
              {/* Input Password Baru */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">New Security Key</label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Minimal 6 karakter" 
                    className="w-full bg-[#020617]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-14 font-bold text-white outline-none focus:border-red-600/50 transition-all text-sm" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Confirm Security Key</label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Ulangi password" 
                    className="w-full bg-[#020617]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-6 font-bold text-white outline-none focus:border-red-600/50 transition-all text-sm" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || isValidCode === null} 
                className="w-full bg-gradient-to-r from-red-600 to-red-900 text-white font-black py-5 rounded-2xl shadow-2xl shadow-red-900/20 active:scale-95 transition-all mt-4 group disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[11px]">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Update Access Key</span>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center">
            <button 
              onClick={() => navigate("/")}
              className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] hover:text-slate-400 transition-colors leading-loose"
            >
              Cancel Operation — Back to Login Base
            </button>
            <p className="text-[7px] font-bold text-slate-800 uppercase tracking-[0.3em] mt-4">
              Laskar Bahari Security Core System
            </p>
        </div>
      </motion.div>
    </div>
  );
}