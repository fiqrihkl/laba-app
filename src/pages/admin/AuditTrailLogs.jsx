import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineChevronLeft, 
  HiOutlineShieldCheck, 
  HiOutlineSearch,
  HiOutlineDatabase,
  HiOutlineBadgeCheck,
  HiOutlineSpeakerphone,
  HiOutlineTrendingUp
} from "react-icons/hi";

export default function AuditTrailLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");

  useEffect(() => {
    // Mengambil 50 aktivitas terbaru dari database
    const q = query(
      collection(db, "logs"),
      orderBy("timestamp", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const logData = [];
      snap.forEach((doc) => logData.push({ id: doc.id, ...doc.data() }));
      setLogs(logData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatFullDate = (timestamp) => {
    if (!timestamp) return "---";
    const d = timestamp.toDate();
    return (
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  // Logika Filter Kategori
  const filteredLogs = logs.filter(log => {
    if (filter === "Semua") return true;
    if (filter === "XP") return log.action?.includes("XP");
    if (filter === "SKU") return log.action?.includes("SKU");
    if (filter === "Tingkat") return log.action?.includes("Tingkat") || log.action?.includes("Jabatan");
    if (filter === "Info") return log.action?.includes("Pengumuman") || log.action?.includes("Informasi");
    return true;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-slate-400 animate-pulse uppercase text-[10px] tracking-widest">
        Mengakses Enkripsi Log...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-slate-100">
        
        {/* SECTION: PREMIUM HEADER */}
        <div className="bg-slate-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl">
          <div className="flex items-center gap-5 relative z-10">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter">Security Logs</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Audit Trail v3.4</p>
            </div>
          </div>
        </div>

        {/* SECTION: FILTER TAB */}
        <div className="px-6 -mt-8 relative z-20">
          <div className="bg-white p-2 rounded-[2rem] shadow-lg border border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
            {["Semua", "XP", "SKU", "Tingkat", "Info"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-5 py-2 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${
                  filter === item 
                  ? "bg-slate-900 text-white shadow-md" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: LOG FEED */}
        <div className="flex-1 px-6 mt-8">
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Activity Feed</h2>
            </div>
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
              {filteredLogs.length} Entri Ditampilkan
            </p>
          </div>

          <div className="space-y-4 pb-12">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <HiOutlineDatabase className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase">Tidak ada log kategori {filter}</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        log.action?.includes("XP") ? "bg-green-50 text-green-600" :
                        log.action?.includes("SKU") ? "bg-blue-50 text-blue-600" :
                        log.action?.includes("Info") ? "bg-purple-50 text-purple-600" : "bg-slate-50 text-slate-600"
                      }`}>
                        {log.action?.includes("XP") && <HiOutlineTrendingUp className="w-5 h-5" />}
                        {log.action?.includes("SKU") && <HiOutlineBadgeCheck className="w-5 h-5" />}
                        {log.action?.includes("Info") && <HiOutlineSpeakerphone className="w-5 h-5" />}
                        {!log.action?.includes("XP") && !log.action?.includes("SKU") && !log.action?.includes("Info") && <HiOutlineShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-tight leading-none">{log.action}</h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic">{formatFullDate(log.timestamp)}</p>
                      </div>
                    </div>
                    <span className="text-[7px] bg-slate-100 text-slate-400 px-2 py-1 rounded-lg font-black uppercase tracking-widest">Secure</span>
                  </div>

                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      <span className="font-black text-blue-900 uppercase">"{log.adminName}"</span> 
                      {" "}memproses tindakan untuk{" "}
                      <span className="font-black text-slate-800 uppercase">"{log.targetName}"</span>
                    </p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {log.amount && (
                        <span className={`text-[8px] font-black px-2 py-1 rounded-md ${log.amount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          VALUE: {log.amount > 0 ? "+" : ""}{log.amount} XP
                        </span>
                      )}
                      <span className="text-[8px] font-black px-2 py-1 rounded-md bg-white border border-slate-100 text-slate-400">
                        {log.reason || "System Update"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="p-8 text-center bg-slate-50 border-t border-slate-100">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em]">Laskar Bahari Security Monitor</p>
        </footer>
      </div>
    </div>
  );
}