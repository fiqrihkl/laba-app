import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
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
  const { showModal } = useModal();

  const containerVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const normalize = (str) => str?.toString().trim().toLowerCase();

  const handleCheckCode = async (e) => {
    e.preventDefault();
    const cleanCode = inputCode.trim();

    if (cleanCode.length !== 6) {
      return showModal("Format Salah", "Kode aktivasi harus terdiri dari 6 digit angka.", "danger");
    }

    setLoading(true);
    try {
      const docRef = doc(db, "users", cleanCode);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.isClaimed) {
          showModal("Akun Aktif", "Akun ini sudah aktif. Silakan langsung login.", "success");
          navigate("/");
        } else if (normalize(data.nta) !== normalize(inputNTA)) {
          showModal("Validasi Gagal", "Kombinasi Kode dan NTA tidak terdaftar.", "danger");
        } else {
          setFoundUser(data);
          setStep(2);
        }
      } else {
        showModal("Tidak Ditemukan", "Kode Aktivasi salah atau telah kedaluwarsa.", "danger");
      }
    } catch (error) {
      showModal("Gagal", "Terjadi masalah koneksi ke database.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return showModal("Password Lemah", "Gunakan minimal 6 karakter.", "danger");
    }

    setLoading(true);
    let newUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      newUser = userCredential.user;

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

      showModal("Aktivasi Berhasil", `Selamat ${foundUser.nama}! Akun kamu telah aktif. Silakan login kembali.`, "success");
      
      // LOGIKA REDIRECT OTOMATIS: Logout agar token fresh dan lempar ke Login
      await signOut(auth);
      navigate("/");
      
    } catch (error) {
      if (newUser) await newUser.delete();
      if (error.code === "auth/email-already-in-use") {
        showModal("Email Terpakai", "Email ini sudah digunakan oleh anggota lain.", "danger");
      } else {
        showModal("Sistem Error", "Gagal melakukan sinkronisasi data.", "danger");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden italic font-medium">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 blur-[130px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/10 blur-[110px] rounded-full"></div>

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="w-full max-w-[420px] relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-t-[3.5rem] p-10 text-center border-x border-t border-white shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 bg-blue-900 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/20">
            <HiOutlineShieldCheck size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase text-blue-900 tracking-tighter leading-none">Aktivasi Akun</h2>
          <div className="flex items-center justify-center gap-2 mt-3 text-slate-400">
            <HiOutlineSparkles className="text-yellow-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">Secure Hub Enrollment</p>
          </div>
        </div>

        <div className="bg-white rounded-b-[3.5rem] border-x border-b border-white shadow-[0_40px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="p-8 md:p-10 pt-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleCheckCode} className="space-y-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center leading-relaxed px-4">
                    Masukkan data yang diberikan oleh <br /> markas Pembina Laskar Bahari
                  </p>
                  <div className="space-y-4">
                    <div className="relative group">
                      <HiOutlineLockClosed className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <input type="text" required placeholder="6-DIGIT KODE" maxLength={6} value={inputCode} onChange={(e) => setInputCode(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[2rem] font-black text-center text-blue-900 text-lg outline-none focus:border-blue-600/30 focus:bg-white transition-all shadow-inner tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-300" />
                    </div>
                    <div className="relative group">
                      <HiOutlineIdentification className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <input type="text" required placeholder="NOMOR TANDA ANGGOTA" value={inputNTA} onChange={(e) => setInputNTA(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[2rem] font-bold text-center text-slate-700 outline-none focus:border-blue-600/30 focus:bg-white transition-all shadow-inner uppercase text-xs tracking-widest placeholder:text-slate-300" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_40px_rgba(30,58,138,0.2)] active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Otorisasi Identitas"}
                  </button>
                </motion.form>
              ) : (
                <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-6">
                  <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex flex-col items-center">
                    <HiOutlineBadgeCheck size={24} className="text-blue-600 mb-2" />
                    <p className="text-[10px] text-blue-400 font-black uppercase italic mb-1">Identitas Terverifikasi</p>
                    <h3 className="font-black text-slate-800 uppercase text-sm">{foundUser?.nama}</h3>
                    <p className="text-[8px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{foundUser?.role} • NTA {foundUser?.nta}</p>
                  </div>
                  <div className="space-y-4">
                    {/* INPUT EMAIL DENGAN IKON TERPISAH */}
                    <div className="relative group">
                      <HiOutlineMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <input type="email" required placeholder="EMAIL AKTIF" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[2rem] font-bold text-slate-800 pl-14 outline-none focus:border-blue-600/30 focus:bg-white transition-all shadow-inner text-xs" />
                    </div>
                    {/* INPUT PASSWORD DENGAN IKON TERPISAH */}
                    <div className="relative group">
                      <HiOutlineLockClosed className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <input type={showPassword ? "text" : "password"} required placeholder="BUAT PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[2rem] font-bold text-slate-800 pl-14 pr-14 outline-none focus:border-blue-600/30 focus:bg-white transition-all shadow-inner text-xs" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors z-10">
                        {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_40px_rgba(15,23,42,0.2)] active:scale-95 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Aktifkan Akun"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
            <div className="mt-10 flex flex-col items-center gap-4 border-t border-slate-50 pt-6">
              <Link to="/" className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-800 transition-all uppercase tracking-widest group">
                <HiOutlineChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                Kembali ke Login
              </Link>
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
    </div>
  );
}