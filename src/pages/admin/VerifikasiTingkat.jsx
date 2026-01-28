import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function VerifikasiTingkat() {
  const [activeTab, setActiveTab] = useState("pending"); // pending atau history
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMessage("");

    let q;
    try {
      if (activeTab === "pending") {
        // Query untuk data baru
        q = query(
          collection(db, "pengajuan_tingkat"),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
        );
      } else {
        // Query untuk riwayat (approved & rejected)
        q = query(
          collection(db, "pengajuan_tingkat"),
          where("status", "in", ["approved", "rejected"]),
          orderBy("processedAt", "desc")
        );
      }

      // Memulai Listener Realtime
      const unsubscribe = onSnapshot(q, 
        (snap) => {
          const data = [];
          snap.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setRequests(data);
          setLoading(false);
        }, 
        (error) => {
          console.error("Firestore Error:", error);
          setErrorMessage("Gagal memuat data. Pastikan Index Firestore sudah dibuat.");
          setLoading(false);
        }
      );

      // Membersihkan listener saat tab berubah atau komponen unmount
      return () => unsubscribe();
      
    } catch (err) {
      console.error("Query Error:", err);
      setLoading(false);
    }
  }, [activeTab]);

  const handleAction = async (req, action) => {
    let alasan = "";
    
    if (action === "rejected") {
      alasan = window.prompt("Masukkan alasan penolakan:");
      if (alasan === null) return; 
      if (!alasan.trim()) return alert("Alasan penolakan wajib diisi!");
    } else {
      if (!window.confirm(`Setujui kenaikan tingkat ${req.nama} ke ${req.tingkat_tujuan}?`)) return;
    }

    try {
      const requestRef = doc(db, "pengajuan_tingkat", req.id);
      
      // 1. Update Dokumen Pengajuan
      await updateDoc(requestRef, { 
        status: action,
        alasan_penolakan: alasan || "",
        processedAt: new Date().toISOString(),
        processedBy: "Admin/Pembina" 
      });

      // 2. Jika disetujui, update field 'tingkat' di profil user permanen
      if (action === "approved") {
        const userRef = doc(db, "users", req.uid);
        await updateDoc(userRef, { tingkat: req.tingkat_tujuan });
      }

      alert(action === "approved" ? "Pengajuan telah disetujui!" : "Pengajuan telah ditolak.");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 pt-10 pb-16 px-8 rounded-b-[4rem] relative text-white shadow-xl">
          <div className="flex justify-between items-center relative z-10 mb-8">
            <div className="flex items-center gap-5">
              <Link to="/admin" className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 active:scale-95 transition">
                <img src="https://cdn-icons-png.flaticon.com/128/271/271220.png" className="w-4 h-4 invert" alt="back" />
              </Link>
              <div>
                <h1 className="text-xs font-black uppercase opacity-70 tracking-widest">Rank Verification</h1>
                <p className="text-blue-300 text-[10px] font-bold uppercase mt-1">Gudep 10.491-10.492</p>
              </div>
            </div>
          </div>

          {/* TAB SYSTEM */}
          <div className="flex bg-black/20 p-1 rounded-2xl relative z-10">
            <button 
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'pending' ? 'bg-white text-blue-900 shadow-lg' : 'text-white/50'}`}>
              Menunggu
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-white text-blue-900 shadow-lg' : 'text-white/50'}`}>
              Riwayat
            </button>
          </div>
        </div>

        {/* LIST AREA */}
        <div className="flex-1 px-8 mt-10">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 italic">
            {activeTab === 'pending' ? 'Permintaan Masuk' : 'Log Aktivitas'} ({requests.length})
          </h2>

          {errorMessage && (
            <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase text-center border border-red-100">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6 pb-20">
            {loading ? (
              <div className="py-20 text-center animate-pulse uppercase text-xs font-black text-blue-900">Syncing Cloud Data...</div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Data Kosong</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between gap-6 group hover:shadow-md transition-all">
                  <div className="flex gap-6 flex-1">
                    {/* Preview Sertifikat */}
                    <div 
                      onClick={() => setSelectedImg(req.bukti_url)}
                      className="w-24 h-32 flex-shrink-0 bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-50 cursor-zoom-in relative shadow-inner">
                      <img src={req.bukti_url} className="w-full h-full object-cover" alt="sertifikat" />
                      <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <img src="https://cdn-icons-png.flaticon.com/128/709/709612.png" className="w-5 h-5 invert" alt="v" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-slate-800 text-sm uppercase italic truncate">{req.nama}</h3>
                        {activeTab === 'history' && (
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {req.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic">
                          Dari: <span className="text-slate-600">{req.tingkat_asal}</span>
                        </p>
                        <p className="text-[10px] font-black text-blue-900 uppercase italic">
                          Ke: <span className="bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{req.tingkat_tujuan}</span>
                        </p>
                        
                        {activeTab === 'history' && req.status === 'rejected' && (
                          <div className="mt-2 p-3 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[8px] font-black text-red-400 uppercase mb-1">Alasan Penolakan:</p>
                            <p className="text-[10px] text-red-700 font-bold leading-tight">"{req.alasan_penolakan}"</p>
                          </div>
                        )}

                        <p className="text-[8px] text-slate-300 mt-2 font-bold uppercase tracking-widest">
                          {activeTab === 'pending' ? 'Diajukan' : 'Diproses'}: {req.processedAt ? new Date(req.processedAt).toLocaleDateString('id-ID') : req.createdAt?.toDate().toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="flex md:flex-col justify-end gap-3 flex-shrink-0">
                      <button 
                        onClick={() => handleAction(req, "approved")}
                        className="bg-green-500 text-white text-[9px] font-black px-8 py-3.5 rounded-2xl uppercase shadow-lg shadow-green-500/30 active:scale-95 transition flex items-center justify-center gap-2">
                        Setujui
                      </button>
                      <button 
                        onClick={() => handleAction(req, "rejected")}
                        className="bg-white text-red-500 text-[9px] font-black px-8 py-3.5 rounded-2xl uppercase border-2 border-red-50 active:scale-95 transition flex items-center justify-center gap-2">
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* LIGHTBOX */}
        {selectedImg && (
          <div 
            className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300"
            onClick={() => setSelectedImg(null)}>
            <div className="relative max-w-2xl w-full">
              <img src={selectedImg} className="w-full h-auto rounded-[3rem] shadow-2xl border-4 border-white/10" alt="full" />
              <p className="text-center mt-6 text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Klik untuk kembali</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}