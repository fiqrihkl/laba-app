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

// --- IMPORT KONTEKS KONFIRMASI ---
import { useConfirm } from "../pembina/context/ConfirmContext";

// --- ICONS ---
import { 
  HiOutlineUserAdd, 
  HiOutlineChevronLeft, 
  HiOutlineSearch, 
  HiOutlineTrash, 
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineClipboardCopy,
  HiOutlineIdentification,
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiOutlineStatusOnline,
  HiOutlineLogout
} from "react-icons/hi";

export default function KelolaPengguna() {
  const navigate = useNavigate();
  const confirm = useConfirm(); 
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, lobby
  const [loading, setLoading] = useState(true);

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null); 
  const [isCopied, setIsCopied] = useState(false);
  
  // State Form
  const [newUserName, setNewUserName] = useState("");
  const [newUserNTA, setNewUserNTA] = useState("");
  const [newUserRole, setNewUserRole] = useState("anggota");
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

  const deleteUser = async (user) => {
    confirm({
      title: "Hapus Personel?",
      message: `DATA ${user.nama.toUpperCase()} AKAN DIHAPUS PERMANEN. TINDAKAN INI TIDAK DAPAT DIBATALKAN.`,
      confirmText: "Hapus Permanen",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", user.id));
        } catch (error) { alert("Gagal menghapus."); }
      }
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTingkat = 
      filterTingkat === "all" ? true :
      filterTingkat === "pembina" ? u.role === "pembina" :
      u.tingkat?.toLowerCase() === filterTingkat.toLowerCase();

    const matchesStatus = 
      filterStatus === "all" ? true :
      filterStatus === "active" ? u.isClaimed === true :
      u.isClaimed === false;

    return matchesSearch && matchesTingkat && matchesStatus;
  });

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
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Personnel Management</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95"
          >
            <HiOutlineUserAdd size={20} />
          </button>
        </header>

        {/* SEARCH & FILTER */}
        <div className="p-6 space-y-4">
          {/* SEARCH BAR */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl flex items-center px-4 focus-within:border-blue-500/50 transition-all">
            <HiOutlineSearch className="text-slate-500" />
            <input 
              type="text" 
              placeholder="CARI NAMA / NTA / ID..." 
              className="w-full bg-transparent p-3.5 text-xs font-medium outline-none text-white placeholder:text-slate-700 uppercase tracking-widest" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          {/* FILTER STATUS */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Semua Unit" },
              { id: "active", label: "Deployed" },
              { id: "lobby", label: "In Lobby" }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-4 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                  filterStatus === s.id ? "bg-slate-100 border-white text-slate-900 shadow-lg" : "bg-slate-900 border-white/5 text-slate-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* FILTER TINGKATAN */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {["all", "PENGGALANG", "pembina"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTingkat(t)}
                className={`px-4 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                  filterTingkat === t ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" : "bg-slate-900 border-white/5 text-slate-500"
                }`}
              >
                {t === "all" ? "Tingkatan: All" : t}
              </button>
            ))}
          </div>
        </div>

        {/* USER LIST */}
        <main className="flex-1 px-6 space-y-3 pb-10 overflow-y-auto custom-scroll">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Result: {filteredUsers.length}</h2>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Scanning Database...</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <motion.div 
                layout
                key={u.id} 
                className={`bg-slate-900 border p-4 rounded-2xl flex items-center justify-between group transition-all ${!u.isClaimed ? 'border-yellow-500/20' : 'border-white/5 hover:border-blue-500/30'}`}
              >
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedUser(u)}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border overflow-hidden ${u.role === "pembina" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                    {u.fotoUrl ? <img src={u.fotoUrl} className="w-full h-full object-cover" /> : u.nama?.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight">{u.nama}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {u.isClaimed ? (
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                          <HiOutlineStatusOnline size={8}/> DEPLOYED
                        </span>
                      ) : (
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 flex items-center gap-1 animate-pulse border border-yellow-500/20">
                          <HiOutlineClock size={8}/> IN LOBBY
                        </span>
                      )}
                      <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter italic">NTA: {u.nta}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteUser(u)} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                  <HiOutlineTrash size={18} />
                </button>
              </motion.div>
            ))
          )}
        </main>

        {/* MODAL DETAIL USER (INTEL DOSSIER) */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[2000] flex items-center justify-center p-6 text-left">
              <motion.div 
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative"
              >
                <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white z-10">
                  <HiOutlineX size={24} />
                </button>

                <div className="p-8 pb-4 text-center">
                   <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-4 border-2 p-1 ${selectedUser.role === 'pembina' ? 'border-amber-500/30' : 'border-blue-500/30'}`}>
                      <div className="w-full h-full bg-slate-800 rounded-[1.7rem] flex items-center justify-center text-3xl font-black overflow-hidden uppercase">
                        {selectedUser.fotoUrl ? <img src={selectedUser.fotoUrl} className="w-full h-full object-cover" /> : selectedUser.nama?.substring(0, 1)}
                      </div>
                   </div>
                   <h2 className="text-lg font-black text-white uppercase tracking-tighter">{selectedUser.nama}</h2>
                   <div className="flex items-center justify-center gap-2 mt-1">
                      {selectedUser.isClaimed ? (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">SYSTEM DEPLOYED</span>
                      ) : (
                        <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest animate-pulse">AWAITING ACTIVATION (IN LOBBY)</span>
                      )}
                   </div>
                </div>

                <div className="p-8 pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[7px] text-slate-500 font-black uppercase mb-1">Intelligence</p>
                      <p className="text-xs font-black text-white uppercase">LVL {selectedUser.level || 1}</p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[7px] text-slate-500 font-black uppercase mb-1">Experience</p>
                      <p className="text-xs font-black text-blue-500">{selectedUser.points || 0} XP</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[8px] text-slate-500 font-black uppercase flex items-center gap-2"><HiOutlineIdentification/> NTA Nasional</span>
                      <span className="text-[9px] font-bold text-slate-300 tracking-widest">{selectedUser.nta}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[8px] text-slate-500 font-black uppercase flex items-center gap-2"><HiOutlineBadgeCheck/> Tingkatan</span>
                      <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase">{selectedUser.tingkat}</span>
                    </div>
                    {!selectedUser.isClaimed && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[8px] text-yellow-500 font-black uppercase flex items-center gap-2"><HiOutlineLogout/> Access Code</span>
                        <span className="text-[9px] font-black text-yellow-500 tracking-widest">{selectedUser.id}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-500 font-black uppercase flex items-center gap-2"><HiOutlineClock/> Registered</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Dismiss Dossier
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL ADD USER */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1500] flex items-center justify-center p-6 text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 w-full max-w-xs rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"
              >
                <div className="p-6 bg-blue-600 text-white">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xs font-black uppercase tracking-widest">Aktivasi Unit</h2>
                    <button onClick={() => setShowAddModal(false)}><HiOutlineX size={20} /></button>
                  </div>
                  <p className="text-[9px] opacity-70 uppercase font-bold italic">Deploy New Laskar into System</p>
                </div>
                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Nama Lengkap</label>
                    <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Contoh: Andi Wijaya" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 uppercase font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Nomor NTA</label>
                    <input type="text" value={newUserNTA} onChange={(e) => setNewUserNTA(e.target.value)} placeholder="00.00.000" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-blue-400 outline-none focus:border-blue-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Otoritas Akses</label>
                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none font-bold uppercase tracking-tighter">
                      <option value="anggota">LASKAR (ANGGOTA)</option>
                      <option value="pembina">OFFICER (PEMBINA)</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-xl">Deploy Unit</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL SUCCESS RESULT */}
        <AnimatePresence>
          {showResultModal && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[1600] flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 w-full max-w-xs rounded-3xl p-8 border border-white/10 text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <HiOutlineCheck size={32} />
                </div>
                <h2 className="text-sm font-black uppercase text-white mb-2 tracking-tighter">Personel Terdaftar</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-6 italic">Secure Activation Code Generated:</p>

                <div className="bg-black/50 rounded-2xl p-6 border border-white/5 mb-8 relative group">
                   <div className="text-4xl font-black text-blue-500 tracking-[0.2em] mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">{generatedCode}</div>
                   <button 
                      onClick={copyToClipboard}
                      className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${isCopied ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <HiOutlineClipboardCopy size={14} /> {isCopied ? "Identity Secured" : "Copy Identity Code"}
                   </button>
                </div>

                <button onClick={() => setShowResultModal(false)} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">Mission Start</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}