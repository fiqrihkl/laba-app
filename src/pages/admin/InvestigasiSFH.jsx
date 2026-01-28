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
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function InvestigasiSFH() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread");
  const [replyText, setReplyText] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    // Monitor laporan insiden secara real-time
    const q = query(collection(db, "sfh_reports"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id, newStatus, reply = "") => {
    try {
      const docRef = doc(db, "sfh_reports", id);
      await updateDoc(docRef, {
        status: newStatus,
        adminReply: reply || "",
        updatedAt: serverTimestamp(),
        handledBy: auth.currentUser.displayName || "Admin/Pembina",
      });
      alert("Tanggapan berhasil dikirim.");
      setSelectedId(null);
      setReplyText("");
    } catch (error) {
      alert("Gagal memperbarui laporan.");
    }
  };

  const filteredReports = reports.filter((r) => r.status === filter);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-xs">
        Loading Confidential Data...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl">
        <div className="flex items-center gap-5 relative z-10">
          <Link to="/admin" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <img src="https://cdn-icons-png.flaticon.com/128/271/271220.png" className="w-4 h-4 invert" alt="back" />
          </Link>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Investigasi SFH</h1>
            <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.3em]">Privacy & Safety Control</p>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="px-6 -mt-8 relative z-20 flex gap-2">
        {["unread", "investigating", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-1 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${
              filter === s ? "bg-blue-900 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* LIST REPORTS */}
      <div className="px-6 mt-8 space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-300 italic">Tidak ada laporan {filter}</p>
          </div>
        ) : (
          filteredReports.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-900 text-xs shadow-inner uppercase">
                    {req.isAnonymous ? "?" : (req.reporterName || "A").substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800">
                      {req.isAnonymous ? "PELAPOR ANONIM" : (req.reporterName || "Anggota")}
                    </h3>
                    <p className="text-[8px] text-blue-500 font-black uppercase tracking-widest mt-1">{req.category}</p>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-300 uppercase">
                  {req.createdAt?.toDate().toLocaleDateString("id-ID")}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic">
                <p className="text-[10px] text-slate-600 font-bold leading-relaxed">"{req.description}"</p>
              </div>

              {req.attachment && (
                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                  <img src={req.attachment} alt="bukti" className="w-full h-auto" />
                </div>
              )}

              {/* ACTION AREA */}
              {filter !== "closed" ? (
                <div className="space-y-3">
                  {selectedId === req.id ? (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Tulis instruksi atau balasan ke pelapor..."
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] border-2 border-blue-900/10 outline-none h-24 italic"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedId(null)} className="flex-1 py-3 text-[9px] font-black uppercase text-slate-400">Batal</button>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, "closed", replyText)}
                          className="flex-[2] bg-blue-900 text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-blue-900/20"
                        >
                          Kirim & Selesaikan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(req.id, "investigating")}
                        className="flex-1 bg-amber-50 text-amber-600 py-3 rounded-xl text-[9px] font-black uppercase border border-amber-100"
                      >
                        Investigasi
                      </button>
                      <button 
                        onClick={() => setSelectedId(req.id)}
                        className="flex-1 bg-blue-900 text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg"
                      >
                        Respon
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-1">Balasan Admin:</p>
                  <p className="text-[10px] text-green-700 font-bold italic">"{req.adminReply}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <footer className="mt-auto py-10 text-center">
        <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">Secret & Confidential Panel</p>
      </footer>
    </div>
  );
}