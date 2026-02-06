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
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineShieldCheck, 
  HiOutlineUserCircle,
  HiOutlineLightningBolt,
  HiOutlinePencilAlt,
  HiOutlineFingerPrint
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border transition-all duration-300 ${
        color === "blue" 
          ? "bg-blue-600/5 border-blue-500/20" 
          : color === "pink" 
          ? "bg-red-500/5 border-red-500/20" 
          : "bg-slate-900/50 border-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </label>
        {canEdit && <HiOutlinePencilAlt size={10} className="text-blue-500 opacity-50" />}
      </div>

      <input
        disabled={!canEdit}
        className={`w-full bg-transparent font-bold text-xs uppercase outline-none transition-all ${
          canEdit 
            ? "text-white focus:text-blue-400 border-b border-white/5 focus:border-blue-500/50 pb-1" 
            : "text-slate-300"
        }`}
        value={pejabat[id]?.nama || ""}
        placeholder="Nama Pejabat..."
        onChange={(e) => handleUpdate(id, e.target.value)}
      />
    </motion.div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans uppercase text-[10px] tracking-widest">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
        Synchronizing Hierarchy...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER AREA */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
            >
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest">Struktur Organisasi</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Laskar Bahari Hierarchy</p>
            </div>
          </div>
          <HiOutlineFingerPrint size={22} className="text-slate-700" />
        </header>

        {/* CONTENT LIST */}
        <div className="p-6 space-y-8">
          
          {/* TOP TIER */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <HiOutlineShieldCheck className="text-amber-500" size={16} />
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Supreme Command
              </h2>
            </div>
            <LeaderCard label="Kamabigus" id="kamabigus" color="default" />
          </section>

          {/* UNIT SPLIT */}
          <div className="space-y-8 pt-4 border-t border-white/5">
            {/* SATUAN PUTRA */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <HiOutlineLightningBolt className="text-blue-500" size={16} />
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Satuan Putra (Alpha)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <LeaderCard label="Pembina Putra" id="pembina_pa" color="blue" />
                <LeaderCard label="Pratama Putra" id="pratama_pa" color="blue" />
                <div className="grid grid-cols-2 gap-3">
                  <LeaderCard label="Sekretaris PA" id="sekretaris_pa" color="blue" />
                  <LeaderCard label="Bendahara PA" id="bendahara_pa" color="blue" />
                </div>
              </div>
            </section>

            {/* SATUAN PUTRI */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <HiOutlineLightningBolt className="text-red-500" size={16} />
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Satuan Putri (Beta)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <LeaderCard label="Pembina Putri" id="pembina_pi" color="pink" />
                <LeaderCard label="Pratama Putri" id="pratama_pi" color="pink" />
                <div className="grid grid-cols-2 gap-3">
                  <LeaderCard label="Sekretaris PI" id="sekretaris_pi" color="pink" />
                  <LeaderCard label="Bendahara PI" id="bendahara_pi" color="pink" />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-auto py-8 text-center border-t border-white/5 bg-slate-900/10">
          <div className="px-6">
            {canEdit ? (
              <div className="flex items-center justify-center gap-2 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                  Admin Control Mode • Auto-Sync
                </p>
              </div>
            ) : (
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.3em]">
                Data Terenkripsi • Read Only Access
              </p>
            )}
            <p className="text-[8px] text-slate-800 font-bold mt-6 uppercase tracking-widest">
              © 2026 — Laskar Bahari Management
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}