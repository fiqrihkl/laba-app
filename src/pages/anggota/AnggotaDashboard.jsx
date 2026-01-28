import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  updateDoc,
  increment,
  arrayUnion,
  where,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext"; // IMPORT CONTEXT MODAL
import LengkapiKTA from "../anggota/LengkapiKTA";
import KTAView from "../anggota/KTAView"; 
import TombolSOS from "./TombolSOS";

// IMPORT REACT ICONS
import {
  HiSearch,
  HiOutlineIdentification,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineSpeakerphone,
  HiOutlineLightningBolt,
  HiOutlineBadgeCheck,
  HiOutlineTrendingUp,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineGift
} from "react-icons/hi";

function AnggotaDashboard() {
  const [userData, setUserData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [skuProgressStats, setSkuProgressStats] = useState({
    ramu: 0, rakit: 0, terap: 0,
    totalRamu: 1, totalRakit: 1, totalTerap: 1
  });
  const [loading, setLoading] = useState(true);
  const [showLengkapiKTA, setShowLengkapiKTA] = useState(false);
  const [showKTA, setShowKTA] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // STATE MODAL PENGALAMAN GAME
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevelData, setNewLevelData] = useState(null);
  const [selectedAnnounce, setSelectedAnnounce] = useState(null);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  
  // GUNAKAN GLOBAL MODAL
  const { showModal } = useModal();

  const navigate = useNavigate();

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const getMarineRank = (level) => {
    const lvl = level || 1;
    if (lvl <= 10) return { eng: "Junior Deckhand", id: "Klasi Muda", color: "text-slate-400" };
    if (lvl <= 20) return { eng: "Senior Deckhand", id: "Klasi Senior", color: "text-blue-400" };
    if (lvl <= 30) return { eng: "Signalman", id: "Juru Isyarat", color: "text-teal-400" };
    if (lvl <= 40) return { eng: "Petty Officer", id: "Bintara Bahari", color: "text-green-400" };
    if (lvl <= 50) return { eng: "Navigator", id: "Pandu Samudera", color: "text-orange-400" };
    if (lvl <= 60) return { eng: "Chief Officer", id: "Mualim Utama", color: "text-red-400" };
    if (lvl <= 70) return { eng: "Fleet Captain", id: "Kapten Armada", color: "text-pink-400" };
    if (lvl <= 80) return { eng: "Commodore", id: "Komodor", color: "text-indigo-400" };
    if (lvl <= 90) return { eng: "Vice Admiral", id: "Laksamana Madya", color: "text-purple-400" };
    return { eng: "Fleet Admiral", id: "Laksamana Utama", color: "text-yellow-400" };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const qUser = query(collection(db, "users"), where("uid", "==", user.uid));
      const unsubscribeUser = onSnapshot(qUser, (snapshot) => {
        if (!snapshot.empty) {
          const docSnapshot = snapshot.docs[0];
          const data = docSnapshot.data();
          setUserData({ ...data, docId: docSnapshot.id });
          checkDailyLogin(docSnapshot.id, data);
          if (data.points >= 2000) {
            handleLevelUp(docSnapshot.id, data.level || 1, data.points);
          }
        }
      });

      const qAnnounce = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(10));
      const unsubscribeAnnounce = onSnapshot(qAnnounce, (snapshot) => {
        setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      const qMaster = query(collection(db, "master_sku"));
      const unsubscribeMaster = onSnapshot(qMaster, (snapshot) => {
        const totals = { ramu: 0, rakit: 0, terap: 0 };
        snapshot.docs.forEach(doc => {
          const d = doc.data();
          if (d.tingkat === "Ramu") totals.ramu++;
          if (d.tingkat === "Rakit") totals.rakit++;
          if (d.tingkat === "Terap") totals.terap++;
        });
        setSkuProgressStats(prev => ({
          ...prev,
          totalRamu: totals.ramu || 1, totalRakit: totals.rakit || 1, totalTerap: totals.terap || 1
        }));
      });

      const qSku = query(collection(db, "sku_progress"), where("uid", "==", user.uid), where("status", "==", "verified"));
      const unsubscribeSku = onSnapshot(qSku, (snapshot) => {
        const counts = { ramu: 0, rakit: 0, terap: 0 };
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.tingkat === "Ramu") counts.ramu++;
          if (data.tingkat === "Rakit") counts.rakit++;
          if (data.tingkat === "Terap") counts.terap++;
        });
        setSkuProgressStats(prev => ({ ...prev, ...counts }));
      });

      return () => {
        unsubscribeUser();
        unsubscribeAnnounce();
        unsubscribeMaster();
        unsubscribeSku();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const checkDailyLogin = async (docId, data) => {
    const today = new Date().toLocaleDateString('en-CA'); 
    const lastLogin = data.lastDailyLogin;
    if (lastLogin !== today) {
      try {
        const userRef = doc(db, "users", docId);
        await updateDoc(userRef, {
          points: increment(100), 
          lastDailyLogin: today,
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: "Bonus Login Harian Laskar",
            pointsEarned: 100,
            type: "DAILY_BONUS",
            isSeen: true
          }),
        });
        setShowDailyBonus(true);
      } catch (error) {
        console.error("Gagal klaim bonus harian:", error);
      }
    }
  };

  const handleOpenIDCard = () => {
    const dataLengkap = userData?.ktaPhotoURL && userData?.agama && userData?.tempat_lahir && userData?.jenis_kelamin;
    if (!dataLengkap) {
      setShowLengkapiKTA(true);
    } else {
      setShowKTA(true);
    }
  };

  const handleLevelUp = async (docId, currentLevel, currentPoints) => {
    try {
      const userRef = doc(db, "users", docId);
      const nextLevel = currentLevel + 1;
      await updateDoc(userRef, {
        level: nextLevel,
        points: currentPoints - 2000,
        attendanceLog: arrayUnion({
          timestamp: new Date().toISOString(),
          activity: `Promosi Ke Level ${nextLevel}`,
          pointsEarned: 0,
          type: "LEVEL_UP",
          isSeen: false
        }),
      });
      setNewLevelData({ level: nextLevel, rank: getMarineRank(nextLevel), isNewTitle: nextLevel % 10 === 1 });
      setShowLevelUpModal(true);
    } catch (error) { console.error("Error level up:", error); }
  };

  const handleClaimXP = async (announce) => {
    if (!userData) return;
    setSelectedAnnounce(announce);
    const hasClaimed = userData.claimedXP?.includes(announce.id);
    if (!hasClaimed) {
      try {
        const userRef = doc(db, "users", userData.docId);
        await updateDoc(userRef, {
          points: increment(50),
          claimedXP: arrayUnion(announce.id),
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: `Reward Baca: ${announce.title}`,
            pointsEarned: 50,
            type: "REWARD_INFO",
            isSeen: true 
          }),
        });
        
        // PEMANGGILAN MODAL GLOBAL UNTUK KLAIM XP
        showModal(
          "XP Berhasil Diklaim!", 
          `Kamu mendapatkan +50 XP dari misi literasi "${announce.title}"`, 
          "success"
        );
        
      } catch (error) { console.error("Gagal klaim XP:", error); }
    }
  };

  const renderSkuProgress = () => {
    const tingkat = userData?.tingkat || "Ramu";
    const levels = [
      { name: "Ramu", current: skuProgressStats.ramu, total: skuProgressStats.totalRamu, color: "from-blue-600 to-blue-400" },
      { name: "Rakit", current: skuProgressStats.rakit, total: skuProgressStats.totalRakit, color: "from-indigo-600 to-indigo-400" },
      { name: "Terap", current: skuProgressStats.terap, total: skuProgressStats.totalTerap, color: "from-purple-600 to-purple-400" }
    ];
    const visibleLevels = levels.filter((lvl, index) => {
      if (tingkat === "Ramu") return index === 0;
      if (tingkat === "Rakit") return index <= 1;
      return true;
    });

    return (
      <div className="space-y-5">
        {visibleLevels.map((lvl, i) => {
          const percentage = Math.min((lvl.current / lvl.total) * 100, 100);
          return (
            <div key={i} className="animate-in fade-in slide-in-from-left duration-700" style={{ transitionDelay: `${i * 200}ms` }}>
              <div className="flex justify-between items-end mb-2 px-1">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-tighter italic">Progres SKU {lvl.name}</p>
                <p className="text-[9px] font-black text-blue-900">{lvl.current} / {lvl.total}</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner border border-slate-50">
                <div className={`bg-gradient-to-r ${lvl.color} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic font-black text-blue-900 animate-pulse uppercase text-xs tracking-[0.3em]">
      Menyusun Petualangan...
    </div>
  );

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium"
    >
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-100">
        
        {/* HEADER */}
        <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-white px-8 pt-12 pb-20 relative">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-[1.8rem] shadow-2xl rotate-3 overflow-hidden border-2 border-blue-50">
                <div className="w-full h-full rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-blue-900 font-black text-2xl overflow-hidden uppercase">
                  {userData?.photoURL ? <img src={userData.photoURL} alt="P" className="w-full h-full object-cover" /> : userData?.nama?.substring(0, 1)}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-none tracking-tighter uppercase drop-shadow-md">{userData?.nama?.split(" ")[0]}</h1>
                <div className="mt-2">
                   <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 leading-none ${getMarineRank(userData?.level).color}`}>
                      <HiOutlineBadgeCheck className="w-3 h-3 text-yellow-400" /> {getMarineRank(userData?.level).eng}
                   </p>
                   <p className="text-[7px] text-blue-100 font-bold uppercase opacity-60 mt-0.5 italic">LVL {userData?.level || 1} • {getMarineRank(userData?.level).id}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-[2rem] flex flex-col items-center shadow-xl min-w-[80px]">
              <HiOutlineLightningBolt className="text-yellow-400 w-5 h-5 animate-bounce" />
              <span className="text-[7px] font-black text-blue-100 uppercase tracking-widest">Total XP</span>
              <span className="text-xl font-black text-white italic tracking-tighter leading-none mt-1">{userData?.points || 0}</span>
            </div>
          </div>

          <div className="mt-8 relative z-10 bg-black/20 backdrop-blur-md p-4 rounded-[2rem] border border-white/10 shadow-lg">
            <div className="flex justify-between items-center mb-2 text-white">
              <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><HiOutlineTrendingUp className="text-green-400" /> Milestone Target</span>
              <span className="text-[8px] font-black uppercase">{2000 - (userData?.points || 0)} XP to Next Level</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${Math.min(((userData?.points || 0) / 2000) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="px-6 -mt-6 relative z-20">
          <div className="relative group">
            <HiSearch className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari instruksi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-none rounded-[2rem] py-4 pl-14 pr-6 text-xs font-bold shadow-xl outline-none italic focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
        </div>

        {/* BROADCAST NEWS */}
        <div className="mt-8 animate-in fade-in duration-700">
          <div className="px-8 flex justify-between items-center mb-4">
            <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] flex items-center gap-2"><HiOutlineSpeakerphone className="text-blue-500" /> Broadcast News</h2>
            <Link to="/announcements" className="text-[8px] font-black text-blue-600 uppercase italic flex items-center gap-1 group">
               Lihat Lengkap <HiOutlineChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 scrollbar-hide">
            {announcements.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())).map((info) => (
              <div key={info.id} onClick={() => handleClaimXP(info)} className={`min-w-[260px] rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden active:scale-95 transition-all cursor-pointer group ${info.category === 'Urgent' ? 'bg-gradient-to-br from-red-600 to-red-900' : 'bg-slate-900'}`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] bg-blue-600 px-2 py-0.5 rounded-full font-black uppercase italic shadow-lg">{info.category || "General"}</span>
                    {userData?.claimedXP?.includes(info.id) && <HiOutlineBadgeCheck className="w-4 h-4 text-green-400" />}
                  </div>
                  <h3 className="mt-4 font-black text-xs line-clamp-2 uppercase tracking-tight leading-tight">{info.title}</h3>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${userData?.claimedXP?.includes(info.id) ? "bg-green-500" : "bg-yellow-400 animate-pulse"}`}></div>
                      <span className="text-[8px] font-black uppercase text-slate-400">{userData?.claimedXP?.includes(info.id) ? "Read" : "Claim +50 XP"}</span>
                    </div>
                    <p className="text-[7px] font-black text-slate-500 uppercase">{info.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MENU GRID */}
        <div className="px-6 mt-8">
          <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 ml-2">Laskar Adventure</h2>
          <div className="grid grid-cols-3 gap-4">
            <button onClick={handleOpenIDCard} className="aspect-square bg-blue-900 rounded-[2.2rem] flex flex-col items-center justify-center text-white shadow-lg active:scale-90 transition-all border-b-4 border-blue-950 group">
              <HiOutlineIdentification className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-widest">ID-Card</span>
            </button>
            <Link to="/leaderboard" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group">
              <HiOutlineChartBar className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-600 transition-colors group-hover:scale-110" />
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Rank</span>
            </Link>
            <Link to="/admin/struktur" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group">
              <HiOutlineUserGroup className="w-8 h-8 mb-2 text-slate-400 group-hover:text-blue-600 transition-colors group-hover:scale-110" />
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Gudep</span>
            </Link>
          </div>
        </div>

        {/* SECURE SECTION */}
        <div className="px-6 mt-8">
           <h2 className="font-black text-red-500/70 uppercase text-[9px] tracking-[0.2em] mb-4 ml-2">Secure Shield</h2>
           <div className="grid grid-cols-2 gap-4">
             <div className="col-span-1"><TombolSOS userProfile={userData} /></div>
             <button onClick={() => navigate("/lapor-insiden")} className="bg-white border-2 border-slate-50 p-5 rounded-[2.5rem] flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all group hover:border-red-100">
               <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-red-50 transition-all group-hover:rotate-12"><HiOutlineShieldCheck className="w-6 h-6 text-slate-400 group-hover:text-red-500" /></div>
               <span className="font-black text-[8px] uppercase text-slate-500 tracking-widest text-center">Lapor SFH</span>
             </button>
           </div>
        </div>

        {/* SKU PROGRESS */}
        <div className="px-6 mt-10 mb-10">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] flex items-center gap-2"><HiOutlineLightningBolt className="text-yellow-500" /> Capaian SKU</h2>
            <Link to="/sku" className="text-[8px] font-black text-blue-600 uppercase italic underline">Detail Buku</Link>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
            {renderSkuProgress()}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
               <div>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic">Tingkat SKU</p>
                  <p className="text-[11px] font-black text-slate-800 uppercase italic tracking-tight bg-blue-50 px-3 py-1 rounded-full mt-1 inline-block">{userData?.tingkat || "Laskar Muda"}</p>
               </div>
               <HiOutlineBadgeCheck className="w-8 h-8 text-blue-100" />
            </div>
          </div>
        </div>

        {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>

        {/* MODAL DAILY BONUS */}
        {showDailyBonus && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
             <div className="bg-white w-full max-w-sm rounded-[3.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative animate-in zoom-in slide-in-from-bottom-10 duration-700">
                <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-12 text-center text-white relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                      <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
                   </div>
                   <HiOutlineGift className="w-20 h-20 mx-auto mb-4 animate-bounce drop-shadow-2xl" />
                   <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Daily Reward!</h1>
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-80">Laskar Attendance Bonus</p>
                </div>
                <div className="p-10 text-center">
                   <div className="flex flex-col items-center mb-8">
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineSparkles className="text-yellow-500 w-5 h-5 animate-pulse" />
                        <span className="text-5xl font-black text-slate-900 italic tracking-tighter">+100</span>
                        <span className="text-xl font-black text-blue-600 italic tracking-tighter self-end mb-1">XP</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 italic font-medium">Selamat! Dedikasi harianmu telah terdeteksi oleh sistem radar Bahari.</p>
                   </div>
                   <button onClick={() => setShowDailyBonus(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-black group flex items-center justify-center gap-2">
                      Klaim & Lanjutkan <HiOutlineChevronRight className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL LEVEL UP */}
        {showLevelUpModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-blue-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-sm rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in duration-700">
                <button onClick={() => setShowLevelUpModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                  <HiOutlineX className="w-6 h-6" />
                </button>
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-12 text-center text-white">
                   <HiOutlineLightningBolt className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                   <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Level Up!</h1>
                </div>
                <div className="pt-10 pb-12 px-10 text-center">
                   <h2 className="text-5xl font-black text-blue-900 italic tracking-tighter mb-4 animate-bounce">LVL {newLevelData?.level}</h2>
                   <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 mt-4">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">New Marine Rank Unlocked</p>
                      <h3 className={`text-xl font-black uppercase tracking-tight italic ${newLevelData?.rank.color}`}>{newLevelData?.rank.eng}</h3>
                      <p className="text-[10px] font-bold text-slate-300 uppercase italic mt-1">({newLevelData?.rank.id})</p>
                   </div>
                   {newLevelData?.isNewTitle && (
                     <button onClick={() => alert("Sertifikat sedang disiapkan...")} className="w-full mt-6 bg-green-600 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><HiOutlineDownload className="w-4 h-4" /> Download Certificate</button>
                   )}
                   <button onClick={() => setShowLevelUpModal(false)} className="w-full mt-4 bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Lanjutkan Petualangan</button>
                </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL PENGUMUMAN */}
        {selectedAnnounce && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in duration-500 border border-slate-100">
              <div className={`p-8 text-white ${selectedAnnounce.category === 'Urgent' ? 'bg-red-600' : 'bg-slate-900'}`}>
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">{selectedAnnounce.category || "General"}</span>
                  <button onClick={() => setSelectedAnnounce(null)} className="text-white/60 hover:text-white transition-colors">
                    <HiOutlineX size={24} />
                  </button>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter mt-4 italic leading-tight">{selectedAnnounce.title}</h2>
              </div>
              <div className="p-8 italic font-medium">
                <div className="flex items-center gap-2 text-slate-400 mb-6">
                  <HiOutlineCalendar size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{selectedAnnounce.date}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 max-h-[300px] overflow-y-auto italic font-bold text-xs leading-relaxed text-slate-600">
                  {selectedAnnounce.message || "Tidak ada detail pesan."}
                </div>
                <button onClick={() => setSelectedAnnounce(null)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Tutup Informasi</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GATEKEEPER KTA */}
        {showLengkapiKTA && <LengkapiKTA userData={userData} onClose={() => setShowLengkapiKTA(false)} />}
        
        {/* MODAL KTA DIGITAL (VIEW) */}
        {showKTA && <KTAView userData={userData} onClose={() => setShowKTA(false)} />}
      </div>
    </motion.div>
  );
}

export default AnggotaDashboard;