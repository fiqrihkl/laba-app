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
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineUserAdd, 
  HiOutlineChevronLeft, 
  HiOutlineSearch, 
  HiOutlineTrash, 
  HiOutlineSwitchHorizontal,
  HiOutlineCheckCircle,
  HiOutlineClipboardCopy,
  HiOutlineX,
  HiOutlineCheck
} from "react-icons/hi";

export default function KelolaPengguna() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false); 
  const [isCopied, setIsCopied] = useState(false); // State untuk feedback salin
  
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
  if (!newUserName || !newUserNTA) return alert("Nama dan NTA wajib diisi!");

  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const userRef = doc(db, "users", activationCode);
    const userData = {
      nama: newUserName.trim(),
      nta: newUserNTA.trim(),
      role: newUserRole,
      jenisKelamin: newUserGender,
      points: 0,
      level: 1,
      isClaimed: false,
      ktaStatus: "belum_lengkap",
      ktaPhotoURL: "",
      agama: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      jabatan: newUserRole === "pembina" ? "Pembina Gudep" : "Anggota Laskar",
      
      // PERUBAHAN DI SINI:
      // Jika role pembina -> Pembina Dewasa, jika bukan (anggota) -> PENGGALANG
      tingkat: newUserRole === "pembina" ? "Pembina Dewasa" : "PENGGALANG",
      
      kwarran: "Biau",
      kwarcab: "Buol",
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, userData);

    setGeneratedCode(activationCode);
    setShowAddModal(false);
    setShowResultModal(true);

  } catch (error) {
    console.error("Firebase Error:", error);
    alert("Gagal menyimpan ke database.");
  }
};

  // FUNGSI SALIN KODE
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset status setelah 2 detik
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setNewUserName("");
    setNewUserNTA("");
    setNewUserGender("Laki-laki");
    setGeneratedCode("");
    setIsCopied(false);
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "pembina" ? "anggota" : "pembina";
    if (window.confirm(`Ubah peran menjadi ${newRole.toUpperCase()}?`)) {
      try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
      } catch (error) {
        alert("Gagal mengubah role.");
      }
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Hapus pengguna permanen?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        alert("Gagal menghapus.");
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center pb-24 text-slate-900 italic font-medium selection:bg-blue-100">
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-slate-100">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-900 to-[#020617] pt-12 pb-20 px-8 rounded-b-[4rem] relative text-white shadow-xl">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-5">
              <Link to="/admin" className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all">
                <HiOutlineChevronLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">User Control</h1>
                <p className="text-xl font-black uppercase tracking-tighter italic">Database <span className="text-blue-400">Anggota</span></p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-6 py-4 rounded-2xl uppercase shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2">
              <HiOutlineUserAdd size={18} /> Registrasi
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="px-8 -mt-10 relative z-20">
          <div className="bg-white rounded-3xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center group transition-all focus-within:ring-4 focus-within:ring-blue-500/5">
            <div className="pl-6 opacity-30 group-focus-within:opacity-100 transition-opacity">
              <HiOutlineSearch size={20} className="text-blue-900" />
            </div>
            <input
              type="text"
              placeholder="Cari Nama, NTA, atau Kode..."
              className="w-full bg-transparent border-none p-4 text-sm font-bold outline-none italic placeholder:text-slate-300"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* USER LIST */}
        <div className="flex-1 px-8 mt-12 overflow-y-auto custom-scroll">
          <div className="flex justify-between items-end mb-8 px-2">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Verified Personnel ({filteredUsers.length})</h2>
             <div className="h-[1px] flex-1 bg-slate-100 ml-4 mb-1.5" />
          </div>

          <div className="space-y-4 pb-20">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing database...</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={u.id} 
                  className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black border-2 shadow-inner transition-transform group-hover:scale-105 duration-500 ${u.role === "pembina" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-900 border-blue-100"}`}>
                      {u.nama?.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight italic">{u.nama}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${u.jenisKelamin === "Laki-laki" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-pink-50 text-pink-600 border-pink-100"}`}>
                          {u.jenisKelamin || "Laki-laki"}
                        </span>
                        <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-full italic">NTA: {u.nta}</span>
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${u.isClaimed ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-red-50 text-red-600 border-red-100"}`}>
                          {u.isClaimed ? "AKTIF" : `CODE: ${u.id}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => toggleRole(u.id, u.role)} title="Switch Role" className="w-11 h-11 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-all border border-slate-100 active:scale-90">
                      <HiOutlineSwitchHorizontal size={20} />
                    </button>
                    <button onClick={() => deleteUser(u.id)} title="Delete User" className="w-11 h-11 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all border border-slate-100 active:scale-90">
                      <HiOutlineTrash size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* --- MODAL ADD USER --- */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 italic font-medium">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/20"
              >
                <div className="bg-gradient-to-br from-blue-900 to-[#020617] p-10 text-center text-white relative">
                  <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><HiOutlineX size={24} /></button>
                  <h2 className="text-2xl font-black uppercase italic leading-none">New Recruit</h2>
                  <p className="text-[9px] opacity-40 font-bold uppercase mt-3 tracking-[0.3em]">Master Database Entry</p>
                </div>
                <form onSubmit={handleAddUser} className="p-8 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Full Name</label>
                    <input type="text" autoFocus value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Contoh: Muhammad Fikri" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Official NTA</label>
                    <input type="text" value={newUserNTA} onChange={(e) => setNewUserNTA(e.target.value)} placeholder="Input NTA Gudep" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-blue-900 outline-none focus:border-blue-900 transition-all italic text-sm" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Gender Division</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setNewUserGender("Laki-laki")} className={`py-3.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${newUserGender === "Laki-laki" ? "bg-blue-900 border-blue-900 text-white shadow-lg" : "bg-slate-50 border-slate-100 text-slate-300"}`}>Laki-laki</button>
                      <button type="button" onClick={() => setNewUserGender("Perempuan")} className={`py-3.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${newUserGender === "Perempuan" ? "bg-blue-900 border-blue-900 text-white shadow-lg" : "bg-slate-50 border-slate-100 text-slate-300"}`}>Perempuan</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Account Role</label>
                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-800 outline-none italic text-sm appearance-none">
                      <option value="anggota">ANGGOTA (SISWA)</option>
                      <option value="pembina">PEMBINA (GURU)</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95 transition-all italic">Initialize Data</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- MODAL SUCCESS RESULT (DENGAN FITUR SALIN) --- */}
        <AnimatePresence>
          {showResultModal && (
            <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-[110] flex items-center justify-center p-6 italic">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-white w-full max-w-sm rounded-[4rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-4 border-white/20"
              >
                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-12 text-center text-white relative">
                  <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-xl">
                    <HiOutlineCheckCircle size={48} className="text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black uppercase italic leading-none">Recruit <br /> Added!</h2>
                </div>

                <div className="p-10 space-y-8 text-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Target Personnel</p>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{newUserName}</h3>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.3em]">{newUserNTA} • {newUserGender}</p>
                  </div>

                  {/* BOX KODE DENGAN TOMBOL SALIN */}
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 relative group">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Activation Code</p>
                    <div className="text-4xl font-black text-blue-900 tracking-[0.3em] mb-4">{generatedCode}</div>
                    
                    <button 
                      onClick={copyToClipboard}
                      className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${isCopied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 shadow-sm'}`}
                    >
                      {isCopied ? (
                        <>
                          <HiOutlineCheck size={14} />
                          Copied to Clipboard
                        </>
                      ) : (
                        <>
                          <HiOutlineClipboardCopy size={14} />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  <button 
                    onClick={closeResultModal} 
                    className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all italic flex items-center justify-center gap-3"
                  >
                    Close & Sync
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5); }
      `}</style>
    </div>
  );
}