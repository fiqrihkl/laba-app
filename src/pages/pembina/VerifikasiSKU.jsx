import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  increment,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirm } from "./context/ConfirmContext"; // Import Konteks Konfirmasi

import { 
  HiOutlineChevronLeft, 
  HiOutlineBadgeCheck, 
  HiOutlineSearch, 
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineClipboardCheck,
  HiOutlineInformationCircle,
  HiOutlineChevronDown
} from "react-icons/hi";

export default function VerifikasiSKU() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  
  const navigate = useNavigate();
  const confirm = useConfirm(); // Inisialisasi Hook Konfirmasi

  useEffect(() => {
    const q = query(collection(db, "sku_progress"), orderBy("tgl_pengajuan", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- FUNGSI EKSEKUSI VERIFIKASI LULUS ---
  const executeVerify = async (req) => {
    setIsProcessing(req.id);
    const currentUser = auth.currentUser;
    
    try {
      let bonusXP = 50; 
      if (req.tingkat === "Rakit") bonusXP = 75;
      if (req.tingkat === "Terap") bonusXP = 100;

      const skuRef = doc(db, "sku_progress", req.id);
      const userRef = doc(db, "users", req.uid);

      await updateDoc(skuRef, {
        status: "verified",
        tgl_verifikasi: serverTimestamp(),
        verifikator_id: currentUser?.uid || "system",
        verifikator_nama: currentUser?.displayName || "Pembina",
      });

      await updateDoc(userRef, {
        points: increment(bonusXP),
        attendanceLog: arrayUnion({
          timestamp: new Date().toISOString(),
          activity: `Lulus SKU ${req.tingkat} Poin ${req.nomor_poin}`,
          pointsEarned: bonusXP,
          isSeen: false 
        })
      });

      await addDoc(collection(db, "logs"), {
        action: "Verifikasi SKU",
        adminName: currentUser?.displayName || "Pembina",
        targetName: req.nama_anggota,
        targetId: req.uid,
        reason: `Meluluskan ${req.tingkat} - Poin ${req.nomor_poin}`,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      alert("Gagal melakukan verifikasi. Coba lagi nanti.");
    } finally {
      setIsProcessing(null);
    }
  };

  // --- FUNGSI EKSEKUSI TOLAK (HAPUS) ---
  const executeReject = async (reqId, nama, uid, alasan) => {
    try {
      await deleteDoc(doc(db, "sku_progress", reqId));
      
      // Logging audit trail penolakan
      await addDoc(collection(db, "logs"), {
        action: "Penolakan SKU",
        adminName: auth.currentUser?.displayName || "Pembina",
        targetName: nama,
        targetId: uid,
        reason: `SKU Ditolak: ${alasan || "Tidak ada alasan spesifik"}`,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      alert("Gagal menghapus pengajuan.");
    }
  };

  // --- TRIGER MODAL KONFIRMASI LULUS ---
  const handleApproveClick = (req) => {
    confirm({
      title: "Konfirmasi Lulus",
      message: `NYATAKAN ${req.nama_anggota.toUpperCase()} LULUS PADA SKU ${req.tingkat.toUpperCase()} POIN ${req.nomor_poin}?`,
      confirmText: "Luluskan",
      cancelText: "Batal",
      type: "blue",
      onConfirm: () => executeVerify(req)
    });
  };

  // --- TRIGGER MODAL KONFIRMASI TOLAK (DENGAN INPUT ALASAN) ---
  const handleRejectClick = (req) => {
    confirm({
      title: "Tolak Pengajuan?",
      message: `HAPUS PENGAJUAN DARI ${req.nama_anggota.toUpperCase()}? ANDA DAPAT MEMBERIKAN ALASAN DI BAWAH:`,
      confirmText: "Tolak & Hapus",
      cancelText: "Kembali",
      type: "danger",
      showInput: true, // AKTIFKAN INPUT ALASAN
      inputPlaceholder: "Contoh: Bukti tidak sesuai...",
      onConfirm: (alasan) => executeReject(req.id, req.nama_anggota, req.uid, alasan)
    });
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = req.status === filter;
    const name = req.nama_anggota || ""; 
    return matchesStatus && name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans uppercase text-[10px] tracking-widest italic font-black">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
      Syncing Request Intel...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans selection:bg-blue-900 overflow-x-hidden italic">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center gap-4 border-b border-white/5 bg-slate-900/20 relative">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 relative z-10">
            <HiOutlineChevronLeft size={24} />
          </button>
          <div className="relative z-10">
            <h1 className="text-sm font-black uppercase tracking-widest">Approval Hub</h1>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-tighter mt-1">Laskar Progress Validator</p>
          </div>
        </header>

        {/* SEARCH & FILTER */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-900 border border-white/5 rounded-2xl flex items-center px-4 focus-within:border-blue-500/50 transition-all shadow-inner">
            <HiOutlineSearch className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari Nama Anggota..." 
              className="w-full bg-transparent p-4 text-xs font-bold outline-none text-white placeholder:text-slate-700 uppercase" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setFilter("pending")} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${filter === "pending" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-600 hover:text-slate-400"}`}
            >
              <HiOutlineClock size={16} /> Antrean
            </button>
            <button 
              onClick={() => setFilter("verified")} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${filter === "verified" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-600 hover:text-slate-400"}`}
            >
              <HiOutlineBadgeCheck size={16} /> Riwayat
            </button>
          </div>
        </div>

        {/* LIST REQUESTS */}
        <main className="px-6 flex-1 space-y-4 pb-10 overflow-y-auto custom-scroll">
          <AnimatePresence mode="popLayout">
            {filteredRequests.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center border border-dashed border-white/5 rounded-[2rem] opacity-30">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">No Intelligence Data</p>
              </motion.div>
            ) : (
              filteredRequests.map((req) => (
                <motion.div 
                  layout
                  key={req.id} 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }}
                  className={`bg-slate-900/50 border border-white/5 rounded-[2rem] overflow-hidden transition-all shadow-xl ${expandedId === req.id ? 'border-blue-500/30 bg-slate-900' : ''}`}
                >
                  {/* Card Header */}
                  <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-blue-400 text-sm border border-white/5 uppercase shadow-inner">
                        {req.nama_anggota?.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight">{req.nama_anggota}</h3>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mt-1">
                          {req.tingkat} • <span className="text-blue-500">Poin {req.nomor_poin}</span>
                        </p>
                      </div>
                    </div>
                    <HiOutlineChevronDown className={`text-slate-600 transition-transform duration-500 ${expandedId === req.id ? 'rotate-180 text-blue-500' : ''}`} size={20} />
                  </div>

                  {/* Card Detail (Expandable) */}
                  <AnimatePresence>
                    {expandedId === req.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/20"
                      >
                        <div className="p-6 pt-0 space-y-6 border-t border-white/5">
                          <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 mt-4 relative">
                            <div className="flex items-center gap-2 mb-3 text-slate-500 font-black text-[8px] uppercase tracking-widest">
                                <HiOutlineInformationCircle size={14} className="text-blue-500" /> Objective Details
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                              "{req.deskripsi_poin}"
                            </p>
                          </div>

                          {req.status === "pending" ? (
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleRejectClick(req)} 
                                className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                              >
                                <HiOutlineTrash size={20} />
                              </button>
                              <button 
                                onClick={() => handleApproveClick(req)} 
                                disabled={isProcessing === req.id}
                                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                              >
                                {isProcessing === req.id ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <><HiOutlineClipboardCheck size={18} /> Approve Progress</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="py-4 px-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                              <span className="text-[9px] text-emerald-500 font-black uppercase flex items-center gap-2 italic">
                                <HiOutlineBadgeCheck size={16} /> Mission Verified
                              </span>
                              <span className="text-[8px] text-slate-600 font-black uppercase tracking-tight">By: {req.verifikator_nama}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto py-8 text-center border-t border-white/5 mx-6 opacity-20">
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em]">NAVIGASI Approval Protocol v4.2</p>
        </footer>
      </div>
    </div>
  );
}