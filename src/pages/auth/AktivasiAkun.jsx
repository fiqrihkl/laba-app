import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext"; // Import Modal Context

// IMPORT REACT ICONS
import { 
  HiOutlineShieldCheck, 
  HiOutlineIdentification, 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineChevronLeft,
  HiOutlineBadgeCheck
} from "react-icons/hi";

export default function AktivasiAkun() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false); 
  
  const [inputCode, setInputCode] = useState("");
  const [inputNTA, setInputNTA] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();
  const { showModal } = useModal(); // Gunakan fungsi showModal
  const normalize = (str) => str?.toString().trim().toLowerCase();

  // --- AUDIO FEEDBACK ---
  const playSuccessSound = () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, context.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.2);
    } catch (e) { console.warn("Audio Context blocked"); }
  };

  const triggerHaptic = () => {
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
  };

  // --- LOGIKA SILENT VALIDATION STEP 1 ---
  useEffect(() => {
    setIsError(false);
    if (step === 1 && inputCode.trim().length === 6 && inputNTA.trim().length >= 4) {
      const delayDebounce = setTimeout(() => {
        autoCheckCode();
      }, 800);
      return () => clearTimeout(delayDebounce);
    }
  }, [inputCode, inputNTA, step]);

  const autoCheckCode = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", inputCode.trim());
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.isClaimed) {
          showModal("Akses Ditolak", "Akun ini sudah aktif. Silakan kembali ke halaman login.", "danger");
          navigate("/");
        } else if (normalize(data.nta) === normalize(inputNTA)) {
          playSuccessSound(); 
          setFoundUser(data);
          setStep(2);
        } else {
          setIsError(true);
          triggerHaptic();
        }
      } else {
        setIsError(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTRASI FINAL ---
  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    if (password.length < 6) {
      showModal("Proteksi Lemah", "Demi keamanan, password minimal harus 6 karakter.", "danger");
      return;
    }

    setLoading(true);
    let newUser = null;

    try {
      // 1. Buat User di Auth (Firebase otomatis login di sini)
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      newUser = userCredential.user;

      // 2. Siapkan Data
      const finalData = {
        ...foundUser,
        uid: newUser.uid,
        email: cleanEmail,
        isClaimed: true,
        activatedAt: new Date().toISOString(),
      };

      // 3. Simpan Ke Database (Hanya bisa nulis jika status Logged In)
      await setDoc(doc(db, "users", newUser.uid), finalData);
      await deleteDoc(doc(db, "users", inputCode.trim()));
      
      // --- AREA KRUSIAL ANTI-FLICKER ---

      // 4. Logout SEBELUM mematikan loading dan navigasi
      // Ini memastikan status Auth kembali 'null' sebelum App.jsx sempat re-render ke dashboard
      await signOut(auth);

      setLoading(false);

      // 5. Navigasi ke Login dengan state sukses
      navigate("/", { 
        replace: true, 
        state: { 
          activationSuccess: true, 
          userName: foundUser.nama 
        } 
      });

    } catch (error) {
      setLoading(false);
      // Jika error terjadi SETELAH newUser dibuat tapi SEBELUM Firestore sukses, hapus user-nya (Rollback)
      if (newUser && error.code !== "auth/email-already-in-use") {
         await newUser.delete().catch(() => console.warn("Rollback auth gagal"));
      }
      
      let errorMsg = "Sistem gagal memproses aktivasi.";
      if (error.code === "auth/email-already-in-use") errorMsg = "Email ini sudah digunakan oleh anggota lain.";
      if (error.code === "auth/invalid-email") errorMsg = "Format email tidak valid.";
      
      showModal("Gagal Aktivasi", errorMsg, "danger");
    }
  };

  const shakeVariants = {
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden italic font-medium selection:bg-red-800">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-900/10 blur-[130px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[110px] rounded-full"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px] relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-t-[3.5rem] p-10 text-center border-x border-t border-white/10 shadow-2xl">
          <div className="w-16 h-16 bg-red-600 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20">
            <HiOutlineShieldCheck size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tighter leading-none italic">Aktivasi <span className="text-red-600">Akun</span></h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-4 text-center">Navigator Digital Laskar Bahari</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-b-[3.5rem] border-x border-b border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-8 md:p-12 pt-4">
            <div className="flex items-center justify-center gap-4 mb-8">
                <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-red-600' : 'bg-slate-800'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-red-600' : 'bg-slate-800'}`} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed px-2 italic">
                    Masukkan data otorisasi resmi <br /> yang diterbitkan Gugus Depan
                  </p>
                  
                  <motion.div variants={shakeVariants} animate={isError ? "shake" : ""} className="space-y-4">
                    <div className="relative group">
                      <HiOutlineLockClosed className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors z-10 ${isError ? 'text-red-500' : 'text-slate-600 group-focus-within:text-red-500'}`} size={20} />
                      <input 
                        type="text" 
                        placeholder="6-DIGIT CODE" 
                        maxLength={6} 
                        value={inputCode} 
                        onChange={(e) => setInputCode(e.target.value)} 
                        className={`w-full bg-[#020617]/50 border p-6 rounded-[2rem] font-black text-center text-white text-2xl outline-none transition-all shadow-inner tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-800 ${isError ? 'border-red-600/50 bg-red-900/5' : 'border-white/5 focus:border-red-600/50'}`} 
                      />
                    </div>
                    <div className="relative group">
                      <HiOutlineIdentification className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors z-10 ${isError ? 'text-red-500' : 'text-slate-600 group-focus-within:text-red-500'}`} size={20} />
                      <input 
                        type="text" 
                        placeholder="NTA ANGGOTA" 
                        value={inputNTA} 
                        onChange={(e) => setInputNTA(e.target.value)} 
                        className={`w-full bg-[#020617]/50 border p-6 rounded-[2rem] font-bold text-center text-slate-200 outline-none transition-all shadow-inner uppercase text-xs tracking-widest placeholder:text-slate-800 ${isError ? 'border-red-600/50 bg-red-900/5' : 'border-white/5 focus:border-red-600/50'}`} 
                      />
                    </div>
                  </motion.div>

                  <div className="h-4 flex flex-col items-center justify-center">
                    {loading && (
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                         <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Otorisasi...</p>
                      </div>
                    )}
                    {isError && !loading && (
                      <p className="text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">Kredensial Tidak Cocok</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-6">
                  <div className="bg-red-600/5 p-6 rounded-[2.5rem] border border-red-600/20 flex flex-col items-center text-center">
                    <HiOutlineBadgeCheck size={32} className="text-red-500 mb-3" />
                    <h3 className="font-black text-white uppercase text-lg italic tracking-tighter">{foundUser?.nama}</h3>
                    <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">{foundUser?.jabatan || "Anggota"}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <HiOutlineMail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 z-10" size={20} />
                      <input type="email" required placeholder="Buat Email Akun" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617]/50 border border-white/5 p-6 rounded-[2rem] font-bold text-white pl-16 outline-none focus:border-red-600 transition-all text-xs" />
                    </div>
                    <div className="relative group">
                      <HiOutlineLockClosed className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 z-10" size={20} />
                      <input type={showPassword ? "text" : "password"} required placeholder="Buat Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617]/50 border border-white/5 p-6 rounded-[2rem] font-bold text-white pl-16 pr-16 outline-none focus:border-red-600 transition-all text-xs" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-red-500">
                        {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-white text-[#020617] font-black py-5 rounded-[2rem] shadow-3xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em]">
                    {loading ? "PROSES..." : "Selesaikan Aktivasi"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
              <Link to="/" className="flex items-center gap-3 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.3em] group italic">
                <HiOutlineChevronLeft className="group-hover:-translate-x-2 transition-transform" />
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center pb-10">
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] leading-loose">
              System Protected by <br />
              © 2026 — Laskar Bahari Security Core
            </p>
        </div>
      </motion.div>
    </div>
  );
}