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
import { motion, AnimatePresence } from "framer-motion"; // UNTUK TRANSISI HALUS
import { useModal } from "../../context/ModalContext"; // IMPORT MODAL PREMIUM

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineClock, 
  HiOutlineBadgeCheck, 
  HiOutlineTrendingUp,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineX
} from "react-icons/hi";

export default function RiwayatStatus() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal(); // Gunakan Modal Premium

  // Animasi Variabel
  const pageTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    const qTingkat = query(
      collection(db, "pengajuan_tingkat"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const qSKU = query(
      collection(db, "sku_progress"),
      where("uid", "==", user.uid),
      orderBy("tgl_pengajuan", "desc")
    );

    const userRef = doc(db, "users", user.uid);

    const unsubTingkat = onSnapshot(qTingkat, (snapTingkat) => {
      const tingkatData = snapTingkat.docs.map((doc) => ({
        id: doc.id,
        type: "RANK_SUBMISSION",
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        ...doc.data(),
      }));

      const unsubSKU = onSnapshot(qSKU, (snapSKU) => {
        const skuData = snapSKU.docs.map((doc) => ({
          id: doc.id,
          type: "SKU_PROGRESS",
          timestamp: doc.data().tgl_verifikasi?.toDate() || doc.data().tgl_pengajuan?.toDate() || new Date(),
          ...doc.data(),
        }));

        const unsubUser = onSnapshot(userRef, (userSnap) => {
          let xpLogs = [];
          if (userSnap.exists()) {
            const userData = userSnap.data();
            xpLogs = (userData.attendanceLog || []).map((log, index) => ({
              id: `xp-${index}-${log.timestamp}`,
              type: "XP_LOG",
              timestamp: new Date(log.timestamp),
              title: log.activity || "Perubahan XP",
              points: log.pointsEarned || 0,
              isSeen: true,
            }));
          }

          const combined = [...tingkatData, ...skuData, ...xpLogs].sort(
            (a, b) => b.timestamp - a.timestamp
          );

          setActivities(combined);
          setLoading(false);
        });

        return () => unsubUser();
      });

      return () => unsubSKU();
    });

    return () => unsubTingkat();
  }, []);

  const markAsRead = async (docId) => {
    try {
      const docRef = doc(db, "pengajuan_tingkat", docId);
      await updateDoc(docRef, { isSeen: true });
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
        where("status", "!=", "pending")
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let unreadCount = 0;

      snapshot.docs.forEach((d) => {
        if (d.data().isSeen !== true) {
          batch.update(doc(db, "pengajuan_tingkat", d.id), { isSeen: true });
          unreadCount++;
        }
      });

      if (unreadCount > 0) {
        await batch.commit();
        showModal("Berhasil", `${unreadCount} Notifikasi ditandai sebagai selesai.`, "success");
      }
      setIsMarking(false);
    } catch (error) {
      setIsMarking(false);
      showModal("Gagal", "Tidak dapat memperbarui status notifikasi.", "danger");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-widest">
        Sinkronisasi Aktivitas...
      </div>
    </div>
  );

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium"
    >
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-slate-100">
        
        {/* HEADER */}
        <div className="bg-slate-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] relative text-white shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
                <HiOutlineChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tighter">Pusat Aktivitas</h1>
                <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.3em]">Timeline & Notif</p>
              </div>
            </div>

            {activities.some(a => a.type === "RANK_SUBMISSION" && a.isSeen !== true) && (
              <button 
                onClick={markAllAsRead}
                disabled={isMarking}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-900/20 transition-all">
                {isMarking ? "..." : "Baca Semua"}
              </button>
            )}
          </div>
        </div>

        {/* TIMELINE CONTENT */}
        <div className="px-6 -mt-8 relative z-20 flex-1 overflow-y-auto scrollbar-hide">
          {activities.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-slate-100">
              <HiOutlineClock className="w-12 h-12 mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Belum Ada Aktivitas</p>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              {activities.map((item) => {
                const isUnreadRank = item.type === "RANK_SUBMISSION" && item.isSeen !== true;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id} 
                    className={`bg-white rounded-[2.5rem] p-6 shadow-sm border transition-all duration-500 hover:shadow-md ${
                      isUnreadRank ? 'border-blue-400 ring-4 ring-blue-500/5 shadow-blue-100/50' : 'border-slate-50'
                    }`}>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                          item.type === 'RANK_SUBMISSION' ? 'bg-orange-50 text-orange-600' : 
                          item.type === 'SKU_PROGRESS' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.type === 'RANK_SUBMISSION' ? 'Tingkatan' : 
                           item.type === 'SKU_PROGRESS' ? 'Butir SKU' : 'Poin XP'}
                        </span>
                        {isUnreadRank && (
                          <div className="flex h-2 w-2 relative">
                            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                            <div className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-[8px] font-black text-slate-300 uppercase">
                        {item.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* RENDER BERDASARKAN TIPE */}
                    {item.type === 'RANK_SUBMISSION' ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shadow-inner">
                              <HiOutlineAcademicCap className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-800 uppercase italic">
                                {item.tingkat_asal} → <span className="text-blue-900">{item.tingkat_tujuan}</span>
                              </h3>
                              <p className={`text-[9px] font-black uppercase mt-1 ${
                                item.status === 'approved' ? 'text-green-500' : item.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                              }`}>
                                {item.status === 'approved' ? '✓ Disetujui' : item.status === 'rejected' ? '✗ Ditolak' : '● Menunggu'}
                              </p>
                            </div>
                          </div>
                          {isUnreadRank && (
                            <button onClick={() => markAsRead(item.id)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-md active:scale-90">Selesai</button>
                          )}
                        </div>
                        {item.status === 'rejected' && (
                          <div className="bg-red-50 rounded-2xl p-3 border border-red-100 italic">
                            <p className="text-[9px] text-red-700 font-bold leading-tight uppercase">Alasan: <span className="text-slate-600">"{item.alasan_penolakan}"</span></p>
                          </div>
                        )}
                      </div>
                    ) : item.type === 'SKU_PROGRESS' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center shadow-inner text-green-600 font-black text-xs">
                             {item.nomor_poin}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase italic leading-tight">Poin SKU Lulus</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Verifikator: {item.verifikator_nama || "Pembina Laskar"}</p>
                          </div>
                        </div>
                        <HiOutlineCheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${item.points >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            <HiOutlineTrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase leading-tight truncate max-w-[150px] italic">{item.title}</h3>
                            <p className="text-[8px] text-slate-300 font-bold uppercase mt-1 tracking-widest">Sistem Otoritas radar</p>
                          </div>
                        </div>
                        <div className={`text-xs font-black italic ${item.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.points >= 0 ? `+${item.points}` : item.points} XP
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto bg-white">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600 font-black">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>
    </motion.div>
  );
}