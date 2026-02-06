import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineShieldCheck, 
  HiOutlineEyeOff, 
  HiOutlineClock,
  HiOutlineChatAlt2,
  HiOutlineChevronDown,
  HiOutlineSearch
} from "react-icons/hi";

export default function InvestigasiSFH() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("unread");

  useEffect(() => {
    const q = query(collection(db, "sfh_reports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const reportRef = doc(db, "sfh_reports", id);
      await updateDoc(reportRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Gagal update status");
    }
  };

  const handleSendReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      const reportRef = doc(db, "sfh_reports", id);
      await updateDoc(reportRef, { 
        adminReply: replyText,
        adminReplyAt: serverTimestamp() 
      });
      setReplyText("");
      alert("Tanggapan berhasil dikirim.");
    } catch (error) {
      alert("Gagal mengirim.");
    }
  };

  // Filter Logic
  const filteredReports = reports.filter(req => {
    return req.status === filter && 
    (req.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     req.category?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-500 uppercase text-[10px] tracking-widest italic font-black">
      <div className="w-8 h-8 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4" />
      Syncing Safety Data...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans selection:bg-blue-900 overflow-x-hidden italic">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER - Sekarang Konsisten Berwarna Biru Gelap */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} className="text-slate-400" />
            </button>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest leading-none">Meja Investigasi</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Safe From Harm Control</p>
            </div>
          </div>
          <HiOutlineShieldCheck size={22} className="text-blue-600" />
        </header>

        {/* TAB FILTER */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-900 border border-white/5 rounded-xl flex items-center px-4 focus-within:border-blue-500/30 transition-all">
            <HiOutlineSearch className="text-slate-600" />
            <input 
              type="text" placeholder="CARI LAPORAN..." 
              className="w-full bg-transparent p-3.5 text-[10px] font-black outline-none text-white placeholder:text-slate-700 uppercase"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 gap-1">
            {['unread', 'investigating', 'action_taken', 'resolved'].map((t) => (
              <button 
                key={t} onClick={() => setFilter(t)}
                className={`flex-1 px-2 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* LIST LAPORAN */}
        <main className="px-6 flex-1 space-y-3 pb-10 overflow-y-auto custom-scroll">
          <AnimatePresence mode="popLayout">
            {filteredReports.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl opacity-40 italic">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Tidak ada data {filter}</p>
              </div>
            ) : (
              filteredReports.map((item) => (
                <motion.div 
                  layout key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-slate-900 border border-white/5 rounded-xl overflow-hidden transition-all ${expandedId === item.id ? 'border-blue-500/30' : ''}`}
                >
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs border border-white/5 ${item.isAnonymous ? 'bg-slate-800 text-slate-600' : 'bg-blue-600/10 text-blue-500'}`}>
                        {item.isAnonymous ? <HiOutlineEyeOff size={18} /> : item.reporterName?.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-200">{item.isAnonymous ? "Laskar Rahasia" : item.reporterName}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{item.category}</p>
                      </div>
                    </div>
                    <HiOutlineChevronDown className={`transition-transform text-slate-600 ${expandedId === item.id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-black/20 border-t border-white/5 p-4 space-y-4">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                           <p className="text-[10px] text-slate-300 font-bold leading-relaxed">"{item.description}"</p>
                           <div className="mt-3 flex items-center gap-2 opacity-30 text-[8px] font-black uppercase">
                              <HiOutlineClock /> {item.createdAt?.toDate()?.toLocaleString('id-ID')}
                           </div>
                        </div>

                        {item.attachment && (
                          <div className="rounded-xl border border-white/5 overflow-hidden">
                             <img src={item.attachment} alt="Evidence" className="w-full h-auto grayscale" />
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                           {['investigating', 'action_taken', 'resolved'].map((st) => (
                             <button 
                               key={st} onClick={() => handleUpdateStatus(item.id, st)}
                               className="py-2.5 bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase transition-all"
                             >
                               {st.split('_')[0]}
                             </button>
                           ))}
                        </div>

                        <div className="space-y-2 pt-2">
                          <textarea 
                            value={replyText} onChange={(e) => setReplyText(e.target.value)}
                            placeholder="BERIKAN TANGGAPAN..."
                            className="w-full p-4 bg-black border border-white/5 rounded-xl text-[10px] font-black text-slate-300 outline-none focus:border-blue-600 h-20 resize-none uppercase"
                          />
                          <button onClick={() => handleSendReply(item.id)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Kirim Balasan</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}