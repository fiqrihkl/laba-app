import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineShieldCheck, 
  HiOutlineIdentification, 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineChevronLeft,
  HiOutlineSparkles,
  HiOutlineBadgeCheck
} from "react-icons/hi";

export default function AktivasiAkun() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [inputCode, setInputCode] = useState("");
  const [inputNTA, setInputNTA] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();

  const normalize = (str) => str?.toString().trim().toLowerCase();

  // STEP 1: Validasi Kode & NTA
  const handleCheckCode = async (e) => {
    e.preventDefault();
    const cleanCode = inputCode.trim();

    if (cleanCode.length !== 6) {
      return alert("Kode aktivasi harus 6 digit.");
    }

    setLoading(true);
    try {
      const docRef = doc(db, "users", cleanCode);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.isClaimed) {
          alert("Akun ini sudah aktif. Silakan langsung login.");
          navigate("/");
        } else if (normalize(data.nta) !== normalize(inputNTA)) {
          alert("Kombinasi Kode dan NTA tidak cocok.");
        } else {
          setFoundUser(data);
          setStep(2);
        }
      } else {
        alert("Kode Aktivasi tidak ditemukan.");
      }
    } catch (error) {
      alert("Terjadi masalah koneksi.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Registrasi Akun Auth
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password minimal 6 karakter.");

    setLoading(true);
    let newUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      newUser = userCredential.user;

      // Jeda sinkronisasi auth
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const finalData = {
        ...foundUser,
        uid: newUser.uid,
        email: email.toLowerCase().trim(),
        isClaimed: true,
        activatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", newUser.uid), finalData);
      await deleteDoc(doc(db, "users", inputCode.trim()));

      alert(`Selamat ${foundUser.nama}! Akun kamu telah aktif.`);
      await signOut(auth); // Clear session agar fresh login
      navigate("/");
      
    } catch (error) {
      if (newUser) await newUser.delete();
      if (error.code === "auth/email-already-in-use") {
        alert("Email sudah digunakan anggota lain.");
      } else {
        alert("Gagal aktivasi: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden italic font-medium selection:bg-red-800">
      
      {/* 🌊 Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-900/10 blur-[130px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[110px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* HEADER AREA */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-t-[3.5rem] p-10 text-center border-x border-t border-white/10 shadow-2xl">
          <div className="w-16 h-16 bg-red-600 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20">
            <HiOutlineShieldCheck size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tighter leading-none italic">Aktivasi <span className="text-red-600">Akun</span></h2>
          <div className="flex items-center justify-center gap-3 mt-4 text-slate-500">
            <HiOutlineSparkles className="text-red-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Fleet Enrollment Protocol</p>
          </div>
        </div>

        {/* MAIN FORM CARD */}
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-b-[3.5rem] border-x border-b border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-8 md:p-12 pt-4">
            
            {/* STEP INDICATOR */}
            <div className="flex items-center justify-center gap-4 mb-8">
                <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-red-600' : 'bg-slate-800'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-red-600' : 'bg-slate-800'}`} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1" 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 20 }} 
                  onSubmit={handleCheckCode} 
                  className="space-y-6"
                >
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed px-2 italic">
                    Masukkan data otorisasi yang <br /> diterbitkan oleh Markas Pusat
                  </p>
                  <div className="space-y-4">
                    <div className="relative group">
                      <HiOutlineLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors z-10" size={20} />
                      <input 
                        type="text" required placeholder="6-DIGIT CODE" maxLength={6} value={inputCode} 
                        onChange={(e) => setInputCode(e.target.value)} 
                        className="w-full bg-[#020617]/50 border border-white/5 p-6 rounded-[2rem] font-black text-center text-white text-2xl outline-none focus:border-red-600/50 transition-all shadow-inner tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-800" 
                      />
                    </div>
                    <div className="relative group">
                      <HiOutlineIdentification className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors z-10" size={20} />
                      <input 
                        type="text" required placeholder="IDENTIFICATION NUMBER (NTA)" 
                        value={inputNTA} onChange={(e) => setInputNTA(e.target.value)} 
                        className="w-full bg-[#020617]/50 border border-white/5 p-6 rounded-[2rem] font-bold text-center text-slate-200 outline-none focus:border-red-600/50 transition-all shadow-inner uppercase text-xs tracking-widest placeholder:text-slate-800" 
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-900 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-red-900/20 active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Authorize Identity"}
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="step2" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }} 
                  onSubmit={handleRegister} 
                  className="space-y-6"
                >
                  <div className="bg-red-600/5 p-6 rounded-[2.5rem] border border-red-600/20 flex flex-col items-center relative overflow-hidden">
                    <HiOutlineBadgeCheck size={32} className="text-red-500 mb-3" />
                    <p className="text-[10px] text-red-500 font-black uppercase italic mb-1 tracking-widest">Access Granted</p>
                    <h3 className="font-black text-white uppercase text-lg italic tracking-tighter text-center">{foundUser?.nama}</h3>
                    <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-[0.2em]">{foundUser?.jabatan || "Anggota Laskar"}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <HiOutlineMail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors z-10" size={20} />
                      <input 
                        type="email" required placeholder="COMMAND EMAIL" value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="w-full bg-[#020617]/50 border border-white/5 p-6 rounded-[2rem] font-bold text-white pl-16 outline-none focus:border-red-600/50 transition-all shadow-inner text-xs placeholder:text-slate-800" 
                      />
                    </div>
                    <div className="relative group">
                      <HiOutlineLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-500 transition-colors z-10" size={20} />
                      <input 
                        type={showPassword ? "text" : "password"} required placeholder="CREATE SECURITY KEY" 
                        value={password} onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-[#020617]/50 border border-white/5 p-6 rounded-[2rem] font-bold text-white pl-16 pr-16 outline-none focus:border-red-600/50 transition-all shadow-inner text-xs placeholder:text-slate-800" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-red-500 transition-colors z-10">
                        {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-white text-[#020617] font-black py-5 rounded-[2rem] shadow-3xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 group">
                    {loading ? <div className="w-5 h-5 border-2 border-red-900/30 border-t-red-900 rounded-full animate-spin"></div> : "Initialize Account"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* NAVIGATION LINKS */}
            <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
              <Link to="/" className="flex items-center gap-3 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.3em] group italic">
                <HiOutlineChevronLeft className="group-hover:-translate-x-2 transition-transform" />
                Return to Login
              </Link>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 text-center pb-10">
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] leading-loose">
              Developed by <span className="text-slate-400">Fiqri Haikal</span><br />
              © 2026 — Laskar Bahari Security Core
            </p>
        </div>
      </motion.div>
    </div>
  );
}