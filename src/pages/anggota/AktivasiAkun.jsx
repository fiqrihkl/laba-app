import React, { useState } from "react";
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export default function AktivasiAkun() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);

  const [inputCode, setInputCode] = useState("");
  const [inputNTA, setInputNTA] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const normalize = (str) => str?.toString().trim().toLowerCase();

  // STEP 1: Validasi Kode dari Admin
  const handleCheckCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanCode = inputCode.trim();
      const docRef = doc(db, "users", cleanCode);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        // Validasi apakah sudah pernah diklaim
        if (data.isClaimed) {
          alert("Maaf, akun ini sudah pernah diaktivasi sebelumnya.");
        } 
        // Validasi kecocokan NTA
        else if (normalize(data.nta) !== normalize(inputNTA)) {
          alert("Kode Aktivasi dan NTA tidak cocok. Silakan periksa kembali.");
        } else {
          setFoundUser(data);
          setStep(2);
        }
      } else {
        alert("Kode Aktivasi tidak ditemukan. Pastikan kode benar.");
      }
    } catch (error) {
      console.error("Error Checking Code:", error);
      alert("Terjadi kesalahan koneksi ke database.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Registrasi Akun Auth & Migrasi Data ke UID
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password minimal 6 karakter.");

    setLoading(true);
    try {
      // 1. Buat User di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // 2. JEDA SEDIKIT (Krusial)
      // Memberi waktu sistem Auth untuk memperbarui token agar tidak ditolak Rules Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Persiapkan Data Baru (Menggunakan UID sebagai ID dokumen baru)
      const finalData = {
        ...foundUser,
        uid: user.uid,
        email: email.toLowerCase().trim(),
        isClaimed: true,
        tgl_aktivasi: new Date().toISOString(),
      };

      // 4. Simpan data ke dokumen baru dengan ID UID
      await setDoc(doc(db, "users", user.uid), finalData);

      // 5. Hapus dokumen lama (ID berupa Kode 6-Digit) agar tidak bisa dipakai lagi
      try {
        await deleteDoc(doc(db, "users", inputCode.trim()));
      } catch (delError) {
        // Jika gagal hapus kode lama, tidak apa-apa karena akun sudah aktif di UID
        console.warn("Peringatan: Gagal menghapus kode aktivasi lama.", delError);
      }

      alert(`Aktivasi Berhasil! Selamat bergabung, ${foundUser.nama}.`);
      navigate("/anggota");
      
    } catch (error) {
      console.error("Error Registration:", error);
      
      if (error.code === "auth/email-already-in-use") {
        alert("Email sudah terdaftar. Gunakan email lain atau hubungi admin.");
      } else if (error.code === "auth/invalid-email") {
        alert("Format email tidak valid.");
      } else if (error.code === "permission-denied") {
        alert("Gagal menyimpan data: Izin ditolak. Pastikan Firebase Rules sudah benar.");
      } else {
        alert("Gagal mengaktifkan akun: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 italic text-slate-900 font-medium">
      <div className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-10 text-center text-white">
          <h2 className="text-xl font-black uppercase tracking-tighter">Aktivasi Akun</h2>
          <p className="text-[9px] opacity-60 font-bold uppercase mt-2 tracking-[0.3em]">
            Gudep 10.491-10.492 SMPN 1 Biau
          </p>
        </div>

        <div className="p-10">
          {step === 1 ? (
            /* --- STEP 1: VALIDASI --- */
            <form onSubmit={handleCheckCode} className="space-y-6">
              <p className="text-[10px] text-slate-400 font-bold text-center uppercase leading-relaxed">
                Masukkan Kode & NTA yang diberikan oleh Admin
              </p>
              <input
                type="text"
                placeholder="6-DIGIT KODE"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-black text-center text-blue-900 outline-none focus:border-blue-900 uppercase transition-all"
                required
              />
              <input
                type="text"
                placeholder="NOMOR TANDA ANGGOTA"
                value={inputNTA}
                onChange={(e) => setInputNTA(e.target.value)}
                className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-black text-center text-slate-800 outline-none focus:border-blue-900 uppercase transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 disabled:opacity-50 transition-all text-[10px] uppercase tracking-widest"
              >
                {loading ? "MENGECEK DATA..." : "MULAI AKTIVASI"}
              </button>
            </form>
          ) : (
            /* --- STEP 2: REGISTRASI --- */
            <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase italic">Selamat Datang,</p>
                <h3 className="font-black text-blue-900 uppercase text-lg leading-tight tracking-tighter">
                  {foundUser?.nama}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                  {foundUser?.jabatan || "Anggota"}
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="EMAIL BARU"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-bold outline-none focus:border-blue-900 transition-all"
                  required
                />
                <input
                  type="password"
                  placeholder="PASSWORD (MIN. 6 KARAKTER)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 p-4 rounded-2xl font-bold outline-none focus:border-blue-900 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 disabled:opacity-50 transition-all text-[10px] uppercase tracking-widest"
              >
                {loading ? "MENGAKTIFKAN..." : "KONFIRMASI AKUN"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t pt-6">
            <Link to="/" className="text-[10px] font-black text-slate-300 hover:text-blue-900 transition-colors uppercase tracking-widest">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}