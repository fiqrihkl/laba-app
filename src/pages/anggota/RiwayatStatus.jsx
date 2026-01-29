import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineClock, 
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineChatAlt2,
  HiOutlineTrendingUp
} from "react-icons/hi";

export default function RiwayatStatus() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  
  // State terpisah untuk menampung hasil query parallel
  const [dataTingkat, setDataTingkat] = useState([]);
  const [dataSKU, setDataSKU] = useState([]);
  const [dataSFH, setDataSFH] = useState([]);
  const [dataXP, setDataXP] = useState([]);

  const navigate = useNavigate();
  const { showModal } = useModal();

  const pageTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  // Efek untuk menggabungkan semua data setiap kali ada perubahan di salah satu state
  useEffect(() => {
    const combined = [...dataTingkat, ...dataSKU, ...dataSFH, ...dataXP].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    setActivities(combined);
  }, [dataTingkat, dataSKU, dataSFH, dataXP]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    // 1. Listen Pengajuan Tingkat
    const qTingkat = query(
      collection(db, "pengajuan_tingkat"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubTingkat = onSnapshot(qTingkat, (snap) => {
      setDataTingkat(snap.docs.map(d => ({
        id: d.id,
        type: "RANK_SUBMISSION",
        timestamp: d.data().createdAt?.toDate() || new Date(),
        ...d.data(),
      })));
      setLoading(false); // Matikan loading setelah data pertama masuk
    }, () => setLoading(false));

    // 2. Listen Progress SKU
    const qSKU = query(
      collection(db, "sku_progress"),
      where("uid", "==", user.uid),
      orderBy("tgl_pengajuan", "desc")
    );
    const unsubSKU = onSnapshot(qSKU, (snap) => {
      setDataSKU(snap.docs.map(d => ({
        id: d.id,
        type: "SKU_PROGRESS",
        timestamp: d.data().tgl_verifikasi?.toDate() || d.data().tgl_pengajuan?.toDate() || new Date(),
        ...d.data(),
      })));
    });

    // 3. Listen SFH Reports
    const qSFH = query(
      collection(db, "sfh_reports"),
      where("reporterUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubSFH = onSnapshot(qSFH, (snap) => {
      setDataSFH(snap.docs.map(d => ({
        id: d.id,
        type: "SFH_REPORT",
        timestamp: d.data().createdAt?.toDate() || new Date(),
        ...d.data(),
      })));
    });

    // 4. Listen XP Logs dari User Doc
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const logs = (userData.attendanceLog || []).map((log, index) => ({
          id: `xp-${index}-${log.timestamp}`,
          type: "XP_LOG",
          timestamp: new Date(log.timestamp),
          title: log.activity || "Perubahan XP",
          points: log.pointsEarned || 0,
          isSeen: true,
        }));
        setDataXP(logs);
      }
    });

    return () => {
      unsubTingkat();
      unsubSKU();
      unsubSFH();
      unsubUser();
    };
  }, []);

  const markAsRead = async (docId) => {
    try {
      await updateDoc(doc(db, "pengajuan_tingkat", docId), { isSeen: true });
    } catch (error) {
      console.error("Gagal menandai baca:", error);
    }
  };

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user || isMarking) return;
    setIsMarking(true);
    try {
      const q = query(
        collection(db, "pengajuan_tingkat"),
        where("uid", "==", user.uid),
        where("isSeen", "==", false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(doc(db, "pengajuan_tingkat", d.id), { isSeen: true });
      });
      await batch.commit();
      setIsMarking(false);
    } catch (error) {
      setIsMarking(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] italic">
      <div className="text-center font-black text-red-600 animate-pulse uppercase text-[10px] tracking-widest">
        Syncing Activity Timeline...
      </div>
    </div>
  );

  return (
    <motion.div 
      initial="initial" animate="animate" exit="exit" variants={pageTransition}
      className="min-h-screen bg-[#020617] text-slate-100 font-sans italic"
    >
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] pt-12 pb-16 px-8 rounded-b-[4rem] relative shadow-3xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition">
                <HiOutlineChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Activity Hub</h1>
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-[0.3em] mt-1">Timeline & Alerts</p>
              </div>
            </div>

            {activities.some(a => a.type === "RANK_SUBMISSION" && a.isSeen === false) && (
              <button 
                onClick={markAllAsRead} disabled={isMarking}
                className="bg-white text-[#020617] px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 shadow-xl transition-all"
              >
                {isMarking ? "..." : "Read All"}
              </button>
            )}
          </div>
        </div>

        {/* TIMELINE CONTENT */}
        <div className="px-6 -mt-8 relative z-20 flex-1 pb-32 overflow-y-auto scrollbar-hide">
          {activities.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center border border-white/10">
              <HiOutlineClock className="w-12 h-12 mx-auto text-slate-700 mb-4 opacity-30" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Belum ada jejak aktivitas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((item, index) => {
                const isUnread = (item.type === "RANK_SUBMISSION" && item.isSeen === false) || (item.type === "SFH_REPORT" && item.status === "unread");

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className={`bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-6 border transition-all duration-500 relative ${
                      isUnread ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[7px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                        item.type === 'RANK_SUBMISSION' ? 'bg-amber-500/20 text-amber-500' : 
                        item.type === 'SKU_PROGRESS' ? 'bg-blue-500/20 text-blue-500' : 
                        item.type === 'SFH_REPORT' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <p className="text-[8px] font-black text-slate-500 uppercase">
                        {item.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Content Logic */}
                    {item.type === 'RANK_SUBMISSION' ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <HiOutlineAcademicCap className="w-6 h-6 text-amber-500" />
                            <div>
                              <h3 className="text-xs font-black text-slate-200 uppercase">{item.tingkat_asal} → {item.tingkat_tujuan}</h3>
                              <p className={`text-[9px] font-black uppercase ${item.status === 'approved' ? 'text-emerald-500' : item.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`}>
                                {item.status === 'approved' ? '✓ Disetujui' : item.status === 'rejected' ? '✗ Ditolak' : '● Menunggu Verifikasi'}
                              </p>
                            </div>
                          </div>
                          {item.isSeen === false && item.status !== 'pending' && (
                            <button onClick={() => markAsRead(item.id)} className="bg-white text-[#020617] px-3 py-1.5 rounded-lg text-[8px] font-black uppercase">OK</button>
                          )}
                        </div>
                      </div>
                    ) : item.type === 'SKU_PROGRESS' ? (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 font-black text-xs">{item.nomor_poin}</div>
                        <div>
                          <h3 className="text-xs font-black text-slate-200 uppercase">Butir SKU Lulus</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Verifikator: {item.verifikator_nama || "Pembina"}</p>
                        </div>
                        <HiOutlineCheckCircle className="ml-auto text-emerald-500" />
                      </div>
                    ) : item.type === 'SFH_REPORT' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <HiOutlineShieldCheck className="w-6 h-6 text-red-500" />
                          <h3 className="text-xs font-black text-slate-200 uppercase">Laporan SFH: {item.status}</h3>
                        </div>
                        {item.adminReply && (
                          <div className="bg-emerald-500/5 rounded-2xl p-3 border border-emerald-500/20">
                            <p className="text-[9px] text-emerald-400 font-bold italic">Balasan: "{item.adminReply}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <HiOutlineTrendingUp className="text-emerald-500" />
                          <h3 className="text-xs font-black text-slate-200 uppercase">{item.title}</h3>
                        </div>
                        <span className="text-xs font-black text-emerald-500">+{item.points} XP</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}