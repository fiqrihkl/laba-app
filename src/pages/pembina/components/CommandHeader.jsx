import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineBell, HiOutlineStatusOnline } from "react-icons/hi";

const CommandHeader = ({ pembinaData, presentCount, alertsCount, unreadCount }) => {
  return (
    <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e1b4b] to-[#020617] px-8 pt-12 pb-20 relative overflow-visible rounded-b-[3.5rem] shadow-3xl z-[100]">
      {/* BACKGROUND TEXTURE */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-b-[3.5rem]" />
      
      <div className="flex justify-between items-start relative z-110">
        {/* PROFIL PEMBINA */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-slate-800 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              {pembinaData?.photoURL ? (
                <img src={pembinaData.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-black text-xl uppercase rounded-xl">
                  {pembinaData?.nama ? pembinaData.nama.substring(0, 1) : "K"}
                </div>
              )}
            </div>
            <div className="absolute -top-2 -left-2 bg-blue-500 text-[8px] font-black px-2 py-0.5 rounded-md uppercase border border-[#1e3a8a]">Captain</div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-white drop-shadow-lg">
              {pembinaData?.nama?.split(" ")[0] || "Komandan"}
            </h1>
            <p className="text-[9px] font-black text-blue-400 uppercase mt-2 tracking-widest flex items-center gap-1.5 leading-none">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span> Command Active
            </p>
          </div>
        </div>

        {/* NOTIFIKASI REALTIME (MENGGANTIKAN TOTAL LASKAR) */}
        <Link to="/pembina/notifications" className="relative group">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col items-center min-w-[60px] shadow-2xl transition-all group-active:scale-90">
            <div className="relative">
              <HiOutlineBell className="text-blue-400 w-6 h-6 mb-1" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-[#1e1b4b]"></span>
                </span>
              )}
            </div>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Notif</span>
          </div>
        </Link>
      </div>

      {/* NAVI INTEL ORB STYLE (LAPORAN ANGGOTA AKTIF) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="mt-8 bg-blue-600/10 border border-blue-500/20 backdrop-blur-md p-4 rounded-[2rem] flex items-center gap-4 relative z-10"
      >
        <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full blur-md animate-pulse absolute opacity-50" />
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full flex items-center justify-center relative border border-white/20">
                <HiOutlineStatusOnline size={20} className="text-white animate-spin-slow" />
            </div>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-blue-100 font-bold leading-tight italic">
            "Laporan hari ini: <span className="text-emerald-400">{presentCount} anggota aktif</span> di aplikasi. {alertsCount > 0 ? `Siaga, ada ${alertsCount} sinyal SOS!` : 'Situasi terpantau hijau.'}"
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandHeader; 