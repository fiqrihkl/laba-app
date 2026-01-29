import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineChevronLeft, HiOutlineUserGroup, HiOutlinePencilAlt, HiOutlineSave } from "react-icons/hi";

export default function StrukturOrganisasi() {
  const [struktur, setStruktur] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isEditing, setIsEditing] = useState(null); 
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

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

    const unsub = onSnapshot(
      doc(db, "settings", "struktur_organisasi"),
      (snap) => {
        if (snap.exists()) {
          setStruktur(snap.data());
        }
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const handleUpdate = async (key) => {
    try {
      const docRef = doc(db, "settings", "struktur_organisasi");
      await updateDoc(docRef, {
        [`${key}.nama`]: newName,
      });
      setIsEditing(null);
      setNewName("");
    } catch (error) {
      alert("Gagal memperbarui data.");
    }
  };

  const NodeCard = ({ title, data, id }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center z-10"
    >
      <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl w-48 flex flex-col items-center relative group hover:border-red-500/50 transition-all duration-500">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl mb-3 flex items-center justify-center border border-white/5 shadow-inner">
          <img
            src="https://cdn-icons-png.flaticon.com/128/1077/1077063.png"
            className="w-7 h-7 opacity-20 grayscale brightness-200"
            alt="icon"
          />
        </div>
        
        <p className="text-[8px] font-black uppercase text-red-500 tracking-[0.2em] mb-2 text-center leading-tight">
          {title}
        </p>

        {isEditing === id ? (
          <div className="flex flex-col gap-2 w-full">
            <input
              autoFocus
              className="bg-white/5 rounded-xl px-2 py-1 text-[10px] font-bold text-white border border-red-500/30 outline-none text-center"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              onClick={() => handleUpdate(id)}
              className="flex items-center justify-center gap-1 text-[8px] font-black uppercase bg-red-600 text-white py-2 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <HiOutlineSave size={12} /> Update
            </button>
          </div>
        ) : (
          <h3 className="text-[11px] font-black uppercase text-slate-100 text-center leading-tight italic tracking-tight">
            {data?.nama || "Vacant"}
          </h3>
        )}

        {userRole === "admin" && isEditing !== id && (
          <button
            onClick={() => {
              setIsEditing(id);
              setNewName(data?.nama || "");
            }}
            className="absolute -top-2 -right-2 bg-white text-slate-950 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110"
          >
            <HiOutlinePencilAlt size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center font-black text-red-600 animate-pulse text-xs uppercase tracking-[0.4em] italic">
          Syncing Hierarchy...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center pb-32 font-sans selection:bg-red-800 overflow-x-hidden">
      {/* HEADER */}
      <div className="w-full max-w-md bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] pt-12 pb-24 px-8 rounded-b-[4rem] relative overflow-hidden shadow-3xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <div className="flex justify-between items-center relative z-10 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition"
          >
            <HiOutlineChevronLeft size={24} className="text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-white italic">
              Organization
            </h1>
            <p className="text-[8px] font-bold text-red-400 uppercase mt-1 tracking-widest">
              Command Structure
            </p>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="flex flex-col items-center relative z-10">
          <HiOutlineUserGroup size={48} className="text-white opacity-20 mb-4" />
          <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-white text-center">
            The Legend Fleet <br /> <span className="text-red-600 text-sm">Gudep 10.491-10.492</span>
          </h2>
        </div>
      </div>

      {/* bagan flow */}
      <div className="w-full overflow-x-auto pb-20 mt-[-60px] relative z-20 scrollbar-hide">
        <div className="min-w-[700px] flex flex-col items-center pt-10">
          
          {/* LEVEL 1: KAMABIGUS */}
          <NodeCard
            title="Kamabigus"
            data={struktur.kamabigus}
            id="kamabigus"
          />

          {/* Vertical Line */}
          <div className="h-12 w-[2px] bg-gradient-to-b from-red-600 to-slate-700"></div>

          {/* LEVEL 2: PEMBINA */}
          <div className="relative flex flex-col items-center">
            {/* Horizontal Line */}
            <div className="absolute top-0 w-[400px] h-[2px] bg-slate-700"></div>

            <div className="flex gap-40 relative">
              <div className="absolute top-0 left-0 h-6 w-[2px] bg-slate-700"></div>
              <div className="absolute top-0 right-0 h-6 w-[2px] bg-slate-700"></div>

              <NodeCard
                title="Pembina Satuan (PA)"
                data={struktur.pembina_pa}
                id="pembina_pa"
              />
              <NodeCard
                title="Pembina Satuan (PI)"
                data={struktur.pembina_pi}
                id="pembina_pi"
              />
            </div>
          </div>

          <div className="h-12 w-[2px] bg-slate-700"></div>

          {/* LEVEL 3: PRATAMA */}
          <div className="relative flex flex-col items-center">
            <div className="absolute top-0 w-[400px] h-[2px] bg-slate-700"></div>
            <div className="flex gap-40 relative">
              <div className="absolute top-0 left-0 h-6 w-[2px] bg-slate-700"></div>
              <div className="absolute top-0 right-0 h-6 w-[2px] bg-slate-700"></div>

              <NodeCard
                title="Pratama Putra"
                data={struktur.pratama_pa}
                id="pratama_pa"
              />
              <NodeCard
                title="Pratama Putri"
                data={struktur.pratama_pi}
                id="pratama_pi"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-auto px-8 py-12 text-center max-w-xs border-t border-white/5 w-full bg-slate-950/50">
        <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-[0.2em] italic">
          Bagan ini terenkripsi dan disinkronkan secara real-time dengan pangkalan data Gudep SMPN 1 Biau.
        </p>
        <p className="text-[8px] text-slate-700 font-black mt-4 uppercase tracking-widest">
           © 2026 — Laskar Bahari Radar
        </p>
      </div>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}