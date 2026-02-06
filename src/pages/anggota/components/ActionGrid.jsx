import React from "react";
import { HiOutlineIdentification, HiOutlineChartBar, HiOutlineUserGroup, HiOutlineBadgeCheck } from "react-icons/hi";

const ActionGrid = ({ onShowKTA, onShowBadges, navigate }) => {
  const actions = [
    { label: 'KTA', icon: <HiOutlineIdentification size={30} />, action: onShowKTA },
    { label: 'Ranking', icon: <HiOutlineChartBar size={30} />, action: () => navigate('/leaderboard') },
    { label: 'Struktur', icon: <HiOutlineUserGroup size={30} />, action: () => navigate('/admin/struktur') },
    { label: 'Lencana', icon: <HiOutlineBadgeCheck size={30} />, action: onShowBadges },
  ];

  return (
    <div className="px-6 -mt-7 relative z-20">
      <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] shadow-3xl border border-white/10 p-4 grid grid-cols-4 gap-2">
        {actions.map((item, idx) => (
          <button 
            key={idx} 
            onClick={item.action} 
            className="flex flex-col items-center py-6 hover:bg-white/5 rounded-[2rem] transition-all group"
          >
            <div className="text-red-600 mb-2 group-hover:scale-110 transition-transform duration-500">
              {item.icon}
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter group-hover:text-white">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionGrid;