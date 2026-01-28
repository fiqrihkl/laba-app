import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase"; // Pastikan auth diimport
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
import { Link } from "react-router-dom";
import { HiOutlineChevronLeft, HiOutlineSearch, HiOutlineTrendingUp } from "react-icons/hi";

export default function ValidasiPoin() {
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

  // --- Fungsi Penyesuaian XP (Validasi) ---
  const handleAdjustXP = async (e) => {
    e.preventDefault();
    if (!xpAmount || !reason) return alert("Jumlah XP dan Alasan wajib diisi!");

    setIsProcessing(true);
    const amount = parseInt(xpAmount);
    const now = new Date().toISOString();
    const currentUser = auth.currentUser;

    try {
      const userRef = doc(db, "users", selectedUser.id);

      // 1. Update Poin User DAN Tambahkan ke array attendanceLog untuk Riwayat Anggota
      await updateDoc(userRef, {
        points: increment(amount),
        attendanceLog: arrayUnion({
          timestamp: now,
          activity: reason, 
          pointsEarned: amount, 
          type: "MANUAL_ADJUSTMENT" 
        })
      });

      // 2. Catat ke Log Keamanan Internal Admin (Audit Trail)
      await addDoc(collection(db, "logs"), {
        action: "Penyesuaian XP",
        targetName: selectedUser.nama,
        targetId: selectedUser.id,
        amount: amount,
        reason: reason,
        adminName: currentUser?.displayName || "Administrator", // Nama dinamis
        timestamp: serverTimestamp(),
      });

      alert(`BERHASIL!\n${amount} XP telah diaplikasikan ke akun ${selectedUser.nama}\nAudit log telah dicatat.`);
      
      setSelectedUser(null);
      setXpAmount("");
      setReason("");
    } catch (error) {
      console.error(error);
      alert("Gagal memproses validasi poin. Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      u.role === "anggota",
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-green-600 animate-pulse uppercase text-[10px] tracking-widest">
        Sinkronisasi Data Otoritas...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-slate-100">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-green-600 to-teal-700 pt-12 pb-16 px-8 rounded-b-[3.5rem] relative overflow-hidden text-white shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
                <HiOutlineChevronLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic">Validasi XP</h1>
                <p className="text-green-100 text-[9px] font-bold uppercase tracking-widest mt-1.5 opacity-80 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Otoritas Poin
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
              <HiOutlineTrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-[2rem] p-2 shadow-xl border border-slate-100 flex items-center group transition-all focus-within:ring-4 focus-within:ring-green-600/5">
            <div className="pl-5 opacity-30 group-focus-within:opacity-100 transition-opacity">
              <HiOutlineSearch className="w-4 h-4 text-slate-800" />
            </div>
            <input
              type="text"
              placeholder="Cari nama anggota..."
              className="w-full bg-transparent border-none p-4 text-xs font-black text-slate-800 outline-none italic uppercase tracking-widest"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* USER LIST */}
        <div className="flex-1 px-6 mt-8">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-4 italic">
            Daftar Anggota Aktif ({filteredUsers.length})
          </h2>

          <div className="space-y-4 pb-12">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest">Data Tidak Ditemukan</div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="bg-white border border-slate-100 p-5 rounded-[2.5rem] flex justify-between items-center hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-blue-900 italic border border-slate-100 group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner uppercase">
                      {u.nama.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-tight">{u.nama}</h3>
                      <p className="text-[8px] text-slate-400 font-black uppercase mt-1 tracking-widest">{u.tingkat || "Penggalang"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-black text-green-600 tracking-tighter italic">{u.points || 0} XP</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-md">
                      SESUAIKAN
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODAL ADJUST XP */}
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6 italic font-medium">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
              <div className="bg-gradient-to-br from-green-600 to-teal-700 p-10 text-center text-white relative">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">XP ADJUSTER</h2>
                <p className="text-[10px] opacity-70 font-bold uppercase mt-3 tracking-[0.2em]">{selectedUser.nama}</p>
              </div>

              <form onSubmit={handleAdjustXP} className="p-10 space-y-7">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah XP (+/-)</label>
                  <input
                    type="number"
                    value={xpAmount}
                    onChange={(e) => setXpAmount(e.target.value)}
                    placeholder="Contoh: 100 atau -50"
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 mt-2 font-black text-slate-800 outline-none focus:ring-2 focus:ring-green-100 transition-all shadow-inner"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Penyesuaian</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows="3"
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 mt-2 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-green-100 transition-all resize-none shadow-inner"
                    placeholder="Contoh: Bonus Aktifitas / Pelanggaran"
                    required
                  />
                </div>
                <div className="flex gap-5 pt-4">
                  <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-5 font-black text-slate-400 uppercase text-[9px] tracking-widest">BATAL</button>
                  <button type="submit" disabled={isProcessing} className="flex-[2] bg-green-600 text-white font-black py-5 rounded-2xl text-[9px] uppercase shadow-xl shadow-green-600/20 active:scale-95 transition-all">
                    {isProcessing ? "MENGIRIM..." : "UPDATE XP"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer className="p-8 text-center bg-slate-50 border-t border-slate-100">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">Authority Control v3.5</p>
        </footer>
      </div>
    </div>
  );
}