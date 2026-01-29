import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineX, 
  HiOutlineShieldCheck, 
  HiOutlineLockClosed,
  HiOutlineInformationCircle,
  HiOutlineFire
} from "react-icons/hi";

const ScoutGallery = ({ userLevel = 1, userData, onClose }) => {
  const gender = userData?.jenisKelamin || "Putra";

  // Konfigurasi data item berdasarkan level yang kamu tentukan
  const scoutItems = [
    { lvl: 1, name: "Seragam Polos", desc: "Awal perjalananmu sebagai pengembara Laskar Bahari." },
    { lvl: 2, name: "Kompas Navigasi", desc: "Alat penunjuk arah untuk misi pencarian atribut selanjutnya." },
    { lvl: 5, name: "Setangan Leher", desc: "Hasduk suci hasil pencarian di hutan Biau." },
    { lvl: 10, name: "Tutup Kepala", desc: "Baret/Topi Boni tangguh penanda identitas resmi." },
    { lvl: 15, name: "Carrier & Tongkat", desc: "Perlengkapan mendaki untuk menjelajah medan berat." },
    { lvl: 20, name: "Lencana Kehormatan", desc: "Simbol keberanian yang tersemat di bajumu." },
    { lvl: 30, name: "Panji Kemenangan", desc: "Atribut lengkap dengan Bendera Regu yang berkibar." },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-[#020617]/95 backdrop-blur-xl flex flex-col"
    >
      {/* --- HEADER --- */}
      <div className="p-8 flex justify-between items-center border-b border-white/5">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white leading-none">Scout Gallery</h2>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mt-2">Koleksi Atribut Temuan</p>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/50 hover:text-white transition-all"
        >
          <HiOutlineX size={24} />
        </button>
      </div>

      {/* --- STATS BAR --- */}
      <div className="px-8 py-6 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center text-red-500">
            <HiOutlineShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Total Progress</p>
            <p className="text-sm font-black text-white">{scoutItems.filter(i => userLevel >= i.lvl).length} / {scoutItems.length} Atribut</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">Rank Saat Ini</p>
          <p className="text-sm font-black text-yellow-500 uppercase italic">Lv.{userLevel} Scout</p>
        </div>
      </div>

      {/* --- ITEM GRID --- */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 custom-scroll">
        {scoutItems.map((item, idx) => {
          const isUnlocked = userLevel >= item.lvl;
          const folder = gender === "Putri" ? "putri" : "putra";

          return (
            <motion.div 
              key={idx}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              className={`relative rounded-[2rem] p-5 border transition-all ${
                isUnlocked 
                ? "bg-slate-900 border-red-900/30 shadow-xl" 
                : "bg-black/40 border-white/5 grayscale"
              }`}
            >
              {/* Status Lock */}
              {!isUnlocked && (
                <div className="absolute top-4 right-4 text-white/20">
                  <HiOutlineLockClosed size={18} />
                </div>
              )}

              {/* Image Container */}
              <div className="aspect-square w-full flex items-center justify-center mb-4 relative">
                <img 
                  src={`/assets/avatars/${folder}/lvl${item.lvl}.png`} 
                  alt={item.name}
                  className={`w-full h-full object-contain ${!isUnlocked ? "opacity-20 contrast-0" : "drop-shadow-2xl"}`}
                />
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white/40 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">Lv. {item.lvl}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className={`text-[11px] font-black uppercase italic ${isUnlocked ? "text-white" : "text-white/20"}`}>
                {item.name}
              </h3>
              <p className={`text-[9px] mt-1 font-bold leading-relaxed ${isUnlocked ? "text-slate-400" : "text-white/5"}`}>
                {isUnlocked ? item.desc : "Selesaikan misi untuk menemukan atribut ini."}
              </p>

              {/* Badge "NEW" if recently unlocked (Optional logic) */}
              {isUnlocked && userLevel === item.lvl && (
                <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-md animate-bounce shadow-lg">NEW ITEM!</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="p-8 bg-black/40 border-t border-white/5">
        <div className="flex items-start gap-3 bg-red-950/20 p-4 rounded-2xl border border-red-900/20">
          <HiOutlineInformationCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
            "Teruslah kumpulkan XP dengan menyelesaikan Quest SKU dan misi harian. Setiap atribut yang kamu temukan akan memperkuat identitas maskotmu!"
          </p>
        </div>
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </motion.div>
  );
};

export default ScoutGallery;