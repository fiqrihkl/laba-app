import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORT KONTEKS KONFIRMASI (Path disesuaikan ke folder lokal pembina) ---
import { useConfirm } from "../pembina/context/ConfirmContext";

// --- ICONS ---
import { 
  HiOutlineUserAdd, 
  HiOutlineChevronLeft, 
  HiOutlineSearch, 
  HiOutlineTrash, 
  HiOutlineSwitchHorizontal,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineIdentification,
  HiOutlineClipboardCopy
} from "react-icons/hi";

export default function KelolaPengguna() {
  const navigate = useNavigate();
  const confirm = useConfirm(); // Inisialisasi Hook Konfirmasi
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false); 
  const [isCopied, setIsCopied] = useState(false);
  
  const [newUserName, setNewUserName] = useState("");
  const [newUserNTA, setNewUserNTA] = useState("");
  const [newUserRole, setNewUserRole] = useState("anggota");
  const [newUserGender, setNewUserGender] = useState("Laki-laki");
  const [generatedCode, setGeneratedCode] = useState(""); 

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("nama", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const userData = [];
      snap.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserNTA) return alert("Data wajib diisi!");

    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const userRef = doc(db, "users", activationCode);
      const userData = {
        uid: "", 
        nama: newUserName.trim(),
        nta: newUserNTA.trim(),
        role: newUserRole,
        jenisKelamin: newUserGender,
        points: 0,
        level: 1,
        isClaimed: false,
        ktaStatus: "belum_lengkap",
        jabatan: newUserRole === "pembina" ? "Pembina Gudep" : "Anggota Laskar",
        tingkat: newUserRole === "pembina" ? "Pembina Dewasa" : "PENGGALANG",
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, userData);
      setGeneratedCode(activationCode);
      setShowAddModal(false);
      setShowResultModal(true);
      // Reset Form
      setNewUserName("");
      setNewUserNTA("");
    } catch (error) {
      alert("Gagal sinkronisasi database.");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) { console.error(err); }
  };

  // --- FUNGSI HAPUS DENGAN MODAL KONFIRMASI CUSTOM ---
  const deleteUser = async (user) => {
    confirm({
      title: "Hapus Personel?",
      message: `TINDAKAN INI AKAN MENGHAPUS DATA ${user.nama.toUpperCase()} SECARA PERMANEN DARI DATABASE LASKAR.`,
      confirmText: "Hapus Permanen",
      cancelText: "Batalkan",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", user.id));
        } catch (error) { 
          alert("Gagal menghapus data."); 
        }
      }
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900">
      <div className="max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest leading-none">Database Personel</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Manajemen Master Data</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95"
          >
            <HiOutlineUserAdd size={20} />
          </button>
        </header>

        {/* SEARCH BAR */}
        <div className="p-6">
          <div className="bg-slate-900 border border-white/5 rounded-2xl flex items-center px-4 focus-within:border-blue-500/50 transition-all">
            <HiOutlineSearch className="text-slate-500" />
            <input 
              type="text" 
              placeholder="CARI NAMA / NTA / KODE..." 
              className="w-full bg-transparent p-3.5 text-xs font-medium outline-none text-white placeholder:text-slate-700 uppercase tracking-widest" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* USER LIST */}
        <main className="flex-1 px-6 space-y-3 pb-10 overflow-y-auto custom-scroll">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Personel: {filteredUsers.length}</h2>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Sinkronisasi Data...</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <motion.div 
                layout
                key={u.id} 
                className="bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm border ${u.role === "pembina" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                    {u.nama?.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase">{u.nama}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded ${u.isClaimed ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {u.isClaimed ? "AKTIF" : `ID: ${u.id}`}
                      </span>
                      <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">NTA: {u.nta}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteUser(u)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </main>

        {/* MODAL ADD USER */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 w-full max-w-xs rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-blue-600 text-white">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xs font-bold uppercase tracking-widest">Registrasi Baru</h2>
                    <button onClick={() => setShowAddModal(false)}><HiOutlineX size={18} /></button>
                  </div>
                  <p className="text-[9px] opacity-70 uppercase font-medium">Input Personel ke Database</p>
                </div>
                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nama Lengkap</label>
                    <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Contoh: Andi Wijaya" className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nomor NTA</label>
                    <input type="text" value={newUserNTA} onChange={(e) => setNewUserNTA(e.target.value)} placeholder="00.00.000" className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs text-blue-400 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Otoritas Akses</label>
                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs text-white outline-none">
                      <option value="anggota">ANGGOTA (LASKAR)</option>
                      <option value="pembina">PEMBINA (OFFICER)</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all">Daftarkan Personel</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL SUCCESS RESULT */}
        <AnimatePresence>
          {showResultModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 w-full max-w-xs rounded-2xl p-8 border border-white/10 text-center shadow-2xl"
              >
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiOutlineCheck size={28} />
                </div>
                <h2 className="text-sm font-bold uppercase text-white mb-1">Personel Terdaftar</h2>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight mb-6">Berikan kode aktivasi ini kepada anggota:</p>

                <div className="bg-black/50 rounded-xl p-6 border border-white/5 mb-6">
                   <div className="text-3xl font-bold text-blue-500 tracking-[0.2em] mb-4">{generatedCode}</div>
                   <button 
                      onClick={copyToClipboard}
                      className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      <HiOutlineClipboardCopy size={14} /> {isCopied ? "Berhasil Disalin" : "Salin Kode"}
                   </button>
                </div>

                <button onClick={() => setShowResultModal(false)} className="w-full bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest">Selesai</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}