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
  HiOutlineLightningBolt,
  HiOutlineX,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineChartBar
} from "react-icons/hi";
import { MdMilitaryTech, MdVerified } from "react-icons/md";

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // State untuk detail profil
  const navigate = useNavigate();

  const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  useEffect(() => {
    // LOGIKA PERINGKAT: Level tertinggi dahulu, baru XP tertinggi
    const q = query(
      collection(db, "users"),
      where("role", "==", "anggota"), 
      orderBy("level", "desc"), // Urutan 1: Level
      orderBy("points", "desc"), // Urutan 2: XP
      limit(10),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setTopUsers(users);
      setLoading(false);
    }, (err) => {
      console.error("Leaderboard Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper Komponen untuk Fallback Avatar
  const UserAvatar = ({ user, sizeClass = "w-16 h-16", textClass = "text-xl" }) => {
    const [imgError, setImgError] = useState(false);
    const hasPhoto = user?.photoURL && !imgError;

    return (
      <div className={`${sizeClass} rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative bg-slate-800 flex items-center justify-center flex-shrink-0`}>
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

  // Komponen Kartu Podium (Top 3)
  const PodiumCard = ({ user, medalIcon, rankLabel, isWinner, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.6 }}
      onClick={() => user && setSelectedUser(user)} // Klik untuk lihat detail
      className={`flex flex-col items-center p-4 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-3xl transition-all duration-500 cursor-pointer ${isWinner ? 'bg-gradient-to-b from-yellow-500/20 to-transparent scale-110 z-30 -translate-y-6' : 'bg-slate-900/60 scale-95 hover:bg-slate-800'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative ${isWinner ? 'bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'bg-white/5'}`}>
        <img src={medalIcon} className={`${isWinner ? "w-9 h-9" : "w-7 h-7"} drop-shadow-lg`} alt={rankLabel} />
      </div>
      
      <UserAvatar user={user} sizeClass={isWinner ? "w-16 h-16" : "w-12 h-12"} textClass="text-sm" />

      <h3 className="font-black text-white text-[9px] uppercase text-center truncate w-full px-1 italic mt-3">
        {user?.nama?.split(" ")[0] || "---"}
      </h3>
      
      {/* Tampilan LVL + XP */}
      <div className="text-center mt-1">
        <p className={`font-black ${isWinner ? 'text-yellow-500' : 'text-blue-400'} italic text-[10px] leading-none`}>
          LVL {user?.level || 1}
        </p>
        <p className="text-slate-500 font-bold text-[7px] uppercase mt-0.5">{user?.points || 0} XP</p>
      </div>

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
            <p className="text-red-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Level & XP Synchronization</p>
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
          </div>

          <div className="space-y-3">
            {topUsers.slice(3).map((user, index) => (
              <motion.div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="flex items-center justify-between p-4 rounded-[2rem] bg-slate-900/40 backdrop-blur-md border border-white/5 group hover:border-red-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-slate-500 italic group-hover:bg-red-600 group-hover:text-white">
                    #{index + 4}
                  </div>
                  <UserAvatar user={user} sizeClass="w-10 h-10" textClass="text-[10px]" />
                  <div>
                    <h3 className="font-black text-slate-200 text-[11px] uppercase tracking-tight">{user.nama}</h3>
                    <p className="text-[8px] text-slate-600 font-black uppercase">LVL {user.level || 1} • {user.points || 0} XP</p>
                  </div>
                </div>
                <HiOutlineBadgeCheck className="text-emerald-500 opacity-40 group-hover:opacity-100" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* MODAL DETAIL PROFILE */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedUser(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative w-full max-w-sm bg-[#020617] border border-white/10 rounded-[3rem] overflow-hidden shadow-3xl italic"
              >
                {/* Header Modal */}
                <div className="h-24 bg-gradient-to-r from-red-900 to-slate-900 relative">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="absolute top-6 right-6 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <HiOutlineX />
                  </button>
                </div>

                <div className="px-8 pb-10 -mt-12 flex flex-col items-center">
                  <UserAvatar user={selectedUser} sizeClass="w-24 h-24" textClass="text-2xl" />
                  <h2 className="mt-4 text-xl font-black text-white uppercase tracking-tighter text-center leading-none">
                    {selectedUser.nama}
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-600 rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                      LVL {selectedUser.level || 1}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-400">
                      {selectedUser.tingkat || "PENGGALANG"}
                    </span>
                  </div>

                  {/* Statistik Grid */}
                  <div className="grid grid-cols-2 gap-3 w-full mt-8">
                    <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 text-center">
                       <HiOutlineChartBar className="mx-auto text-blue-500 mb-1" />
                       <p className="text-[7px] font-black text-slate-500 uppercase">Power Points</p>
                       <p className="text-xs font-black text-white">{selectedUser.points} XP</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 text-center">
                       <HiOutlineBadgeCheck className="mx-auto text-emerald-500 mb-1" />
                       <p className="text-[7px] font-black text-slate-500 uppercase">Role Status</p>
                       <p className="text-xs font-black text-white uppercase">{selectedUser.jabatan || "Guardian"}</p>
                    </div>
                  </div>

                  {/* Achievements/Badges */}
                  <div className="w-full mt-6">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                      <MdMilitaryTech size={14} className="text-yellow-500" /> Achievement Badges
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.claimedBadges ? (
                        Object.keys(selectedUser.claimedBadges).slice(0, 4).map((badge, i) => (
                          <div key={i} className="px-3 py-2 bg-slate-900 rounded-xl border border-white/5 flex items-center gap-2">
                            <MdVerified className="text-yellow-500" size={10} />
                            <span className="text-[7px] font-black text-slate-300 uppercase">{badge}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8px] text-slate-600 uppercase ml-2 italic">No badges earned yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="px-8 py-12 text-center border-t border-white/5 mt-auto bg-slate-950/50">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose italic">
            Developed by <span className="text-red-600">Fiqri Haikal</span> — NAVIGASI APP v1.2<br />
            © 2026 — SMPN 1 Biau
          </p>
        </footer>
      </div>
      <style jsx>{`.shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); }`}</style>
    </motion.div>
  );
}