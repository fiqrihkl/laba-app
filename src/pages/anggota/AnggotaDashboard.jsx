import React, { useState, useEffect, useMemo, useRef } from "react";
import { db, auth } from "../../firebase";
import {
  doc, onSnapshot, collection, query, updateDoc, increment, arrayUnion, where, limit, orderBy
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import LengkapiKTA from "../anggota/LengkapiKTA";
import KTAView from "../anggota/KTAView";
import VakiAvatar from "./VakiAvatar"; 

// IMPORT REACT ICONS
import { 
  HiFire, 
  HiLightningBolt, 
  HiOutlineShieldCheck, 
  HiOutlineIdentification, 
  HiOutlineChartBar, 
  HiOutlineUserGroup, 
  HiOutlineSpeakerphone, 
  HiOutlineX, 
  HiOutlineGift, 
  HiOutlineLogout, 
  HiOutlineBadgeCheck,
  HiOutlineTrendingUp,
  HiOutlineArchive,
  HiOutlineStar,
  HiLightningBolt as HiBoltSolid
} from "react-icons/hi";

function AnggotaDashboard() {
  const [isEvolving, setIsEvolving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [skuProgressStats, setSkuProgressStats] = useState({
    ramu: 0, rakit: 0, terap: 0,
    totalRamu: 1, totalRakit: 1, totalTerap: 1
  });
  const [loading, setLoading] = useState(true);
  const [showKTA, setShowKTA] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [selectedAnnounce, setSelectedAnnounce] = useState(null);

  const isInitialized = useRef(false);

  const { showModal } = useModal();
  const navigate = useNavigate();

  const playCollectSound = () => {
    if (!isInitialized.current) return;
    try {
      const audio = new Audio("/sounds/collect.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.log("Audio play blocked");
    }
  };

  const vakiStatus = useMemo(() => {
    const lvl = userData?.level || 1;
    const energy = userData?.energy !== undefined ? userData.energy : 100;

    if (energy < 30) return { stage: "Exhausted Scout", mood: "Aku lelah banget... butuh istirahat, guys." };
    if (lvl < 2) return { stage: "Lost Scout", mood: "Siapa aku? Bantu aku temukan jati diriku!" };
    if (lvl < 5) return { stage: "Pathfinder", mood: "Kompas di tangan! Aku mulai mencium arah Hasdukku." };
    if (lvl < 10) return { stage: "Identified Scout", mood: "Identitas ditemukan! Hasduk ini banggaku." };
    if (lvl < 15) return { stage: "Official Member", mood: "Siap bertugas! Kepalaku terlindungi baret tangguh." };
    if (lvl < 20) return { stage: "Mountain Explorer", mood: "Waktunya mendaki! Tas dan tongkat sudah siap." };
    if (lvl < 30) return { stage: "Decorated Hero", mood: "Lencana ini bukti perjuangan kita!" };
    return { stage: "Legendary Scout", mood: "Misi Selesai! Aku adalah Legenda Laskar Bahari!" };
  }, [userData?.level, userData?.energy]);

  const handleEnergyAndStreak = async (docId, data) => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastLoginStr = data.lastDailyLogin;
    const currentEnergy = data.energy !== undefined ? data.energy : 100;
    let updates = {};

    if (data.energy === undefined) updates.energy = 100;

    if (lastLoginStr !== today) {
      updates.energy = Math.min(100, currentEnergy + 20);
      updates.lastDailyLogin = today;
      updates.points = increment(100);
      const lastLoginDate = new Date(lastLoginStr);
      const now = new Date();
      const diffInHours = Math.abs(now - lastLoginDate) / 36e5;
      updates.streakCount = (diffInHours <= 48) ? (data.streakCount || 0) + 1 : 1;

      updates.attendanceLog = arrayUnion({
        timestamp: new Date().toISOString(),
        activity: "Daily Scout Reward: Energy +20 & XP +100",
        pointsEarned: 100,
        type: "DAILY_BONUS"
      });
      setShowDailyBonus(true);
      if (isInitialized.current) playCollectSound();
    } else {
      const lastLoginDate = new Date(data.lastDailyLogin);
      const now = new Date();
      const diffInHours = Math.abs(now - lastLoginDate) / 36e5;
      if (diffInHours > 24) {
        const energyDrop = Math.floor(diffInHours / 24) * 20;
        updates.energy = Math.max(0, currentEnergy - energyDrop);
      }
    }

    if (Object.keys(updates).length > 0) {
      try { await updateDoc(doc(db, "users", docId), updates); } 
      catch (e) { console.error("Gagal sinkronisasi energi:", e); }
    }
  };

  const checkLevelUp = async (docId, points, currentLevel) => {
    if (points >= 2000) {
      try {
        const nextLevel = currentLevel + 1;
        setIsEvolving(true);
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100, 50, 300]);

        await updateDoc(doc(db, "users", docId), {
          level: nextLevel,
          points: points - 2000, 
          energy: 100,
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: `Evolution Complete: Lv.${nextLevel}!`,
            pointsEarned: 0,
            type: "LEVEL_UP"
          }),
        });

        setTimeout(() => {
          setIsEvolving(false);
          playCollectSound();
          showModal("EVOLUTION COMPLETE! 🎊", `Level ${nextLevel} tercapai!`, "success");
        }, 1500);
      } catch (error) { console.error("Gagal naik level:", error); }
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!isInitialized.current) {
            setUserData({ ...data, docId: docSnap.id });
            handleEnergyAndStreak(docSnap.id, data);
            setTimeout(() => { isInitialized.current = true; }, 1000);
            setLoading(false);
          } else {
            setUserData({ ...data, docId: docSnap.id });
            checkLevelUp(docSnap.id, data.points || 0, data.level || 1);
          }
        }
      });

      const qAnnounce = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
      const unsubAnnounce = onSnapshot(qAnnounce, (snapshot) => {
        setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });

      const unsubMaster = onSnapshot(collection(db, "master_sku"), (snapshot) => {
        const totals = { ramu: 0, rakit: 0, terap: 0 };
        snapshot.docs.forEach(doc => {
          const d = doc.data();
          if (d.tingkat === "Ramu") totals.ramu++;
          if (d.tingkat === "Rakit") totals.rakit++;
          if (d.tingkat === "Terap") totals.terap++;
        });
        setSkuProgressStats(prev => ({ ...prev, totalRamu: totals.ramu || 1, totalRakit: totals.rakit || 1, totalTerap: totals.terap || 1 }));
      });

      const qSku = query(collection(db, "sku_progress"), where("uid", "==", user.uid), where("status", "==", "verified"));
      const unsubSku = onSnapshot(qSku, (snapshot) => {
        const counts = { ramu: 0, rakit: 0, terap: 0 };
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.tingkat === "Ramu") counts.ramu++;
          if (data.tingkat === "Rakit") counts.rakit++;
          if (data.tingkat === "Terap") counts.terap++;
        });
        setSkuProgressStats(prev => ({ ...prev, ...counts }));
      });

      return () => { unsubUser(); unsubAnnounce(); unsubMaster(); unsubSku(); };
    }
  }, []);

  const handleClaimXP = async (announce) => {
    if (!userData || userData.claimedXP?.includes(announce.id)) {
      setSelectedAnnounce(announce);
      return;
    }
    try {
      await updateDoc(doc(db, "users", userData.docId), {
        points: increment(50),
        energy: Math.min(100, (userData.energy || 0) + 5),
        claimedXP: arrayUnion(announce.id),
      });
      playCollectSound();
      showModal("Misi Berhasil!", "50 XP & +5 Energi terkumpul!", "success");
      setSelectedAnnounce(announce);
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <HiLightningBolt size={60} className="text-yellow-400" />
      </motion.div>
      <p className="font-black italic uppercase text-xs tracking-[0.4em] mt-8 text-slate-400">Syncing Scout Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans selection:bg-red-800 overflow-x-hidden italic">
      <div className="w-full max-w-md mx-auto bg-[#020617] min-h-screen flex flex-col relative shadow-2xl border-x border-white/5">
        
        {/* --- HEADER --- */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] px-6 pt-12 pb-32 relative overflow-hidden rounded-b-[4rem] shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-slate-800 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className={`w-full h-full items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-black text-xl tracking-tighter uppercase rounded-xl ${userData?.photoURL ? 'hidden' : 'flex'}`}>
                    {userData?.nama ? userData.nama.substring(0, 2) : "LB"}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg">
                  <HiFire className="text-yellow-400 animate-pulse" /> {userData?.streakCount || 1}
                </div>
                <div className="absolute -top-3 -left-3 bg-yellow-500 text-slate-900 px-2 py-1 rounded-lg text-[10px] font-black shadow-xl border-2 border-[#450a0a]">LV.{userData?.level || 1}</div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none">{userData?.nama?.split(' ')[0] || "Laskar"}</h1>
                <p className="text-[10px] font-black text-red-400 uppercase mt-1 tracking-widest">{vakiStatus.stage}</p>
              </div>
            </div>
            <button onClick={() => auth.signOut()} className="w-10 h-10 bg-white/5 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white transition-all">
              <HiOutlineLogout size={20} />
            </button>
          </div>

          {/* AREA MASKOT & DIALOG (SAMPING KANAN ATAS KEPALA - OFFSET DIPERBARUI) */}
          <div className="mt-12 flex flex-col items-center relative z-10 min-h-[300px]">
            <div className="relative w-64 h-64">
              {/* Gambar Maskot */}
              <VakiAvatar 
                level={userData?.level || 1} 
                userData={userData} 
                isEvolving={isEvolving}
                className="w-full h-full" 
              />
              
              {/* Balon Pesan (Digeser ke Kanan - Offset Right dan Top diatur ulang) */}
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, x: 40, scale: 0.8 }} 
                  animate={{ opacity: 1, x: 0, scale: 1 }} 
                  className={`absolute -top-12 -right-12 backdrop-blur-xl p-4 rounded-[2rem] rounded-bl-none text-[11px] font-black w-40 shadow-2xl border border-white/10 italic leading-relaxed text-center z-20 ${userData?.energy < 30 ? 'bg-red-900/60 text-red-100 border-red-500/30' : 'bg-white/10 text-white'}`}
                >
                  "{vakiStatus.mood}"
                  {/* Ekor Balon kecil ke arah kepala - Posisi digeser agar nyambung */}
                  <div className={`absolute -bottom-1.5 left-4 w-3 h-3 rotate-45 border-r border-b border-white/10 ${userData?.energy < 30 ? 'bg-[#7f1d1d]' : 'bg-[#1e293b]'}`}></div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Skor XP Utama */}
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                {userData?.points || 0}
              </span>
              <div className="flex flex-col text-yellow-400 leading-none">
                <HiLightningBolt size={32} className="animate-pulse" />
                <span className="text-2xl font-black italic">XP</span>
              </div>
            </div>
          </div>

          {/* STATUS ENERGY & RADAR */}
          <div className="mt-10 bg-black/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 relative z-10 shadow-3xl">
            <div className="flex justify-between items-center mb-6 px-2">
               <div className="bg-yellow-500/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-yellow-500/20">
                <HiOutlineStar className="text-yellow-400" />
                <span className="text-[11px] font-black text-yellow-500 uppercase tracking-tighter">LV. {userData?.level || 1}</span>
              </div>
              <button onClick={() => navigate('/anggota/gallery')} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-white/5 shadow-inner">
                <HiOutlineArchive className="text-red-500" />
                <span className="text-[11px] font-black uppercase text-slate-300">Gallery</span>
              </button>
            </div>
            <div className="mb-6 px-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <HiBoltSolid className={userData?.energy < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"} /> Energi Maskot
                </span>
                <span className={`text-[10px] font-black ${userData?.energy < 30 ? 'text-red-500' : 'text-white'}`}>{userData?.energy || 100}%</span>
              </div>
              <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${userData?.energy || 100}%` }} className={`h-full rounded-full transition-colors duration-500 ${userData?.energy < 30 ? "bg-gradient-to-r from-red-600 to-orange-500" : "bg-gradient-to-r from-emerald-600 to-cyan-400"}`} />
              </div>
            </div>
            <div className="flex justify-between items-center mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
              <span className="flex items-center gap-1 text-green-400"><HiOutlineTrendingUp /> Progression</span>
              <span>{2000 - (userData?.points || 0)} XP to Evolusi</span>
            </div>
            <div className="w-full bg-black/60 h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((userData?.points || 0) / 2000) * 100, 100)}%` }} className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full relative">
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* --- GRID ACTIONS --- */}
        <div className="px-6 -mt-10 relative z-20">
          <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] shadow-3xl border border-white/10 p-4 grid grid-cols-3 gap-3">
            {[
                { label: 'KTA', icon: <HiOutlineIdentification size={30} />, action: () => setShowKTA(true) },
                { label: 'Ranking', icon: <HiOutlineChartBar size={30} />, action: () => navigate('/leaderboard') },
                { label: 'Struktur', icon: <HiOutlineUserGroup size={30} />, action: () => navigate('/admin/struktur') }
            ].map((item, idx) => (
                <button key={idx} onClick={item.action} className="flex flex-col items-center py-6 hover:bg-white/5 rounded-[2rem] transition-all group">
                    <div className="text-red-600 mb-2 group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter group-hover:text-white">{item.label}</span>
                </button>
            ))}
          </div>
        </div>

        {/* MISSION BRIEF */}
        <div className="mt-12">
          <div className="px-10 flex justify-between items-center mb-6">
            <h2 className="text-[11px] font-black uppercase text-slate-500 italic tracking-[0.3em]">Mission Brief</h2>
            <Link to="/announcements" className="text-[10px] font-black text-red-600 uppercase border-b border-red-600/30 pb-0.5">Explore All</Link>
          </div>
          <div className="flex overflow-x-auto gap-6 px-6 pb-6 scrollbar-hide">
            {announcements.map((info) => (
              <motion.div key={info.id} whileTap={{ scale: 0.97 }} onClick={() => handleClaimXP(info)} className="min-w-[300px] h-48 bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-8 relative overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/5 shadow-2xl">
                <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:rotate-12 transition-all duration-700"><HiOutlineSpeakerphone size={160} /></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase bg-red-600 px-3 py-1.5 rounded-full shadow-lg">{info.category || "Mission"}</span>
                    {userData?.claimedXP?.includes(info.id) && <HiOutlineBadgeCheck size={24} className="text-green-500" />}
                  </div>
                  <div>
                    <h3 className="font-black text-sm leading-tight uppercase italic text-white line-clamp-2 mb-3 group-hover:text-red-500 transition-colors">{info.title}</h3>
                    <div className="flex items-center gap-1.5 text-yellow-500">
                        <HiLightningBolt size={14} /><span className="text-[10px] font-black uppercase">{userData?.claimedXP?.includes(info.id) ? "XP Claimed" : "Claim +50 XP"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ACHIEVEMENT RADAR */}
        <div className="px-6 mt-6 mb-40">
          <div className="bg-slate-900/40 rounded-[3.5rem] border border-white/5 p-10 shadow-inner text-center">
            <h2 className="text-[11px] font-black uppercase text-slate-500 italic tracking-[0.3em] mb-8">Achievement Radar</h2>
            <div className="space-y-8">
              {[
                  { label: "RAMU", val: skuProgressStats.ramu, total: skuProgressStats.totalRamu, color: "from-blue-600 to-cyan-400" },
                  { label: "RAKIT", val: skuProgressStats.rakit, total: skuProgressStats.totalRakit, color: "from-red-600 to-orange-400" },
                  { label: "TERAP", val: skuProgressStats.terap, total: skuProgressStats.totalTerap, color: "from-yellow-600 to-yellow-300" },
              ].map((sku, i) => (
                  <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">
                          <span>{sku.label} Stage</span>
                          <span className="text-white bg-white/5 px-2 py-0.5 rounded-lg">{sku.val} / {sku.total}</span>
                      </div>
                      <div className="w-full bg-black h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(sku.val/sku.total)*100}%` }} className={`h-full bg-gradient-to-r ${sku.color} rounded-full`} />
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODALS */}
        <AnimatePresence>
            {showDailyBonus && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                    <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] w-full max-w-xs rounded-[4rem] p-12 text-center shadow-3xl border border-white/10 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-[50px]" />
                        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30"><HiOutlineGift size={56} className="text-yellow-500 animate-bounce" /></div>
                        <h2 className="text-3xl font-black italic uppercase text-white leading-none">Scout Reward</h2>
                        <div className="flex items-center justify-center gap-2 my-10"><span className="text-7xl font-black text-white italic tracking-tighter">+100</span><span className="text-2xl font-black text-yellow-500 italic">XP</span></div>
                        <p className="text-[11px] font-bold text-emerald-400 mb-6 uppercase tracking-widest">Energi +20 Restore!</p>
                        <button onClick={() => setShowDailyBonus(false)} className="w-full bg-red-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Lanjutkan</button>
                    </motion.div>
                </motion.div>
            )}

            {selectedAnnounce && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
                    <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-slate-950 w-full max-w-sm rounded-[3.5rem] overflow-hidden border border-white/10 shadow-3xl">
                        <div className="p-12 bg-gradient-to-br from-[#7f1d1d] to-[#450a0a] text-white relative">
                            <button onClick={() => setSelectedAnnounce(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><HiOutlineX size={32} /></button>
                            <span className="text-[10px] font-black uppercase bg-black/30 px-4 py-1.5 rounded-full border border-white/10">{selectedAnnounce.category}</span>
                            <h2 className="text-3xl font-black italic uppercase mt-8 leading-tight tracking-tighter">{selectedAnnounce.title}</h2>
                        </div>
                        <div className="p-12 text-sm font-bold text-slate-400 italic leading-relaxed mb-6 max-h-[300px] overflow-y-auto custom-scroll">
                                {selectedAnnounce.message || "Tetap aktif bersama Laskar Bahari!"}
                                <button onClick={() => setSelectedAnnounce(null)} className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mt-10">Paham!</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {showKTA && <KTAView userData={userData} onClose={() => setShowKTA(false)} />}
      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2.5s infinite linear; }
        .shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); }
      `}</style>
    </div>
  );
}

export default AnggotaDashboard;