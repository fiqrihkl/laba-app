import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineDatabase } from "react-icons/hi";

const OperationGrid = ({ alerts }) => {
  const menu = [
    { to: "/pembina/verifikasi-sku", label: "Verif SKU", icon: <HiOutlineAcademicCap size={24}/>, badge: alerts.sku, color: "blue" },
    { to: "/admin/verifikasi-tingkat", label: "Promosi", icon: <HiOutlineChartBar size={24}/>, badge: alerts.tingkat, color: "indigo" },
    { to: "/kelola-pengguna", label: "Crew", icon: <HiOutlineUserGroup size={24}/>, color: "emerald" },
    { to: "/pembina/riwayat", label: "Logbook", icon: <HiOutlineClipboardList size={24}/>, color: "purple" },
    { to: "/admin/validasi-poin", label: "Valid XP", icon: <HiOutlineDocumentText size={24}/>, color: "yellow" },
    { to: "/pembina/admin-hub", label: "System", icon: <HiOutlineDatabase size={24}/>, color: "slate" },
  ];

  return (
    <div className="px-6 mt-10">
      <h2 className="font-black text-slate-500 uppercase text-[9px] tracking-[0.4em] mb-4 ml-2 italic">Operation Deck</h2>
      <div className="grid grid-cols-3 gap-4">
        {menu.map((item, i) => (
          <Link key={i} to={item.to} className="aspect-square bg-slate-900/50 border border-white/5 rounded-[2.2rem] flex flex-col items-center justify-center shadow-inner active:scale-90 transition-all group relative">
            {item.badge > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-600 w-6 h-6 rounded-full border-2 border-[#020617] text-[10px] font-black flex items-center justify-center animate-bounce">
                {item.badge}
              </div>
            )}
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-blue-400">
              {item.icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OperationGrid;