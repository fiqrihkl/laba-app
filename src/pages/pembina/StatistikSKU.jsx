import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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
    "Belum Ada Tingkat": 0 // Mengganti label Laskar
  });
  const [totalAnggota, setTotalAnggota] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "anggota"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Inisialisasi ulang penghitung
      const counts = { Ramu: 0, Rakit: 0, Terap: 0, "Belum Ada Tingkat": 0 };
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Logika: Jika field 'tingkat' kosong, null, atau berisi "Laskar", masukkan ke "Belum Ada Tingkat"
        const tingkat = (data.tingkat && data.tingkat !== "Laskar") ? data.tingkat : "Belum Ada Tingkat";
        
        if (counts.hasOwnProperty(tingkat)) {
          counts[tingkat]++;
        } else {
          // Fallback jika ada data tingkat di luar kategori utama
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-widest">
        Mengkalkulasi Data...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-blue-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl">
        <div className="flex items-center gap-5 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
          >
            <HiOutlineChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Statistik SKU</h1>
            <p className="text-[9px] text-blue-200 font-bold uppercase tracking-[0.3em]">Capaian Tingkatan Anggota</p>
          </div>
        </div>
      </div>

      {/* RINGKASAN TOTAL */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <HiOutlineUserGroup className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase">Total Populasi</p>
              <p className="text-xl font-black text-slate-800">{totalAnggota} Anggota</p>
            </div>
          </div>
          <HiOutlineTrendingUp className="w-8 h-8 text-green-500 opacity-20" />
        </div>
      </div>

      {/* DETAIL PER TINGKAT */}
      <div className="px-6 mt-8 space-y-4">
        <h2 className="px-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Sebaran Tingkatan</h2>
        
        {Object.entries(tingkatStats).map(([label, count]) => (
          <div key={label} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  label === 'Ramu' ? 'bg-green-500' : 
                  label === 'Rakit' ? 'bg-blue-500' : 
                  label === 'Terap' ? 'bg-red-500' : 'bg-slate-300'
                }`} />
                <span className="text-xs font-black uppercase text-slate-700 tracking-tight">
                  {label === "Belum Ada Tingkat" ? label : `Tingkat ${label}`}
                </span>
              </div>
              <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-3 py-1 rounded-full">
                {count} Jiwa
              </span>
            </div>
            
            {/* Progress Bar Visual */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  label === 'Ramu' ? 'bg-green-500' : 
                  label === 'Rakit' ? 'bg-blue-500' : 
                  label === 'Terap' ? 'bg-red-500' : 'bg-slate-400'
                }`}
                style={{ width: `${calculatePercentage(count)}%` }}
              />
            </div>
            <p className="text-[8px] text-right mt-2 text-slate-400 font-bold uppercase">
              {calculatePercentage(count)}% Dari Total Anggota
            </p>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="mt-10 px-10 text-center opacity-30">
        <HiOutlineChartPie className="w-10 h-10 mx-auto mb-2 text-slate-400" />
        <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed">
          Data diperbarui secara real-time <br /> berdasarkan status verifikasi tingkat
        </p>
      </div>
    </div>
  );
}