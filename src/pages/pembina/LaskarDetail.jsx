import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";
import { 
  HiOutlineChevronLeft, HiOutlineShieldCheck, 
  HiOutlineLightningBolt, HiOutlineAcademicCap,
  HiOutlinePhoneIncoming, HiOutlineHeart,
  HiOutlineChatAlt2, HiOutlineUserRemove
} from "react-icons/hi";

export default function LaskarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [skuStats, setSkuStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        // 1. Fetch Profil User
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ id: userDoc.id, ...userData });

          // 2. Fetch Progres SKU untuk Grafik
          // Kita asumsikan ada koleksi 'sku_progress' yang mencatat poin yang sudah diverifikasi
          const skuQuery = query(
            collection(db, "sku_progress"),
            where("uid", "==", id),
            where("status", "==", "verified")
          );
          
          const skuSnap = await getDocs(skuQuery);
          
          // Pengolahan data untuk Radar (Kategori Kepramukaan)
          const categories = {
            Spiritual: 0,
            Emosional: 0,
            Sosial: 0,
            Intelektual: 0,
            Fisik: 0
          };

          skuSnap.forEach((doc) => {
            const data = doc.data();
            if (categories[data.kategori] !== undefined) {
              categories[data.kategori] += 1;
            }
          });

          const chartData = Object.keys(categories).map(key => ({
            subject: key,
            A: categories[key],
            fullMark: 10 // Asumsi maksimal 10 poin per kategori
          }));

          setSkuStats(chartData);
        }
      } catch (error) {
        console.error("Error fetching dossier:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-[10px] font-black uppercase text-white tracking-[0.4em]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-4" />
      Accessing Dossier...
    </div>
  );

  if (!user) return <div className="p-10 text-white uppercase font-black text-center">User Not Found</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 font-sans italic selection:bg-blue-800">
      <div className="max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 relative">
        
        {/* HEADER & PROFILE OVERLAY */}
        <div className="relative pt-12 pb-10 px-8 border-b border-white/5 bg-gradient-to-b from-blue-600/10 to-transparent">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-8 active:scale-90 hover:bg-white/10 transition-all">
            <HiOutlineChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-slate-800 rounded-[2rem] border-2 border-blue-500/30 flex items-center justify-center text-3xl font-black text-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.2)] uppercase relative overflow-hidden">
               <span className="relative z-10">{user.nama?.substring(0, 1)}</span>
               <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{user.nama}</h1>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mt-3">{user.tingkat || "Laskar Bahari"}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                  <HiOutlineLightningBolt className="text-amber-400" size={14} />
                  <span className="text-[11px] font-black text-blue-100">{user.points || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTEL ANALYTICS SECTION - REAL RADAR */}
        <div className="px-8 mt-10">
          <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <HiOutlineAcademicCap className="text-blue-500" /> Skill Achievement Matrix
          </h2>
          
          <div className="w-full h-64 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex items-center justify-center p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skuStats}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: '900' }} />
                <Radar
                  name={user.nama}
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SAFETY & SFH DOSSIER */}
        <div className="px-8 mt-10 space-y-6">
          <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
            <HiOutlineShieldCheck className="text-red-500" /> Safe From Harm Protocol
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all group">
              <HiOutlinePhoneIncoming className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" size={18} />
              <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest leading-none">Emergency Contact</p>
              <p className="text-[11px] font-black mt-2 text-slate-200">{user.emergencyContact || "No Record"}</p>
            </div>
            <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-red-500/20 transition-all group">
              <HiOutlineHeart className="text-red-500 mb-3 group-hover:scale-110 transition-transform" size={18} />
              <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest leading-none">Medical Intelligence</p>
              <p className="text-[11px] font-black mt-2 text-slate-200 leading-tight">{user.medicalInfo || "Normal/Fit"}</p>
            </div>
          </div>
        </div>

        {/* ACTION COMMANDS */}
        <div className="px-8 mt-auto py-10 flex gap-4 relative z-10">
          <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-blue-600/20">
            <HiOutlineChatAlt2 size={16} /> Direct Briefing
          </button>
          <button className="flex-1 bg-white/5 text-red-500 border border-red-500/20 hover:bg-red-500/10 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <HiOutlineUserRemove size={16} /> Restrict Access
          </button>
        </div>

      </div>
    </div>
  );
}