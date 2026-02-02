import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineFire, 
  HiOutlineBadgeCheck, 
  HiOutlineTrendingUp,
  HiOutlineLightningBolt
} from "react-icons/hi";

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "anggota"), 
      orderBy("points", "desc"),
      limit(10),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setTopUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper Komponen untuk Fallback Avatar
  const UserAvatar = ({ user, sizeClass = "w-16 h-16", textClass = "text-xl" }) => {
    const [imgError, setImgError] = useState(false);
    const hasPhoto = user?.photoURL && !imgError;

    return (
      <div className={`${sizeClass} rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative bg-slate-800 flex items-center justify-center`}>
        {hasPhoto ? (
          <img 
            src={user.photoURL} 
            alt="p" 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center">
            <span className={`${textClass} font-black text-white uppercase italic tracking-tighter`}>
              {user?.nama ? user.nama.substring(0, 2) : "LB"}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Komponen Kartu Podium Premium (Top 3)
  const PodiumCard = ({
    user,
    medalIcon,
    rankLabel,
    isWinner,
    delay
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.6 }}
      className={`flex flex-col items-center p-4 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-3xl transition-all duration-500 ${isWinner ? 'bg-gradient-to-b from-yellow-500/20 to-transparent scale-110 z-30 -translate-y-6' : 'bg-slate-900/60 scale-95'}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative ${isWinner ? 'bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'bg-white/5'}`}>
        <img src={medalIcon} className={`${isWinner ? "w-10 h-10" : "w-8 h-8"} drop-shadow-lg`} alt={rankLabel} />
        {isWinner && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-2 border-[#020617]"
          >
            <HiOutlineBadgeCheck className="text-white w-3.5 h-3.5" />
          </motion.div>
        )}
      </div>
      
      {/* Avatar Podium */}
      <UserAvatar user={user} />

      <h3 className="font-black text-white text-[9px] uppercase text-center truncate w-full px-1 italic mt-3">
        {user?.nama?.split(" ")[0] || "---"}
      </h3>
      <p className={`font-black ${isWinner ? 'text-yellow-500' : 'text-blue-400'} mt-1 italic text-xs`}>
        {user?.points || 0}<span className="text-[7px] ml-0.5">XP</span>
      </p>
      <div className={`mt-2 px-2 py-0.5 rounded-lg border ${isWinner ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-white/5 bg-white/5'}`}>
        <span className={`text-[6px] font-black uppercase tracking-widest ${isWinner ? 'text-yellow-500' : 'text-slate-500'}`}>
          {rankLabel}
        </span>
      </div>
    </motion.div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="text-center font-black text-red-600 animate-pulse uppercase text-[10px] tracking-widest">
        Establishing Radar Connection...
      </div>
    </div>
  );

  return (
    <motion.div initial="initial" animate="animate" variants={pageTransition} className="min-h-screen bg-[#020617] flex justify-center pb-24 text-slate-100 font-sans selection:bg-red-800 italic">
      <div className="w-full max-w-md bg-[#020617] min-h-screen flex flex-col relative shadow-2xl border-x border-white/5">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] pt-12 pb-24 px-8 rounded-b-[4rem] relative overflow-hidden shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10 mb-8">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition">
              <HiOutlineChevronLeft size={20} />
            </button>
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-50 italic">Hall of Guardians</h1>
            <div className="w-10"></div>
          </div>

          <div className="text-center relative z-10">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="relative inline-block mb-4">
              <HiOutlineFire size={60} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
              <HiOutlineLightningBolt size={24} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
            </motion.div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Legend Board</h2>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-90">
              <div className="h-[1px] w-8 bg-red-600"></div>
              <p className="text-red-500 text-[10px] font-black tracking-[0.3em] uppercase italic">Top 10 Guardians</p>
              <div className="h-[1px] w-8 bg-red-600"></div>
            </div>
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        <div className="px-6 -mt-16 relative z-20 grid grid-cols-3 gap-3 items-end">
          <PodiumCard
            user={topUsers[1]}
            medalIcon="https://cdn-icons-png.flaticon.com/128/2583/2583319.png"
            rankLabel="SILVER"
            delay={0.2}
          />
          <PodiumCard
            user={topUsers[0]}
            medalIcon="https://cdn-icons-png.flaticon.com/128/2583/2583344.png"
            rankLabel="CHAMPION"
            isWinner={true}
            delay={0}
          />
          <PodiumCard
            user={topUsers[2]}
            medalIcon="https://cdn-icons-png.flaticon.com/128/2583/2583434.png"
            rankLabel="BRONZE"
            delay={0.4}
          />
        </div>

        {/* LIST RANK 4-10 */}
        <div className="flex-1 px-6 mt-14 space-y-4 pb-10">
          <div className="flex justify-between items-center px-4 mb-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic flex items-center gap-2">
              <HiOutlineTrendingUp className="text-red-600" /> Elite Fleet
            </h3>
            <span className="text-[9px] font-black text-slate-700 uppercase">Radar Active</span>
          </div>

          <div className="space-y-3">
            {topUsers.slice(3).map((user, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                key={user.id}
                className="flex items-center justify-between p-4 rounded-[2rem] bg-slate-900/40 backdrop-blur-md border border-white/5 group hover:border-red-500/30 transition-all duration-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-slate-500 italic group-hover:bg-red-600 group-hover:text-white transition-all">
                    #{index + 4}
                  </div>
                  
                  {/* List Avatar Fallback */}
                  <UserAvatar user={user} sizeClass="w-10 h-10" textClass="text-[10px]" />

                  <div>
                    <h3 className="font-black text-slate-200 text-[11px] uppercase tracking-tight leading-none group-hover:text-white transition-colors">
                      {user.nama}
                    </h3>
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1 italic">
                      {user.jabatan || "Guardian"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-blue-400 group-hover:text-red-500 transition-colors">
                    <p className="font-black text-xs italic tracking-tighter">{user.points || 0} XP</p>
                  </div>
                  <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                    <HiOutlineBadgeCheck size={10} className="text-emerald-500" />
                    <p className="text-[7px] font-black text-slate-500 uppercase">Verified</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-12 text-center border-t border-white/5 mt-auto bg-slate-950/50">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose italic">
            Developed by <span className="text-red-600">Fiqri Haikal</span> — NAVIGASI APP v1.2<br />
            Radar Active • Hall of Fame Edition<br />
            © 2026 — SMPN 1 Biau
          </p>
        </div>
      </div>
      <style jsx>{`.shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); }`}</style>
    </motion.div>
  );
}