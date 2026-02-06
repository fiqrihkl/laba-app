import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  HiOutlineChevronLeft, 
  HiOutlineChartPie, 
  HiOutlineUserGroup, 
  HiOutlineTrendingUp 
} from "react-icons/hi";

export default function StatistikSKU() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tingkatStats, setTingkatStats] = useState({
    Ramu: 0,
    Rakit: 0,
    Terap: 0,
    "Belum Ada Tingkat": 0 
  });
  const [totalAnggota, setTotalAnggota] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "anggota"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = { Ramu: 0, Rakit: 0, Terap: 0, "Belum Ada Tingkat": 0 };
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const tingkat = (data.tingkat && data.tingkat !== "Laskar") ? data.tingkat : "Belum Ada Tingkat";
        
        if (counts.hasOwnProperty(tingkat)) {
          counts[tingkat]++;
        } else {
          counts["Belum Ada Tingkat"]++;
        }
      });

      setTingkatStats(counts);
      setTotalAnggota(snapshot.size);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculatePercentage = (count) => {
    if (totalAnggota === 0) return 0;
    return Math.round((count / totalAnggota) * 100);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] italic">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
      <div className="text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">
        Sinkronisasi Data Intelijen...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900">
      <div className="max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Analisis SKU</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Status Capaian Pasukan</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-lg relative z-10">
            <HiOutlineChartPie className="w-5 h-5 text-blue-500" />
          </div>
        </header>

        {/* RINGKASAN POPULASI */}
        <div className="p-6 -mt-8 relative z-20">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between overflow-hidden relative"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-blue-600/20 rounded-[1.5rem] flex items-center justify-center border border-blue-500/20">
                <HiOutlineUserGroup size={28} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Populasi Laskar</p>
                <p className="text-2xl font-black text-white tracking-tighter">{totalAnggota} Anggota</p>
              </div>
            </div>
            <HiOutlineTrendingUp size={48} className="text-emerald-500 opacity-10 absolute -right-2 -bottom-2" />
          </motion.div>
        </div>

        {/* DETAIL PER TINGKAT */}
        <main className="flex-1 px-6 mt-4 space-y-4 pb-10 overflow-y-auto custom-scroll">
          <h2 className="px-1 font-black text-[10px] text-slate-500 uppercase tracking-[0.3em] italic mb-2">Sebaran Tingkatan Unit</h2>
          
          {Object.entries(tingkatStats).map(([label, count], index) => (
            <motion.div 
              key={label}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 border border-white/5 p-5 rounded-[2rem] hover:border-blue-500/30 transition-all shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                    label === 'Ramu' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                    label === 'Rakit' ? 'bg-blue-500 shadow-blue-500/20' : 
                    label === 'Terap' ? 'bg-red-500 shadow-red-500/20' : 'bg-slate-600'
                  }`} />
                  <span className="text-[10px] font-black uppercase text-slate-200 tracking-wider">
                    {label === "Belum Ada Tingkat" ? label : `Tingkat ${label}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg">
                    {count} Jiwa
                  </span>
                </div>
              </div>
              
              {/* PROGRESS METER */}
              <div className="relative w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 p-[2px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatePercentage(count)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    label === 'Ramu' ? 'bg-emerald-500' : 
                    label === 'Rakit' ? 'bg-blue-500' : 
                    label === 'Terap' ? 'bg-red-500' : 'bg-slate-600'
                  }`}
                />
              </div>

              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-[7px] text-slate-600 font-black uppercase tracking-tighter">Status Operasional</span>
                <span className="text-[9px] text-slate-400 font-black italic uppercase">
                  {calculatePercentage(count)}% Kapasitas Unit
                </span>
              </div>
            </motion.div>
          ))}
        </main>

        <footer className="mt-auto p-8 text-center border-t border-white/5 bg-slate-900/10">
          <HiOutlineChartPie className="w-8 h-8 mx-auto mb-3 text-slate-700" />
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.5em] leading-relaxed italic">
            Radar Navigasi Terhubung <br /> Sinkronisasi Real-Time v4.2
          </p>
        </footer>
      </div>
    </div>
  );
}