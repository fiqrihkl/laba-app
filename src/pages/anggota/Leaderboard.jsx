import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where, // TAMBAHKAN INI
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineChevronLeft, HiOutlineFire, HiOutlineBadgeCheck } from "react-icons/hi";

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
    // MODIFIKASI KUERI: Hanya ambil user dengan role 'anggota'
    const q = query(
      collection(db, "users"),
      where("role", "==", "anggota"), // FILTER HANYA ANGGOTA
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

  // Komponen Kartu Podium Premium
  const PodiumCard = ({
    user,
    colorClass,
    shadowClass,
    medalIcon,
    rankLabel,
    isWinner,
    delay
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.6 }}
      className={`flex flex-col items-center p-5 rounded-[3rem] bg-white border border-slate-100 shadow-2xl ${shadowClass} transition-all duration-500`}>
      <div
        className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-inner relative ${colorClass}`}>
        <img
          src={medalIcon}
          className={`${isWinner ? "w-12 h-12" : "w-10 h-10"} drop-shadow-md`}
          alt={rankLabel}
        />
        {isWinner && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            <HiOutlineBadgeCheck className="text-white w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <h3 className="font-black text-slate-800 text-[10px] uppercase text-center leading-none truncate w-full px-1 italic">
        {user?.nama?.split(" ")[0] || "---"}
      </h3>
      <p
        className={`font-black text-blue-900 ${isWinner ? "text-lg" : "text-sm"} mt-2 tracking-tighter italic`}>
        {user?.points || 0}
        <span className="text-[8px] ml-0.5 uppercase tracking-normal">XP</span>
      </p>
      <div className="mt-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
        <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest text-center">
          {rankLabel}
        </span>
      </div>
    </motion.div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-widest">
        Mengkalkulasi Peringkat Laskar...
      </div>
    </div>
  );

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic"
    >
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl overflow-hidden italic relative border-x border-slate-100">
        
        {/* SECTION: HEADER PREMIUM HALL OF FAME */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 pt-12 pb-24 px-8 rounded-b-[4.5rem] relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition">
              <HiOutlineChevronLeft size={20} className="text-white" />
            </button>
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-70">
              Legend Board
            </h1>
            <div className="w-11"></div>
          </div>

          <div className="text-center relative z-10">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="relative inline-block mb-4"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/128/3112/3112946.png"
                className="w-20 h-20 mx-auto drop-shadow-[0_10px_30px_rgba(255,215,0,0.4)]"
                alt="Trophy"
              />
            </motion.div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
              The Legend Hall
            </h2>
            <div className="flex items-center justify-center gap-2 mt-3 opacity-90">
                <HiOutlineFire className="text-orange-400 animate-pulse" />
                <p className="text-blue-300 text-[10px] font-black tracking-[0.3em] uppercase italic">
                    Top 10 Guardians
                </p>
            </div>
          </div>
        </div>

        {/* SECTION: TOP 3 PODIUM */}
        <div className="px-6 -mt-16 relative z-20 grid grid-cols-3 gap-4 items-end">
          <PodiumCard
            user={topUsers[1]}
            medalIcon="https://cdn-icons-png.flaticon.com/128/2583/2583319.png"
            colorClass="bg-slate-50 border border-slate-200"
            shadowClass="scale-95"
            rankLabel="2nd PLACE"
            delay={0.2}
          />
          <PodiumCard
            user={topUsers[0]}
            medalIcon="https://cdn-icons-png.flaticon.com/128/2583/2583344.png"
            colorClass="bg-yellow-50 border border-yellow-200 ring-4 ring-yellow-400/10"
            shadowClass="scale-110 -translate-y-6 shadow-yellow-900/10 z-30"
            rankLabel="CHAMPION"
            isWinner={true}
            delay={0}
          />
          <PodiumCard
            user={topUsers[2]}
            medalIcon="https://cdn-icons-png.flaticon.com/128/2583/2583434.png"
            colorClass="bg-orange-50 border border-orange-100"
            shadowClass="scale-95"
            rankLabel="3rd PLACE"
            delay={0.4}
          />
        </div>

        {/* SECTION: LIST VIEW RANK 4-10 */}
        <div className="flex-1 px-8 mt-14 space-y-4">
          <div className="flex justify-between items-end px-2 mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
              Elite Fleet Rankings
            </h3>
            <img
              src="https://cdn-icons-png.flaticon.com/128/1063/1063376.png"
              className="w-5 h-5 opacity-20"
              alt="rank"
            />
          </div>

          <div className="space-y-4 pb-10">
            {topUsers.slice(3).map((user, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                key={user.id}
                className="flex items-center justify-between p-5 rounded-[2.5rem] bg-white border border-slate-100 group hover:border-blue-900/30 hover:shadow-xl transition-all duration-500 shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-sm text-blue-900 shadow-inner group-hover:bg-blue-900 group-hover:text-white transition-all duration-500 italic">
                    #{index + 4}
                  </div>

                  <div>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-none group-hover:text-blue-900 transition-colors">
                      {user.nama}
                    </h3>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-2 opacity-80 group-hover:text-blue-600 transition-colors leading-none italic">
                        {user.jabatan || "Anggota Laskar"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-1 text-blue-900">
                    <HiOutlineFire className="text-orange-500" />
                    <p className="font-black text-sm tracking-tighter italic">
                        {user.points || 0} XP
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <HiOutlineBadgeCheck className="w-3 h-3 text-blue-600" />
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Verified</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto bg-slate-50/50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600 font-black">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>
    </motion.div>
  );
}