import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineSearch, 
  HiOutlineSpeakerphone, 
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiX
} from "react-icons/hi";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInfo, setSelectedInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubUser = onSnapshot(userRef, (d) => {
        if (d.exists()) setUserData(d.data());
      });

      const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
      );
      const unsubAnnounce = onSnapshot(q, (snap) => {
        setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => {
        unsubUser();
        unsubAnnounce();
      };
    }
  }, []);

  const handleOpenDetail = (info) => {
    setSelectedInfo(info);
    handleClaimXP(info.id, info.title);
  };

  const handleClaimXP = async (id, title) => {
    const user = auth.currentUser;
    if (!user || !userData) return;

    if (!userData.claimedXP?.includes(id)) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          points: increment(50),
          claimedXP: arrayUnion(id),
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: `Membaca: ${title}`,
            pointsEarned: 50,
          }),
        });
      } catch (err) {
        console.error("Gagal klaim:", err);
      }
    }
  };

  const filteredData = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <HiOutlineSpeakerphone size={40} className="text-red-600 opacity-50" />
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans selection:bg-red-800 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-white/5 bg-[#020617]">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] pt-12 pb-24 px-8 rounded-b-[4rem] relative overflow-hidden shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex items-center justify-between relative z-10 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition">
              <HiOutlineChevronLeft size={20} className="text-white" />
            </button>
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-50 italic">Archive Radar</h1>
            <div className="w-10"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">
              Pusat <br /> <span className="text-red-600">Notifikasi</span>
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-1 w-12 bg-red-600 rounded-full" />
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                Gudep 10.491-10.492 SMPN 1 Biau
              </p>
            </div>
          </div>
          
          <HiOutlineSpeakerphone className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.03] rotate-12" />
        </div>

        {/* SEARCH BOX */}
        <div className="px-6 -mt-10 relative z-20">
          <div className="bg-slate-900/60 backdrop-blur-3xl rounded-3xl p-2 border border-white/10 flex items-center group shadow-2xl">
            <div className="w-10 h-10 flex items-center justify-center opacity-30 group-focus-within:opacity-100 transition-opacity">
              <HiOutlineSearch size={18} className="text-red-500" />
            </div>
            <input
              type="text"
              placeholder="Search briefing archive..."
              className="flex-1 bg-transparent border-none p-3 text-xs font-bold outline-none italic text-white placeholder:text-slate-600"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* CONTENT LIST */}
        <div className="px-6 mt-10 space-y-6 pb-10 flex-1 overflow-y-auto scrollbar-hide">
          {filteredData.length === 0 ? (
            <div className="py-20 text-center">
              <HiOutlineSpeakerphone size={60} className="mx-auto mb-4 text-slate-800 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">
                Sinyal informasi tidak ditemukan
              </p>
            </div>
          ) : (
            filteredData.map((info, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={info.id}
                onClick={() => handleOpenDetail(info)}
                className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2.5rem] hover:border-red-500/30 transition-all duration-500 group active:scale-95 cursor-pointer relative overflow-hidden shadow-xl">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="text-red-600 w-3 h-3" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {info.date || "Terbaru"}
                    </span>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {userData?.claimedXP?.includes(info.id) ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <HiOutlineBadgeCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-500 uppercase">Archive Read</span>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-red-600 px-3 py-1 rounded-full shadow-lg shadow-red-600/20 animate-pulse">
                        <span className="text-[7px] font-black text-white uppercase tracking-tighter">
                          +50 XP RADAR
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <h3 className="font-black text-sm text-slate-200 uppercase tracking-tight italic group-hover:text-red-500 transition-colors leading-tight mb-3">
                  {info.title}
                </h3>

                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                  {info.content}
                </p>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-600 group-hover:tracking-[0.3em] transition-all">
                    Expand Briefing
                  </span>
                  <div className="w-8 h-[1px] bg-red-600/30 group-hover:w-12 transition-all"></div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* MODAL DETAIL */}
        <AnimatePresence>
          {selectedInfo && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={() => setSelectedInfo(null)} />

              <motion.div 
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                className="bg-slate-900 w-full max-w-sm rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative z-[1110] border border-white/10 overflow-hidden">
                
                <div className="bg-gradient-to-br from-red-600 to-red-900 p-10 relative overflow-hidden">
                  <button
                    onClick={() => setSelectedInfo(null)}
                    className="absolute top-6 right-6 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-white active:scale-90 transition hover:bg-black/40">
                    <HiX size={20} />
                  </button>
                  
                  <span className="text-[9px] bg-black/30 text-white px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] border border-white/10">
                    Mission Intelligence
                  </span>
                  <h3 className="mt-6 text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                    {selectedInfo.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 opacity-60">
                    <HiOutlineClock className="text-white w-3 h-3" />
                    <p className="text-[9px] text-white font-bold uppercase tracking-widest">
                      Broadcasted: {selectedInfo.date}
                    </p>
                  </div>
                </div>

                <div className="p-10 max-h-[45vh] overflow-y-auto custom-scroll bg-[#020617]/50">
                  <p className="text-[12px] text-slate-300 font-bold leading-relaxed italic whitespace-pre-wrap">
                    {selectedInfo.content}
                  </p>
                </div>

                <div className="p-8 bg-slate-900 border-t border-white/5">
                  <button
                    onClick={() => setSelectedInfo(null)}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all italic">
                    Roger That!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <div className="px-8 py-12 text-center border-t border-white/5 mt-auto bg-slate-950/50">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose italic">
            Developed by <span className="text-red-600 font-black">Fiqri Haikal</span> — NAVIGASI APP v1.2<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); }
      `}</style>
    </div>
  );
}