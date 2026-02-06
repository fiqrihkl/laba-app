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
import { 
  HiOutlineChevronLeft, 
  HiOutlineBadgeCheck, 
  HiOutlineSearch, 
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineClipboardCheck,
  HiOutlineInformationCircle,
  HiOutlineExclamation,
  HiOutlineX,
  HiOutlineChevronDown
} from "react-icons/hi";

export default function VerifikasiSKU() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    type: 'confirm', 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const navigate = useNavigate();

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

  const showAlert = (title, message) => {
    setModalConfig({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModalConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

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

      showAlert("BERHASIL", `${req.nama_anggota} dinyatakan lulus dan menerima +${bonusXP} XP.`);
    } catch (error) {
      showAlert("ERROR", "Gagal melakukan verifikasi. Coba lagi nanti.");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = req.status === filter;
    const name = req.nama_anggota || ""; 
    return matchesStatus && name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans uppercase text-[10px] tracking-widest">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
      Memuat Antrean...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans selection:bg-blue-900 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 flex items-center gap-4 border-b border-white/5 bg-slate-900/20">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
          >
            <HiOutlineChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest">Approval Hub</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Validasi SKU Laskar</p>
          </div>
        </header>

        {/* SEARCH & FILTER */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-900 border border-white/5 rounded-xl flex items-center px-4 focus-within:border-blue-500/50 transition-all">
            <HiOutlineSearch className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari Nama Anggota..." 
              className="w-full bg-transparent p-3.5 text-xs font-medium outline-none text-white placeholder:text-slate-700" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setFilter("pending")} 
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${filter === "pending" ? "bg-blue-600 text-white" : "text-slate-500"}`}
            >
              <HiOutlineClock size={14} /> Antrean
            </button>
            <button 
              onClick={() => setFilter("verified")} 
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${filter === "verified" ? "bg-emerald-600 text-white" : "text-slate-500"}`}
            >
              <HiOutlineBadgeCheck size={14} /> Riwayat
            </button>
          </div>
        </div>

        {/* LIST REQUESTS */}
        <main className="px-6 flex-1 space-y-3 pb-10 overflow-y-auto custom-scroll">
          <AnimatePresence mode="popLayout">
            {filteredRequests.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl opacity-40">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-sans not-italic">Tidak Ada Data</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <motion.div 
                  layout
                  key={req.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-slate-900 border border-white/5 rounded-xl overflow-hidden transition-all ${expandedId === req.id ? 'border-blue-500/30' : ''}`}
                >
                  {/* Card Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-blue-400 text-xs border border-white/5">
                        {req.nama_anggota?.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">{req.nama_anggota}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                          {req.tingkat} • <span className="text-blue-500">Poin {req.nomor_poin}</span>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      className="p-2 text-slate-500"
                    >
                      <HiOutlineChevronDown className={`transition-transform duration-300 ${expandedId === req.id ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>
                  </div>

                  {/* Card Detail (Expandable) */}
                  <AnimatePresence>
                    {expandedId === req.id && (
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden bg-black/20"
                      >
                        <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2">
                          <div className="bg-slate-800/30 p-3 rounded-lg border border-white/5 mt-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-[8px] uppercase tracking-widest">
                                <HiOutlineInformationCircle size={14} /> Deskripsi Tugas
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                              "{req.deskripsi_poin}"
                            </p>
                          </div>

                          {req.status === "pending" ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleReject(req.id, req.nama_anggota)} 
                                className="p-3 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                              >
                                <HiOutlineTrash size={18} />
                              </button>
                              <button 
                                onClick={() => showConfirm("KONFIRMASI LULUS", `Luluskan Poin ${req.nomor_poin} untuk ${req.nama_anggota}?`, () => executeVerify(req))} 
                                disabled={isProcessing === req.id}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                              >
                                {isProcessing === req.id ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <><HiOutlineClipboardCheck size={16} /> Verifikasi Lulus</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="py-3 px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                              <span className="text-[9px] text-emerald-500 font-bold uppercase flex items-center gap-2">
                                <HiOutlineBadgeCheck size={14} /> Terverifikasi
                              </span>
                              <span className="text-[8px] text-slate-500 uppercase font-medium tracking-tight">Oleh: {req.verifikator_nama}</span>
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

        {/* --- CUSTOM MODAL --- */}
        <AnimatePresence>
          {modalConfig.isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 w-full max-w-xs rounded-2xl p-6 border border-white/10 text-center shadow-2xl">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${modalConfig.type === 'confirm' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                   {modalConfig.type === 'confirm' ? <HiOutlineExclamation size={24}/> : <HiOutlineBadgeCheck size={24}/>}
                </div>
                <h3 className="text-xs font-bold uppercase text-white mb-2">{modalConfig.title}</h3>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6 uppercase tracking-tight italic">"{modalConfig.message}"</p>
                <div className="flex flex-col gap-2">
                  {modalConfig.type === 'confirm' ? (
                    <>
                      <button onClick={() => { modalConfig.onConfirm(); closeModal(); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">Ya, Lanjutkan</button>
                      <button onClick={closeModal} className="w-full text-slate-500 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest">Batal</button>
                    </>
                  ) : (
                    <button onClick={closeModal} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">Selesai</button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}