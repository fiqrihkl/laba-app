import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirm } from "../pembina/context/ConfirmContext";

// --- ICONS ---
import { 
  HiOutlineChevronLeft, 
  HiOutlineSearch, 
  HiOutlineTrendingUp, 
  HiOutlineTrendingDown,
  HiOutlineX,
  HiOutlineShieldCheck
} from "react-icons/hi";

export default function ValidasiPoin() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // State untuk Modal Penyesuaian XP
  const [selectedUser, setSelectedUser] = useState(null);
  const [xpAmount, setXpAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("nama", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const userData = [];
      snap.forEach((doc) => userData.push({ id: doc.id, ...doc.data() }));
      setUsers(userData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdjustXP = async (e) => {
    e.preventDefault();
    if (!xpAmount || !reason) return alert("Jumlah XP dan Alasan wajib diisi!");

    confirm({
      title: "Konfirmasi Poin?",
      message: `Tindakan ini akan memvalidasi ${xpAmount} XP untuk ${selectedUser.nama.toUpperCase()}. Lanjutkan?`,
      confirmText: "Eksekusi",
      cancelText: "Batal",
      type: parseInt(xpAmount) >= 0 ? "blue" : "danger",
      onConfirm: async () => {
        setIsProcessing(true);
        const amount = parseInt(xpAmount);
        const now = new Date().toISOString();
        const currentUser = auth.currentUser;

        try {
          const userRef = doc(db, "users", selectedUser.id);

          await updateDoc(userRef, {
            points: increment(amount),
            attendanceLog: arrayUnion({
              timestamp: now,
              activity: reason, 
              pointsEarned: amount, 
              type: "MANUAL_ADJUSTMENT" 
            })
          });

          await addDoc(collection(db, "logs"), {
            action: "Penyesuaian XP",
            targetName: selectedUser.nama,
            targetId: selectedUser.id,
            amount: amount,
            reason: reason,
            adminName: currentUser?.displayName || "Pembina",
            timestamp: serverTimestamp(),
          });

          setSelectedUser(null);
          setXpAmount("");
          setReason("");
        } catch (error) {
          alert("Gagal memproses validasi poin.");
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      u.role === "anggota",
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] italic">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
      <div className="text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">
        Sinkronisasi Data Otoritas...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900">
      <div className="max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20 relative">
          <div className="flex items-center gap-4 relative z-10">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Otoritas Poin</h1>
              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter mt-1">Validasi XP Manual</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-lg relative z-10">
            <HiOutlineShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </header>

        {/* SEARCH BAR */}
        <div className="p-6">
          <div className="bg-slate-900 border border-white/5 rounded-2xl flex items-center px-4 focus-within:border-emerald-500/50 transition-all shadow-inner">
            <HiOutlineSearch className="text-slate-500" />
            <input
              type="text"
              placeholder="CARI NAMA ANGGOTA..."
              className="w-full bg-transparent p-4 text-xs font-bold outline-none text-white placeholder:text-slate-700 uppercase"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* USER LIST */}
        <main className="flex-1 px-6 space-y-3 pb-10 overflow-y-auto custom-scroll">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Unit Laskar Aktif ({filteredUsers.length})</h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest">Data Tidak Ditemukan</div>
          ) : (
            filteredUsers.map((u) => (
              <motion.div 
                layout
                key={u.id} 
                className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-all shadow-xl"
              >
                <div className="flex items-center gap-4">
                  {/* FOTO PROFIL ATAU INISIAL */}
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center font-black text-blue-400 text-sm border border-white/5 uppercase shadow-inner overflow-hidden">
                    {u.fotoUrl ? (
                      <img src={u.fotoUrl} className="w-full h-full object-cover" alt={u.nama} />
                    ) : (
                      u.nama.substring(0, 1)
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-100 text-[10px] uppercase tracking-tight">{u.nama}</h3>
                    <p className="text-[8px] text-slate-500 font-black uppercase mt-1 tracking-widest">{u.tingkat || "Laskar"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-500 tracking-tighter leading-none">{u.points || 0}</p>
                    <p className="text-[6px] text-slate-600 font-black uppercase tracking-tighter mt-1">Total XP</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-lg shadow-blue-900/20"
                  >
                    Atur
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </main>

        {/* MODAL ADJUST XP */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative"
              >
                <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white z-10">
                  <HiOutlineX size={24} />
                </button>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 text-center text-white relative">
                   <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                   {/* FOTO PROFIL ATAU INISIAL DI DALAM MODAL */}
                   <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 border border-white/30 flex items-center justify-center text-2xl font-black shadow-xl overflow-hidden uppercase relative z-10">
                    {selectedUser.fotoUrl ? (
                      <img src={selectedUser.fotoUrl} className="w-full h-full object-cover" alt={selectedUser.nama} />
                    ) : (
                      selectedUser.nama.substring(0, 1)
                    )}
                   </div>
                   <h2 className="text-lg font-black uppercase tracking-tighter relative z-10">{selectedUser.nama}</h2>
                   <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 relative z-10">Protokol: Penyesuaian XP</p>
                </div>

                <form onSubmit={handleAdjustXP} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Jumlah XP (+/-)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={xpAmount}
                          onChange={(e) => setXpAmount(e.target.value)}
                          placeholder="Misal: 100 atau -50"
                          className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-xl font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Alasan Operasi</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows="3"
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-[10px] font-bold text-slate-300 outline-none focus:border-emerald-500/50 transition-all resize-none shadow-inner uppercase italic tracking-tighter"
                        placeholder="BERIKAN JUSTIFIKASI JELAS..."
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      type="submit" 
                      disabled={isProcessing} 
                      className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                    >
                      {isProcessing ? "MENGIRIM..." : "OTORISASI PERUBAHAN"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedUser(null)} 
                      className="w-full py-2 font-black text-slate-600 uppercase text-[9px] tracking-widest hover:text-white transition-colors"
                    >
                      BATALKAN MISI
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-auto p-8 text-center border-t border-white/5 bg-slate-900/10">
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.5em] italic">Protokol Kendali Otoritas v4.0</p>
        </footer>
      </div>
    </div>
  );
}