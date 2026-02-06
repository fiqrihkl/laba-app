import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion"; 
import { useModal } from "../../context/ModalContext"; 
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineLogin, 
  HiOutlineUserAdd,
  HiOutlineArrowRight,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineQuestionMarkCircle
} from "react-icons/hi";

export default function Login({ installPrompt }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); 
  const { showModal } = useModal();

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  // --- LOGIKA MENANGKAP SUKSES AKTIVASI ---
  useEffect(() => {
    if (location.state?.activationSuccess) {
      const userName = location.state.userName || "Anggota";
      showModal(
        "Aktivasi Berhasil",
        `Selamat ${userName}! Akun kamu telah aktif. Silakan masuk menggunakan email dan password baru.`,
        "success"
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, showModal, navigate, location.pathname]);

  // --- LOGIKA PWA INSTALLATION ---
  useEffect(() => {
    if (installPrompt) {
      const timer = setTimeout(() => setShowInstallModal(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [installPrompt]);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallModal(false);
      }
    } else {
      showModal(
        "Panduan Instalasi",
        "Untuk pengguna iPhone/Safari: Klik ikon 'Share' (panah ke atas) lalu pilih 'Add to Home Screen' untuk memasang NAVIGASI APP.",
        "info"
      );
    }
  };

  // --- LOGIKA LUPA PASSWORD ---
  const handleForgotPassword = async () => {
    if (!email) {
      showModal("Email Kosong", "Silakan masukkan email Anda pada kolom login terlebih dahulu untuk menyetel ulang kata sandi.", "info");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      showModal(
        "Email Terkirim", 
        "Tautan pengaturan ulang kata sandi telah dikirim ke email Anda. Periksa kotak masuk atau folder spam.", 
        "success"
      );
    } catch (error) {
      let errorMsg = "Gagal mengirim email reset password.";
      if (error.code === "auth/user-not-found") errorMsg = "Email tidak terdaftar dalam sistem kami.";
      showModal("Gagal Reset", errorMsg, "danger");
    }
  };

  // --- LOGIKA LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const role = userData.role;
        
        if (role === "admin") navigate("/admin");
        else if (role === "pembina") navigate("/pembina");
        else if (role === "anggota") navigate("/anggota");
        else navigate("/");
        
      } else {
        showModal("Akses Ditolak", "Profil Anda belum terhubung dengan database resmi.", "danger");
        await auth.signOut();
      }
    } catch (error) {
      console.error("Login Error:", error);
      let errorMsg = "Email atau Kata Sandi salah.";
      if (error.code === "auth/user-not-found") errorMsg = "Akun tidak ditemukan.";
      if (error.code === "auth/wrong-password") errorMsg = "Kata sandi salah.";
      
      showModal("Gagal Masuk", errorMsg, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden italic font-medium selection:bg-red-800">
      
      {/* 🌊 Atmospheric Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-900/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-[420px] relative z-10"
      >
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-12">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 3 }} 
              className="w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center mb-6 border border-white/10"
              style={{ boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)' }}
            >
              <img src="/logo/logo.png" className="w-16 h-16 object-contain drop-shadow-2xl" alt="Logo" />
            </motion.div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none italic">
              NAVIGASI <span className="text-red-600 underline decoration-white/10">APP</span>
            </h1>
            <div className="flex items-center gap-3 mt-4 text-slate-500">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Navigator Digital Laskar Bahari</p>
            </div>
        </div>

        {/* MAIN LOGIN CARD */}
        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-8 md:p-12">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 italic">Email</label>
                <div className="relative group">
                  <HiOutlineMail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="fiqri@laskarbahari.com" 
                    className="w-full bg-[#020617]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-6 font-bold text-white outline-none focus:border-red-600/50 transition-all text-sm shadow-inner placeholder:text-slate-700" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Password</label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black text-red-500/80 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <HiOutlineQuestionMarkCircle size={12} />
                    Lupa Password?
                  </button>
                </div>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full bg-[#020617]/50 border border-white/5 rounded-2xl py-5 pl-16 pr-14 font-bold text-white outline-none focus:border-red-600/50 transition-all text-sm shadow-inner placeholder:text-slate-700" 
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

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-red-600 to-red-900 text-white font-black py-5 rounded-2xl shadow-2xl shadow-red-900/20 active:scale-95 transition-all mt-4 group disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[11px]">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><span>Masuk</span><HiOutlineLogin size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </div>
              </button>
            </form>

            <div className="text-center pt-8">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 italic">Belum punya akun? Aktivasi disini</p>
              <Link to="/aktivasi" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-all group font-black text-[11px] uppercase tracking-widest">
                <HiOutlineUserAdd size={18} />
                Aktivasi Akun
                <HiOutlineArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="mt-6">
              <div className="bg-white/5 rounded-3xl p-5 border border-white/5 transition-all hover:bg-white/10">
                <button 
                  onClick={handleInstallApp}
                  className="w-full bg-white text-[#020617] py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-black/20"
                >
                  <HiOutlineDownload size={16} />
                  Install App
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] leading-loose">
              System Created by <span className="text-slate-400 font-black">Fiqri Haikal</span> <br />
              © 2026 — Laskar Bahari Security Core
            </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }} 
              className="bg-slate-900 w-full max-w-sm rounded-[3.5rem] overflow-hidden border border-white/10 italic"
              style={{ boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)' }}
            >
              <div className="bg-gradient-to-br from-red-600 to-red-900 p-12 text-center text-white relative">
                <button onClick={() => setShowInstallModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                  <HiOutlineX size={28} />
                </button>
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
                  <HiOutlineDownload size={40} className="animate-bounce" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none italic">Enhance Kit</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Install Tactical HUB</p>
              </div>
              <div className="p-10 text-center">
                <p className="text-[12px] font-bold text-slate-400 leading-relaxed italic mb-10 px-2">
                  Access radar SKU, inventory, and emergency SOS directly from your home screen.
                </p>
                <div className="flex flex-col gap-4">
                  <button onClick={handleInstallApp} className="w-full bg-white text-[#020617] py-6 rounded-2xl uppercase text-[11px] font-black tracking-widest shadow-2xl active:scale-95 transition-all">Secure Download</button>
                  <button onClick={() => setShowInstallModal(false)} className="text-[10px] font-black text-slate-600 uppercase tracking-widest py-2">Dismiss Briefing</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}