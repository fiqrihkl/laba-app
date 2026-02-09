import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineSpeakerphone, HiOutlineBadgeCheck, HiLightningBolt } from "react-icons/hi";

const MissionBrief = ({ announcements, userData, onClaimXP }) => {
  return (
    <div className="mt-12 relative z-20">
      <div className="px-10 flex justify-between items-center mb-6">
        <h2 className="text-[11px] font-black uppercase text-slate-500 italic tracking-[0.3em]">Papan Informasi</h2>
        <Link to="/announcements" className="text-[10px] font-black text-red-600 uppercase border-b border-red-600/30 pb-0.5 cursor-pointer hover:text-red-400 transition-colors">
          Lihat Semua
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-6 px-6 pb-6 scrollbar-hide">
        {announcements.map((info) => (
          <motion.div 
            key={info.id} 
            whileTap={{ scale: 0.97 }} 
            onClick={() => onClaimXP(info)} 
            className="min-w-[300px] h-48 bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-8 relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/5 shadow-2xl"
          >
            <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:rotate-12 transition-all duration-700">
              <HiOutlineSpeakerphone size={160} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
                  {info.category || "Mission"}
                </span>
                {userData?.claimedXP?.includes(info.id) && <HiOutlineBadgeCheck size={24} className="text-green-500" />}
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight uppercase italic text-white line-clamp-2 mb-3 group-hover:text-red-500 transition-colors">
                  {info.title}
                </h3>
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <HiLightningBolt size={14} />
                  <span className="text-[10px] font-black uppercase">
                    {userData?.claimedXP?.includes(info.id) ? "XP Claimed" : "Claim +50 XP"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MissionBrief;