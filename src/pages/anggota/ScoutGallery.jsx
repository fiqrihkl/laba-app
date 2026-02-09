import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineX, 
  HiOutlineLockClosed,
  HiOutlineLocationMarker,
  HiOutlineBadgeCheck,
  HiOutlineLightningBolt,
  HiOutlineFire,
  HiOutlineArrowNarrowUp
} from "react-icons/hi";

const ScoutGallery = ({ userLevel = 1, userData, onClose }) => {
  const [selectedPos, setSelectedPos] = useState(null);
  const [activeSlang, setActiveSlang] = useState({ lvl: null, text: "" });
  const gender = userData?.jenisKelamin || "Laki-laki";
  const folder = gender === "Perempuan" ? "putri" : "putra";
  const scrollRef = useRef(null);

  // Data perjalanan dengan narasi motivasi & instruksi (Gen-Z Style)
  const scoutItems = [
    { lvl: 30, x: 50, y: 150, name: "Legendary Scout", slang: "FIX NO DEBAT! Kamu sepuh Laskar Bahari paling disegani! 👑🔥", desc: "Misi Selesai! Kamu adalah legenda hidup. Tetaplah menjadi teladan bagi anggota lain!", task: "Level Maksimal Tercapai!" },
    { lvl: 20, x: 75, y: 350, name: "Hero Stage", slang: "Gokil! Auranya udah beda banget, makin berwibawa abangkuh! ⚡😎", desc: "Lencana ini bukti kamu bukan anggota biasa. Sedikit lagi menuju puncak!", task: "Push terus XP-mu lewat misi broadcast untuk jadi Legenda!" },
    { lvl: 15, x: 25, y: 550, name: "Explorer Stage", slang: "Gas pol! Hutan Biau udah kayak halaman rumah sendiri ya? 🌲🏃", desc: "Perlengkapan lengkap, mental baja. Kamu siap menjelajah medan terberat!", task: "Ayo selesaikan SKU Terap agar atributmu makin lengkap!" },
    { lvl: 10, x: 70, y: 750, name: "Official Stage", slang: "Cakep! Baretnya bikin tingkat kece naik 1000%! ✨", desc: "Identitas resmi sudah terpasang. Kamu sekarang pilar penting di pasukan!", task: "Cek Log Notifikasi, ambil setiap kesempatan XP yang ada!" },
    { lvl: 5, x: 30, y: 950, name: "Pathfinder Stage", slang: "Slay banget hasduknya! Vibes penggalang sejati emang beda. 🧣💅", desc: "Hasduk ini suci, jagalah kehormatannya selama penjelajahan!", task: "Lengkapi poin SKU Rakitmu agar bisa upgrade baret resmi!" },
    { lvl: 2, x: 65, y: 1150, name: "Navigator Stage", slang: "Menyala abangkuh! Jangan sampe kesasar di hutan ya! 🧭🔥", desc: "Kompas sudah di tangan, arah masa depan mulai terlihat jelas.", task: "Absen setiap hari & kumpulkan XP harian bersamaku!" },
    { lvl: 1, x: 45, y: 1350, name: "New Recruit", slang: "Semangat ya! Perjalanan seru kita baru dimulai! 🌱🐣", desc: "Seragam masih polos, tapi semangatmu harus membara!", task: "Push terus XP-mu agar bisa terus lanjut menjelajah bersamaku!" },
  ];

  // Logic Hitung Progress Path agar pas di titik level saat ini
  const calculatePathLength = () => {
    const reversedItems = [...scoutItems].reverse();
    const currentIndex = reversedItems.findLastIndex(item => userLevel >= item.lvl);
    if (currentIndex <= 0) return 0;
    return currentIndex / (scoutItems.length - 1);
  };

  // Auto-scroll ke posisi user saat ini
  useEffect(() => {
    const currentItem = scoutItems.find(item => item.lvl <= userLevel) || scoutItems[scoutItems.length-1];
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: currentItem.y - 300,
        behavior: "smooth"
      });
    }
  }, [userLevel]);

  // Fungsi menggambar jalur melengkung (Cubic Bezier)
  const generatePath = () => {
    let d = `M ${scoutItems[scoutItems.length - 1].x} ${scoutItems[scoutItems.length - 1].y}`;
    for (let i = scoutItems.length - 2; i >= 0; i--) {
      const prev = scoutItems[i + 1];
      const curr = scoutItems[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const handlePointClick = (item) => {
    setSelectedPos(item);
    setActiveSlang({ lvl: item.lvl, text: item.slang });
  };

  const currentPath = generatePath();
  const progressPercent = calculatePathLength();

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-[#020617] flex flex-col font-sans italic overflow-hidden"
    >
      {/* HEADER TACTICAL */}
      <div className="absolute top-0 left-0 w-full z-[2020] p-6 flex justify-between items-center bg-gradient-to-b from-[#020617] via-[#020617]/80 to-transparent backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineFire className="text-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Expedition Radar</span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tighter italic">Scout Journey Map</h2>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-2xl transition-all">
          <HiOutlineX size={24}/>
        </button>
      </div>

      {/* MAP VIEWPORT */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative scrollbar-hide">
        
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/topography.png')] bg-fixed" />
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />

        <div className="relative w-full min-h-[1600px] flex justify-center">
          
          {/* SVG PATH CONNECTOR DENGAN PARTIKEL */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 1600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            
            <path d={currentPath} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeLinecap="round" />
            
            <motion.path 
              id="activePath"
              d={currentPath} fill="none" stroke="url(#pathGrad)" strokeWidth="1.2" filter="url(#glow)"
              initial={{ pathLength: 0 }} 
              animate={{ pathLength: progressPercent }} 
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />

            {/* PARTIKEL CAHAYA MENGALIR (Hanya tampil jika ada progress) */}
            {progressPercent > 0 && (
              <>
                <circle r="0.8" fill="#facc15" filter="url(#glow)">
                  <animateMotion 
                    dur="3s" 
                    repeatCount="indefinite" 
                    path={currentPath}
                    keyPoints={`0;${progressPercent}`}
                    keyTimes="0;1"
                  />
                </circle>
                <circle r="0.5" fill="#ffffff" opacity="0.8">
                  <animateMotion 
                    dur="5s" 
                    begin="1s"
                    repeatCount="indefinite" 
                    path={currentPath}
                    keyPoints={`0;${progressPercent}`}
                    keyTimes="0;1"
                  />
                </circle>
              </>
            )}
          </svg>

          {/* WAYPOINTS */}
          {scoutItems.map((item, index) => {
            const isUnlocked = userLevel >= item.lvl;
            const isCurrent = userLevel === item.lvl;

            return (
              <div 
                key={item.lvl} 
                className="absolute"
                style={{ left: `${item.x}%`, top: `${item.y}px`, transform: "translate(-50%, -50%)" }}
              >
                <AnimatePresence>
                  {(activeSlang.lvl === item.lvl || (isCurrent && activeSlang.lvl === null)) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: -90, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute z-[2030] w-40 bg-white p-3 rounded-2xl rounded-bl-none shadow-2xl border-2 border-red-600 pointer-events-none"
                    >
                      <p className="text-[10px] font-black text-slate-800 leading-tight">
                        {item.slang}
                      </p>
                      <div className="absolute -bottom-2 left-0 w-3 h-3 bg-white border-r-2 border-b-2 border-red-600 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative group">
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    whileTap={isUnlocked ? { scale: 0.9 } : {}}
                    onClick={() => isUnlocked && handlePointClick(item)}
                    className={`relative w-16 h-16 md:w-22 md:h-22 rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-700 cursor-pointer ${
                      isUnlocked 
                      ? 'bg-slate-900 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.4)]' 
                      : 'bg-[#020617] border-white/5 opacity-40 grayscale blur-[1px]'
                    } ${isUnlocked ? `animate-float-${index % 3}` : ''}`}
                  >
                    {isUnlocked ? (
                      <img 
                        src={`/assets/avatars/${folder}/lvl${item.lvl}.png`} 
                        className={`w-[85%] h-[85%] object-contain ${isCurrent ? 'brightness-125' : 'opacity-70'}`} 
                        alt="Avatar" 
                      />
                    ) : (
                      <HiOutlineLockClosed className="text-white/20 w-6 h-6" />
                    )}

                    <div className={`absolute -bottom-2 bg-slate-900 border-2 px-3 py-0.5 rounded-full z-30 ${isUnlocked ? 'border-red-500 text-red-500' : 'border-white/10 text-white/10'}`}>
                      <span className="text-[8px] font-black uppercase">Lv.{item.lvl}</span>
                    </div>

                    {isCurrent && (
                      <div className="absolute inset-0 rounded-[2.2rem] border-4 border-yellow-400 animate-ping opacity-30"></div>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER INFO TACTICAL HUD */}
      <div className="p-8 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent border-t border-white/5 z-[2020]">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adventure Progress</span>
            </div>
            <span className="text-[10px] font-black text-white">{Math.round((userLevel/30)*100)}% COMPLETE</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
            <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${(userLevel/30)*100}%` }} 
                className="h-full bg-gradient-to-r from-red-600 to-yellow-400"
            />
        </div>
        <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 flex items-start gap-4">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 shrink-0">
            <HiOutlineLightningBolt size={24} />
          </div>
          <p className="text-[10px] font-bold text-slate-300 leading-relaxed italic">
            "Push terus XP-mu agar bisa terus lanjut menjelajah bersamaku dan membuka atribut legendaris Laskar Bahari!"
          </p>
        </div>
      </div>

      {/* MODAL DETAIL */}
      <AnimatePresence>
        {selectedPos && (
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 w-full z-[2060] bg-slate-900/95 backdrop-blur-3xl rounded-t-[4rem] border-t-2 border-red-600/30 p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] flex flex-col items-center"
          >
            <div className="w-16 h-1.5 bg-white/10 rounded-full mb-8" />
            <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-40 h-40 mb-6 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            >
              <img src={`/assets/avatars/${folder}/lvl${selectedPos.lvl}.png`} className="w-full h-full object-contain" alt="Large" />
            </motion.div>
            
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 text-center leading-none">{selectedPos.name}</h3>
            
            <div className="flex items-center gap-2 text-yellow-500 mb-4 bg-yellow-500/10 px-4 py-1 rounded-full border border-yellow-500/20">
                <HiOutlineLightningBolt size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Next Target: {selectedPos.task}</span>
            </div>

            <p className="text-sm font-bold text-slate-400 text-center max-w-xs mb-8 italic">"{selectedPos.desc}"</p>
            
            <button 
              onClick={() => setSelectedPos(null)}
              className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Lanjut Mendaki <HiOutlineArrowNarrowUp size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        @keyframes float-0 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        
        .animate-float-0 { animation: float-0 4s ease-in-out infinite; }
        .animate-float-1 { animation: float-1 5s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4.5s ease-in-out infinite; }
      `}</style>
    </motion.div>
  );
};

export default ScoutGallery;