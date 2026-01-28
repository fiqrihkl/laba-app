import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion"; 
import { useModal } from "../../context/ModalContext"; 
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineLogin, 
  HiOutlineRefresh, 
  HiOutlineSparkles,
  HiOutlineUserAdd,
  HiOutlineArrowRight,
  HiOutlineDownload,
  HiOutlineX
} from "react-icons/hi";

// MENERIMA PROPS installPrompt DARI APP.JSX
export default function Login({ installPrompt }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const navigate = useNavigate();
  const { showModal } = useModal();

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  // Efek untuk memicu Modal Install PWA
  useEffect(() => {
    if (installPrompt) {
      const timer = setTimeout(() => setShowInstallModal(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [installPrompt]);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallModal(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const role = userData.role;

        // REDIRECT LANGSUNG BERDASARKAN ROLE AGAR TIDAK NYANGKUT
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "pembina") {
          navigate("/pembina");
        } else if (role === "anggota") {
          navigate("/anggota");
        } else {
          // Jika role tidak dikenal, lempar ke root untuk handle default
          navigate("/");
        }
      } else {
        showModal(
          "Akses Ditolak", 
          "Profil Anda belum terhubung dengan database resmi Laskar Bahari.", 
          "danger"
        );
        auth.signOut();
      }
    } catch (error) {
      showModal("Gagal Masuk", "Email atau Kata Sandi salah. Periksa kembali akses Anda.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      return showModal("Email Diperlukan", "Silakan masukkan email Anda untuk proses reset.", "danger");
    }

    showModal(
      "Reset Password?",
      `Kirim instruksi reset kata sandi ke ${email}?`,
      "success",
      async () => {
        setResetLoading(true);
        try {
          await sendPasswordResetEmail(auth, email);
          showModal("Email Terkirim", "Silakan cek Inbox atau folder Spam email Anda.", "success");
        } catch (error) {
          showModal("Gagal", "Email tidak terdaftar atau bermasalah.", "danger");
        } finally {
          setResetLoading(false);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden italic font-medium text-slate-900">
      
      {/* 🌊 Background Decoration */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-400/10 blur-[100px] rounded-full"></div>
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-[420px] relative z-10"
      >
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-white rounded-[2.2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(30,58,138,0.1)] mb-6 border border-slate-100"
            >
              <img
                src="/logo/logo.png" 
                className="w-16 h-16 object-contain"
                alt="Logo"
              />
            </motion.div>
            <h1 className="text-4xl font-black text-blue-900 tracking-tighter uppercase leading-none">
              LABA <span className="text-blue-500">APP</span>
            </h1>
            <div className="flex items-center gap-2 mt-3 text-slate-400">
                <HiOutlineSparkles className="animate-pulse text-yellow-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Level Up Your Adventure</p>
            </div>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] border border-white shadow-[0_40px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="p-8 md:p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Anggota</label>
                <div className="relative group">
                  <HiOutlineMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@laskabahari.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 font-bold text-slate-800 outline-none focus:border-blue-600/30 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 font-bold text-slate-800 outline-none focus:border-blue-600/30 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:scale-95 transition-all mt-4"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px]">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Mulai Petualangan</span>
                      <HiOutlineLogin size={18} />
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-6">
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all flex items-center gap-2 group"
              >
                <HiOutlineRefresh className={`group-hover:rotate-180 transition-transform duration-500 ${resetLoading ? 'animate-spin' : ''}`} />
                {resetLoading ? "Processing..." : "Lupa Akses Sandi?"}
              </button>

              <div className="w-full bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">Belum memiliki akun?</p>
                <Link
                  to="/aktivasi"
                  className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 transition-all group"
                >
                  <HiOutlineUserAdd size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Aktivasi Disini Sekarang</span>
                  <HiOutlineArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex items-center gap-4 w-full">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Identity Hub</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] leading-loose">
              Dikembangkan oleh <span className="text-slate-600 font-black">Fiqri Haikal</span> — LABA APP v1.0<br />
              © 2026 — Laskar Bahari SMPN 1 Biau
            </p>
        </div>
      </motion.div>

      {/* MODAL INSTALL PWA PREMIUM */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border border-white italic"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center text-white relative">
                <button 
                  onClick={() => setShowInstallModal(false)} 
                  className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <HiOutlineX size={24} />
                </button>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-xl">
                  <HiOutlineDownload size={32} className="animate-bounce" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none italic">Pasang Aplikasi</h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-2 opacity-70">Digital Scout Experience</p>
              </div>
              <div className="p-8 text-center">
                <p className="text-xs font-bold text-slate-500 leading-relaxed italic mb-8 px-2">
                  Dapatkan akses instan ke radar SKU, leaderboard, dan notifikasi real-time langsung dari layar utama HP kamu.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleInstallApp} 
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Instal Sekarang
                  </button>
                  <button 
                    onClick={() => setShowInstallModal(false)} 
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2"
                  >
                    Mungkin Nanti
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}