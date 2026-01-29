import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineShieldCheck, 
  HiOutlineUserCircle,
  HiOutlineLightningBolt,
  HiOutlinePencilAlt
} from "react-icons/hi";

export default function StrukturOrganisasi() {
  const [pejabat, setPejabat] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const docId = "struktur_organisasi";

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setUserRole(snap.docs[0].data().role);
      }
    };
    checkRole();

    const unsub = onSnapshot(doc(db, "settings", docId), (snap) => {
      if (snap.exists()) setPejabat(snap.data());
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const canEdit = userRole === "admin" || userRole === "pembina";

  const handleUpdate = async (key, value) => {
    try {
      await updateDoc(doc(db, "settings", docId), {
        [`${key}.nama`]: value,
      });
    } catch (error) {
      console.error("Gagal update:", error);
    }
  };

  const LeaderCard = ({ label, id, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-5 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 group ${
        color === "blue" 
          ? "bg-blue-600/5 border-blue-500/20 shadow-lg shadow-blue-900/10" 
          : color === "pink" 
          ? "bg-red-500/5 border-red-500/20 shadow-lg shadow-red-900/10" 
          : "bg-white/5 border-white/10 shadow-2xl"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-1.5 rounded-lg ${color === "blue" ? "bg-blue-500/20 text-blue-400" : color === "pink" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-slate-400"}`}>
          {canEdit ? <HiOutlinePencilAlt size={12} /> : <HiOutlineUserCircle size={14} />}
        </div>
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
          {label}
        </label>
      </div>

      <input
        disabled={!canEdit}
        className={`w-full bg-transparent p-2 font-black text-sm uppercase italic outline-none transition-all ${
          canEdit 
            ? "text-white focus:text-red-500 border-b border-white/5 focus:border-red-500" 
            : "text-slate-200"
        }`}
        value={pejabat[id]?.nama || ""}
        placeholder="Vacant Position..."
        onChange={(e) => handleUpdate(id, e.target.value)}
      />
      
      {canEdit && (
        <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
      )}
    </motion.div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <HiOutlineLightningBolt size={40} className="text-red-600 opacity-50" />
        </motion.div>
        <p className="font-black italic uppercase text-[10px] tracking-[0.4em] mt-8 text-slate-600">Establishing Data Link...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans selection:bg-red-800 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-white/5 bg-[#020617]">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] pt-12 pb-24 px-8 rounded-b-[4rem] relative overflow-hidden shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition">
              <HiOutlineChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-50 italic">Fleet Hierarchy</h1>
            <div className="w-10"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">
              COMMAND <br /> <span className="text-red-600 tracking-widest text-2xl">STRUCTURE</span>
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-1 w-12 bg-red-600 rounded-full" />
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                Gudep 10.491-10.492 SMPN 1 Biau
              </p>
            </div>
          </div>
          
          <HiOutlineShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.03] rotate-12" />
        </div>

        {/* CONTENT LIST */}
        <div className="px-8 -mt-10 space-y-12 relative z-20 pb-10">
          
          {/* TOP TIER */}
          <section>
            <div className="flex items-center gap-2 mb-4 ml-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Supreme Command
              </h2>
            </div>
            <LeaderCard label="Kamabigus" id="kamabigus" color="slate" />
          </section>

          {/* UNIT SPLIT */}
          <div className="space-y-12">
            {/* SATUAN PUTRA */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-6 ml-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                   <HiOutlineLightningBolt size={14} className="text-white" />
                </div>
                <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] italic">
                  Division: Alpha (Putra)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <LeaderCard label="Pembina Putra" id="pembina_pa" color="blue" />
                <LeaderCard label="Pratama Putra" id="pratama_pa" color="blue" />
                <div className="grid grid-cols-2 gap-4">
                  <LeaderCard label="Sekretaris PA" id="sekretaris_pa" color="blue" />
                  <LeaderCard label="Bendahara PA" id="bendahara_pa" color="blue" />
                </div>
              </div>
            </section>

            {/* SATUAN PUTRI */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-6 ml-2">
                <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                   <HiOutlineLightningBolt size={14} className="text-white" />
                </div>
                <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] italic">
                  Division: Beta (Putri)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <LeaderCard label="Pembina Putri" id="pembina_pi" color="pink" />
                <LeaderCard label="Pratama Putri" id="pratama_pi" color="pink" />
                <div className="grid grid-cols-2 gap-4">
                  <LeaderCard label="Sekretaris PI" id="sekretaris_pi" color="pink" />
                  <LeaderCard label="Bendahara PI" id="bendahara_pi" color="pink" />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-auto py-12 text-center border-t border-white/5 bg-slate-950/50">
          <AnimatePresence mode="wait">
            {canEdit ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="inline-flex items-center gap-3 px-6 py-2.5 bg-red-600/10 rounded-full border border-red-600/20"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">
                  Command Override Active • Auto-Sync
                </p>
              </motion.div>
            ) : (
              <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] italic">
                Encrypted Data • Read Only Access
              </p>
            )}
          </AnimatePresence>
          <p className="text-[8px] text-slate-800 font-black mt-8 uppercase tracking-widest">
            © 2026 — Laskar Bahari Management
          </p>
        </footer>
      </div>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}