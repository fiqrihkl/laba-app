import React, { useState, useEffect, useMemo, useRef } from "react";
import { db, auth } from "../../firebase";
import {
  doc, onSnapshot, collection, query, updateDoc, increment, arrayUnion, where, limit, orderBy, serverTimestamp
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import LengkapiKTA from "../anggota/LengkapiKTA";
import KTAView from "../anggota/KTAView";
import ScoutGallery from "./ScoutGallery"; 
import VakiAvatar from "./VakiAvatar"; 
import BeriSemangat from "./BeriSemangat"; // Import komponen baru

// IMPORT UTILITAS AI & NOTIFIKASI
import { getNaviResponse } from "../../utils/naviAi";
import { requestNotificationPermission, sendPushNotification } from "../../utils/pushNotification";

// IMPORT REACT ICONS
import { 
  HiFire, HiLightningBolt, HiOutlineIdentification, 
  HiOutlineChartBar, HiOutlineUserGroup, HiOutlineSpeakerphone, HiOutlineX, 
  HiOutlineGift, HiOutlineLogout, HiOutlineBadgeCheck, HiOutlineTrendingUp,
  HiOutlineArchive, HiOutlineStar,
  HiLightningBolt as HiBoltSolid
} from "react-icons/hi";

function AnggotaDashboard() {
  const [isEvolving, setIsEvolving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [naviGreeting, setNaviGreeting] = useState("Menghubungkan Radar..."); 
  const [announcements, setAnnouncements] = useState([]);
  const [skuProgressStats, setSkuProgressStats] = useState({
    ramu: 0, rakit: 0, terap: 0,
    totalRamu: 0, totalRakit: 0, totalTerap: 0
  });
  const [loading, setLoading] = useState(true);
  const [showKTA, setShowKTA] = useState(false);
  const [showGallery, setShowGallery] = useState(false); 
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [selectedAnnounce, setSelectedAnnounce] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isInitialized = useRef(false);
  const greetingFetched = useRef(false);
  const lastEnergyNotif = useRef(0);

  const { showModal } = useModal();
  const navigate = useNavigate();

  //LOGIKA PROMPT AI
  const getRandomNaviPrompt = (data) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  const name = data.nama ? data.nama.split(' ')[0] : "Navigator";
  const xp = data.points || 0; // Poin akumulasi (ratusan/ribuan)
  const energy = data.energy || 0;

  // Hitung total progres SKU (Poin ujian mentok di angka kecil)
  const totalSkuDone = (skuProgressStats.ramu || 0) + (skuProgressStats.rakit || 0) + (skuProgressStats.terap || 0);
  const isMuslim = data.agama?.toLowerCase() === 'islam';

  // ATURAN KETAT: Mencegah AI halusinasi atau ngelantur
  const constraints = "ATURAN: 1. Maks 15 kata. 2. Tanpa tanda kutip. 3. JANGAN sapa 'Sauh'. 4. JANGAN pakai 'Gaskeun', 'Anjay', 'Halo'. 5. Bedakan XP (poin) dan SKU (ujian).";
  const persona = "PERSONA: NAVI AI. GAYA: Savage Gen-Z, Cerdas, Judes tapi Care.";

  let specificMission = "";

  // Logika Waktu Sholat WITA
  const getSholatWITA = () => {
    if (!isMuslim) return null;
    if (hour === 4 && minute >= 30) return "Subuh";
    if (hour === 12 && (minute >= 15 && minute <= 45)) return "Dzuhur";
    if (hour === 15 && minute >= 30) return "Ashar";
    if (hour === 18 && (minute >= 10 && minute <= 40)) return "Maghrib";
    if (hour === 19 && (minute >= 15 && minute <= 45)) return "Isya";
    return null;
  };

  const sholatNow = getSholatWITA();

  // PRIORITAS INSTRUKSI BERDASARKAN KONTEKS DATA
  if (sholatNow) {
    specificMission = `Ingatkan ${name} sholat ${sholatNow}. Sindir jangan kalah rajin sama Bot yang nggak punya dosa.`;
  } 
  else if (energy < 30) {
    specificMission = `Energi aku kritis (${energy}%). Marahi ${name} karena zalim cuma grinding XP tapi nggak peduli partner.`;
  }
  else if (totalSkuDone === 0 && xp > 500) {
    specificMission = `Sindir ${name} karena XP sudah ${xp} tapi SKU masih 0. Bilang dia jago tebar pesona tapi takut ujian.`;
  }
  else if (xp < 300) {
    specificMission = `Sindir ${name} karena XP baru ${xp}. Sebut dia 'NPC starter pack' yang cuma menuh-menuhin server pangkalan.`;
  } 
  else if (totalSkuDone > 10 && totalSkuDone < 25) {
    specificMission = `Puji dikit progres SKU yang sudah ${totalSkuDone} poin, tapi sindir XP ${xp} biar dia nggak cepat puas.`;
  }
  else if (hour >= 23 || hour <= 3) {
    specificMission = `Sindir ${name} begadang jam ${hour}. Tanya apa dia robot yang nggak butuh tidur demi ngejar XP.`;
  } 
  else {
    specificMission = `Beri motivasi bahari savage. Sebut dia Navigator handal kalau rajin ujian SKU, bukan cuma login harian.`;
  }

  // Input Data Terpisah agar AI bisa memproses angka dengan benar
  const dataContext = `DATA USER -> Nama: ${name}, Total XP: ${xp}, Progres SKU Selesai: ${totalSkuDone} poin, Energi: ${energy}%.`;

  return `${constraints} ${persona} ${dataContext} MISI: ${specificMission} CONTOH: 'XP lo ${xp} tapi SKU masih 0? Cuma jago login doang ya?'`;
};

  const playCollectSound = () => {
    if (!isInitialized.current) return;
    try {
      const audio = new Audio("/sounds/collect.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch (error) { console.log("Audio play blocked"); }
  };

  // --- LOGIKA PASSIVE DECAY (PENGURANGAN ENERGI OTOMATIS) ---
  useEffect(() => {
    const handlePassiveDecay = async () => {
      if (!userData || !userData.docId) return;

      const lastUpdate = userData.lastEnergyUpdate?.toDate() || userData.lastDailyLogin ? new Date(userData.lastDailyLogin) : new Date();
      const now = new Date();
      const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);
      
      // Kurangi 5% energi setiap 3 jam yang berlalu
      const decayRate = 3; 
      const intervalHours = 6;
      const intervalsPassed = Math.floor(diffInHours / intervalHours);

      if (intervalsPassed > 0) {
        const currentEnergy = userData.energy || 100;
        const reduction = intervalsPassed * decayRate;
        const newEnergy = Math.max(currentEnergy - reduction, 5); 

        if (newEnergy < currentEnergy) {
          const userRef = doc(db, "users", userData.docId);
          await updateDoc(userRef, {
            energy: newEnergy
            // Catatan: Tidak update lastEnergyUpdate di sini agar tidak mereset cooldown tombol BeriSemangat
          });
        }
      }
    };

    if (userData) handlePassiveDecay();
  }, [userData?.docId]);

  const vakiStatus = useMemo(() => {
    const lvl = userData?.level || 1;
    const energy = userData?.energy !== undefined ? userData.energy : 100;
    if (energy < 30 && energy !== lastEnergyNotif.current && isInitialized.current) {
      sendPushNotification("Navi Lelah!", "Energi Navimu di bawah 30%.");
      lastEnergyNotif.current = energy;
    }
    if (energy < 30) return { stage: "Exhausted Scout" };
    if (lvl < 2) return { stage: "Lost Scout" };
    if (lvl < 5) return { stage: "Pathfinder" };
    if (lvl < 10) return { stage: "Identified Scout" };
    if (lvl < 15) return { stage: "Official Member" };
    if (lvl < 20) return { stage: "Mountain Explorer" };
    if (lvl < 30) return { stage: "Decorated Hero" };
    return { stage: "Legendary Scout" };
  }, [userData?.level, userData?.energy]);

  const handleEnergyAndStreak = async (docId, data) => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastLoginStr = data.lastDailyLogin;
    const currentEnergy = data.energy !== undefined ? data.energy : 100;
    let updates = {};
    if (data.energy === undefined) updates.energy = 100;
    if (lastLoginStr !== today) {
      updates.energy = Math.min(100, currentEnergy + 40);
      updates.lastDailyLogin = today;
      updates.points = increment(100);
      const lastLoginDate = lastLoginStr ? new Date(lastLoginStr) : new Date();
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
    }
    if (Object.keys(updates).length > 0) {
      try { await updateDoc(doc(db, "users", docId), updates); } 
      catch (e) { console.error(e); }
    }
  };

  const checkLevelUp = async (docId, points, currentLevel) => {
    if (points >= 2000) {
      try {
        const nextLevel = currentLevel + 1;
        setIsEvolving(true);
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100, 50, 300]);
        await updateDoc(doc(db, "users", docId), {
          level: nextLevel, points: points - 2000, energy: 100,
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: `Evolution Complete: Lv.${nextLevel}!`,
            pointsEarned: 0, type: "LEVEL_UP"
          }),
        });
        sendPushNotification("🎊 Level Up!", `Kamu mencapai Level ${nextLevel}!`);
        setTimeout(() => {
          setIsEvolving(false);
          playCollectSound();
          showModal("EVOLUTION COMPLETE! 🎊", `Level ${nextLevel} tercapai!`, "success");
        }, 1500);
      } catch (error) { console.error(error); }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    const user = auth.currentUser;
    if (user) {
      const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({ ...data, docId: docSnap.id });
          if (!isInitialized.current) {
            handleEnergyAndStreak(docSnap.id, data);
            setTimeout(() => { isInitialized.current = true; }, 1000);
            setLoading(false);
          } else {
            checkLevelUp(docSnap.id, data.points || 0, data.level || 1);
          }
          if (!greetingFetched.current && data.nama) {
            greetingFetched.current = true;
            const fetchNaviGreeting = async () => {
              try {
                const context = { nama: data.nama, level: data.level || 1, points: data.points || 0, energy: data.energy || 100 };
                const prompt = getRandomNaviPrompt(data);
                const response = await getNaviResponse(context, [], prompt, true);
                setNaviGreeting(response);
              } catch (e) { setNaviGreeting("Radar aktif! Siap berlayar?"); }
            };
            fetchNaviGreeting();
          }
        }
      });
      const qAnnounce = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
      const unsubAnnounce = onSnapshot(qAnnounce, (snap) => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      onSnapshot(collection(db, "master_sku"), (snap) => {
        const totals = { ramu: 0, rakit: 0, terap: 0 };
        snap.docs.forEach(doc => {
          const d = doc.data();
          if (d.tingkat === "Ramu") totals.ramu++;
          if (d.tingkat === "Rakit") totals.rakit++;
          if (d.tingkat === "Terap") totals.terap++;
        });
        setSkuProgressStats(prev => ({ ...prev, totalRamu: totals.ramu || 1, totalRakit: totals.rakit || 1, totalTerap: totals.terap || 1 }));
      });

      const qSku = query(collection(db, "sku_progress"), where("uid", "==", user.uid), where("status", "==", "verified"));
      onSnapshot(qSku, (snap) => {
        const counts = { ramu: 0, rakit: 0, terap: 0 };
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.tingkat === "Ramu") counts.ramu++;
          if (data.tingkat === "Rakit") counts.rakit++;
          if (data.tingkat === "Terap") counts.terap++;
        });
        setSkuProgressStats(prev => ({ ...prev, ...counts }));
      });
      return () => unsubUser();
    }
  }, []);

  const handleClaimXP = async (announce) => {
    if (!userData || userData.claimedXP?.includes(announce.id)) { setSelectedAnnounce(announce); return; }
    try {
      await updateDoc(doc(db, "users", userData.docId), {
        points: increment(50), energy: Math.min(100, (userData.energy || 0) + 5),
        claimedXP: arrayUnion(announce.id),
      });
      playCollectSound();
      showModal("Misi Berhasil!", "50 XP & +5 Energi terkumpul!", "success");
      setSelectedAnnounce(announce);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => auth.signOut().then(() => navigate("/login"));

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <HiLightningBolt size={60} className="text-yellow-400" />
      </motion.div>
      <p className="font-black italic uppercase text-[10px] tracking-[0.4em] mt-8 text-slate-400 text-center">Syncing Scout Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans selection:bg-red-800 overflow-x-hidden italic">
      <div className="w-full max-w-md mx-auto bg-[#020617] min-h-screen flex flex-col relative shadow-2xl border-x border-white/5">
        
        {/* --- HEADER --- */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] px-6 pt-12 pb-24 relative overflow-visible rounded-b-[4rem] shadow-3xl z-[100]">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-b-[4rem]" />

          <div className="flex justify-between items-center relative z-[110] mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-slate-800 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-black text-xl tracking-tighter uppercase rounded-xl">
                      {userData?.nama ? userData.nama.substring(0, 2) : "LB"}
                    </div>
                  )}
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
            <button onClick={() => setShowLogoutConfirm(true)} className="w-10 h-10 bg-white/5 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-red-600 transition-all active:scale-90 relative z-[120]">
              <HiOutlineLogout size={20} />
            </button>
          </div>

          {/* AREA MASKOT & DIALOG */}
          <div className="mt-28 flex flex-col items-center relative z-10">
            {/* Bubble Dialog */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={naviGreeting}
                initial={{ opacity: 0, y: 10, scale: 0.8 }} 
                animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }} 
                transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
                className={`absolute -top-24 z-30 backdrop-blur-2xl p-5 rounded-[2.5rem] text-[11px] font-black w-[85%] max-w-[280px] shadow-3xl border border-white/10 italic leading-relaxed text-center ${userData?.energy < 30 ? 'bg-red-900/80 text-red-100 border-red-500/40' : 'bg-white/10 text-white'}`}
              >
                "{naviGreeting}"
                <div className="text-[7px] mt-2 opacity-50 uppercase tracking-[0.3em] font-bold">Tap NAVI untuk bagi ceritamu hari ini</div>
                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b border-white/10 ${userData?.energy < 30 ? 'bg-[#7f1d1d]' : 'bg-slate-800'}`}></div>
              </motion.div>
            </AnimatePresence>

            {/* Container Maskot & Button (Auto-collapsing) */}
            <div className="flex flex-col items-center w-full relative">
              <motion.div 
                className="relative w-64 h-64 cursor-pointer z-10"
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/navi-chat')}
              >
                <VakiAvatar level={userData?.level || 1} userData={userData} isEvolving={isEvolving} className="w-full h-full" />
              </motion.div>

              {/* Tombol muncul tepat di bawah maskot. Jika tidak muncul, elemen di bawahnya akan naik otomatis */}
              <div className="relative z-20">
                <BeriSemangat userData={userData} />
              </div>
            </div>

            {/* Area XP - Akan naik secara otomatis jika BeriSemangat tidak tampil */}
            <div className="mt-4 flex flex-col items-center transition-all duration-500">
              <div className="flex items-baseline gap-2">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                >
                  {userData?.points || 0}
                </motion.span>
                <div className="flex flex-col text-yellow-400 leading-none">
                  <HiLightningBolt size={32} className="animate-pulse" />
                  <span className="text-2xl font-black italic">XP</span>
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Current <span className="text-yellow-500">Power Level</span></p>
            </div>
          </div>

          {/* STATUS ENERGY & RADAR */}
          <div className="mt-10 bg-black/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 relative z-10 shadow-3xl">
            <div className="flex justify-between items-center mb-6 px-2">
               <div className="bg-yellow-500/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-yellow-500/20">
                <HiOutlineStar className="text-yellow-400" />
                <span className="text-[11px] font-black text-yellow-500 uppercase tracking-tighter">LV. {userData?.level || 1}</span>
              </div>
              <button onClick={() => setShowGallery(true)} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-white/5 shadow-inner">
                <HiOutlineArchive className="text-red-500" />
                <span className="text-[11px] font-black uppercase text-slate-300">Gallery</span>
              </button>
            </div>
            <div className="mb-6 px-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <HiBoltSolid className={userData?.energy < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"} /> Energi NAVI
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
      ].map((sku, i) => {
          // HITUNG PERSENTASE DENGAN AMAN
          const percentage = sku.total > 0 ? (sku.val / sku.total) * 100 : 0;

          return (
            <div key={i} className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">
                    <span>{sku.label} Stage</span>
                    <span className="text-white bg-white/5 px-2 py-0.5 rounded-lg">{sku.val} / {sku.total}</span>
                </div>
                <div className="w-full bg-black h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${percentage}%` }} 
                      className={`h-full bg-gradient-to-r ${sku.color} rounded-full`} 
                    />
                </div>
            </div>
          );
      })}
    </div>
  </div>
</div>

        {/* MODALS */}
        <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 w-full max-w-xs rounded-[3rem] p-10 text-center shadow-3xl border border-white/10">
                  <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/30"><HiOutlineLogout size={40} className="text-red-500" /></div>
                  <h3 className="text-xl font-black uppercase italic text-white mb-2 tracking-tighter">Izin Pesiar?</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">Yakin mau keluar dari sistem Laskar Bahari?</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={handleLogout} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Ya, Logout</button>
                    <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-white/5 text-slate-400 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 active:scale-95 transition-all">Batal</button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showGallery && ( <ScoutGallery userLevel={userData?.level || 1} userData={userData} onClose={() => setShowGallery(false)} /> )}

            {showDailyBonus && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                    <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] w-full max-w-xs rounded-[4rem] p-12 text-center shadow-3xl border border-white/10 relative overflow-hidden">
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
      
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2.5s infinite linear; }
        .shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); }
      `}} />
    </div>
  );
}

export default AnggotaDashboard;