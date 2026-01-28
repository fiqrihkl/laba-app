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
  addDoc, // Ditambahkan untuk logging
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { 
  HiOutlineChevronLeft, 
  HiOutlineBadgeCheck, 
  HiOutlineSearch, 
  HiOutlineTrash,
  HiOutlineClock
} from "react-icons/hi";

export default function VerifikasiSKU() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "sku_progress"),
      orderBy("tgl_pengajuan", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // --- FUNGSI VERIFIKASI DENGAN LOGGING OTOMATIS ---
  const handleVerify = async (req) => {
    if (!window.confirm(`Luluskan Poin ${req.nomor_poin} untuk ${req.nama_anggota}?`)) return;

    setIsProcessing(req.id);
    const currentUser = auth.currentUser;
    
    try {
      // 1. Tentukan nominal XP berdasarkan tingkatan
      let bonusXP = 50; 
      if (req.tingkat === "Rakit") bonusXP = 75;
      if (req.tingkat === "Terap") bonusXP = 100;

      const skuRef = doc(db, "sku_progress", req.id);
      const userRef = doc(db, "users", req.uid);

      // 2. Update Status SKU
      await updateDoc(skuRef, {
        status: "verified",
        tgl_verifikasi: serverTimestamp(),
        verifikator_id: currentUser?.uid || "system",
        verifikator_nama: currentUser?.displayName || "Pembina",
      });

      // 3. Tambah XP & Catat di Activity Hub Anggota
      await updateDoc(userRef, {
        points: increment(bonusXP),
        attendanceLog: arrayUnion({
          timestamp: new Date().toISOString(),
          activity: `Lulus SKU ${req.tingkat} Poin ${req.nomor_poin}`,
          pointsEarned: bonusXP,
          isSeen: false 
        })
      });

      // 4. INTEGRASI AUDIT TRAIL (Logging untuk Admin)
      await addDoc(collection(db, "logs"), {
        action: "Verifikasi SKU",
        adminName: currentUser?.displayName || "Pembina",
        targetName: req.nama_anggota,
        targetId: req.uid,
        reason: `Meluluskan ${req.tingkat} - Poin ${req.nomor_poin}`,
        timestamp: serverTimestamp(),
      });

      alert(`Berhasil! ${req.nama_anggota} lulus & mendapatkan +${bonusXP} XP.`);
    } catch (error) {
      console.error("Error Detail:", error);
      alert("Gagal memproses verifikasi.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id, studentName) => {
    const reason = window.prompt(`Alasan penolakan untuk ${studentName || 'Anggota'}:`, "Belum menguasai materi.");
    if (reason === null) return;

    setIsProcessing(id);
    try {
      await deleteDoc(doc(db, "sku_progress", id));
      alert("Pengajuan dihapus.");
    } catch (error) {
      alert("Gagal menolak.");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = req.status === filter;
    const name = req.nama_anggota || ""; 
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-indigo-900 animate-pulse uppercase text-[10px] tracking-widest">
        Sinkronisasi Antrean...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-indigo-900 pt-12 pb-20 px-8 rounded-b-[3.5rem] text-white relative shadow-xl">
        <div className="flex items-center gap-5 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
          >
            <HiOutlineChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Verifikasi SKU</h1>
            <p className="text-[9px] text-indigo-200 font-bold uppercase tracking-[0.2em] mt-2">Panel Pengujian</p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER TAB */}
      <div className="px-6 -mt-10 space-y-4 relative z-20">
        <div className="bg-white rounded-[2rem] p-2 shadow-xl border border-slate-100 flex items-center group focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
          <HiOutlineSearch className="w-5 h-5 ml-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari nama anggota..." 
            className="w-full bg-transparent p-4 text-xs font-bold outline-none italic text-slate-700" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter("pending")} 
            className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === "pending" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
          >
            <HiOutlineClock className="w-3.5 h-3.5" /> Antrean
          </button>
          <button 
            onClick={() => setFilter("verified")} 
            className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === "verified" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
          >
            <HiOutlineBadgeCheck className="w-3.5 h-3.5" /> Riwayat
          </button>
        </div>
      </div>

      {/* LIST PENGUJUAN */}
      <div className="px-6 mt-6 space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-[3rem] py-20 text-center border border-dashed border-slate-200 opacity-40">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Belum ada data</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 transition-all hover:shadow-md animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-900 text-sm shadow-inner uppercase">
                    {(req.nama_anggota || "A").substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-slate-800 italic">{req.nama_anggota || "Tanpa Nama"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                        {req.tingkat}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Poin {req.nomor_poin}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic">
                <p className="text-[10px] text-slate-600 font-bold leading-relaxed">"{req.deskripsi_poin}"</p>
              </div>

              {req.status === "pending" ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleReject(req.id, req.nama_anggota)} 
                    className="p-4 bg-red-50 text-red-500 rounded-2xl transition-all active:scale-90"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleVerify(req)} 
                    disabled={isProcessing === req.id}
                    className="flex-1 bg-indigo-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-indigo-900/20 active:scale-95 transition-all italic"
                  >
                    {isProcessing === req.id ? "PROSES..." : "LULUSKAN POIN"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center gap-1">
                   <div className="flex items-center gap-2">
                      <HiOutlineBadgeCheck className="w-4 h-4 text-green-600" />
                      <p className="text-[9px] font-black text-green-600 uppercase italic">Terverifikasi</p>
                   </div>
                   <p className="text-[7px] text-green-400 uppercase font-black tracking-widest">Oleh: {req.verifikator_nama}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}