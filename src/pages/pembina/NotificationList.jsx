import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch,
  getDocs,
  where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- ICONS ---
import { 
  HiOutlineChevronLeft, 
  HiOutlineBell, 
  HiOutlineCheckCircle, 
  HiOutlineSpeakerphone,
  HiOutlineShieldExclamation,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineTrendingUp,
  HiOutlineAcademicCap,
  HiOutlineUserAdd
} from "react-icons/hi";

export default function NotificationList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // 1. Fetch Notifikasi Real-time
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Tandai Satu Notifikasi sebagai Terbaca
  const markAsRead = async (id) => {
    try {
      const notifRef = doc(db, "notifications", id);
      await updateDoc(notifRef, { isRead: true });
    } catch (err) {
      console.error("Gagal update status baca", err);
    }
  };

  // 3. Tandai Semua sebagai Terbaca
  const markAllAsRead = async () => {
    const q = query(collection(db, "notifications"), where("isRead", "==", false));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });

    await batch.commit();
  };

  // Helper Visual Kategori
  const getCategoryConfig = (type) => {
    switch (type) {
      case "SOS": 
        return { 
          icon: <HiOutlineShieldExclamation className="text-red-500" />, 
          bg: "bg-red-500/10", 
          label: "URGENT / SOS" 
        };
      case "SFH": 
        return { 
          icon: <HiOutlineShieldExclamation className="text-orange-500" />, 
          bg: "bg-orange-500/10", 
          label: "LAPORAN KEAMANAN" 
        };
      case "SKU": 
        return { 
          icon: <HiOutlineAcademicCap className="text-blue-500" />, 
          bg: "bg-blue-500/10", 
          label: "VERIFIKASI SKU" 
        };
      case "XP": 
        return { 
          icon: <HiOutlineTrendingUp className="text-emerald-500" />, 
          bg: "bg-emerald-500/10", 
          label: "OTORITAS POIN" 
        };
      case "ACTIVATION": 
        return { 
          icon: <HiOutlineUserAdd className="text-yellow-500" />, 
          bg: "bg-yellow-500/10", 
          label: "UNIT BARU" 
        };
      case "ANNOUNCEMENT": 
        return { 
          icon: <HiOutlineSpeakerphone className="text-purple-500" />, 
          bg: "bg-purple-500/10", 
          label: "PENGUMUMAN" 
        };
      default: 
        return { 
          icon: <HiOutlineBell className="text-slate-500" />, 
          bg: "bg-slate-800", 
          label: "SISTEM" 
        };
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-500 uppercase text-[10px] tracking-widest italic font-black">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin mb-4" />
      Membuka Jalur Transmisi...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Radar Notifikasi</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Pusat Informasi Terpadu</p>
            </div>
          </div>
          <button 
            onClick={markAllAsRead}
            className="p-2 text-slate-600 hover:text-emerald-500 transition-colors"
            title="Tandai Semua Terbaca"
          >
            <HiOutlineCheckCircle size={22} />
          </button>
        </header>

        {/* LIST NOTIFIKASI */}
        <main className="p-6 flex-1 space-y-3 overflow-y-auto custom-scroll">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-xl opacity-40">
                <HiOutlineBell size={32} className="mx-auto mb-3 text-slate-600" />
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Jalur Transmisi Kosong</p>
              </div>
            ) : (
              notifications.map((item) => {
                const config = getCategoryConfig(item.type);
                return (
                  <motion.div 
                    layout key={item.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${!item.isRead ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/5'}`}
                  >
                    {/* Card Trigger */}
                    <div 
                      className="p-4 flex items-start gap-4 cursor-pointer" 
                      onClick={() => {
                        setExpandedId(expandedId === item.id ? null : item.id);
                        if (!item.isRead) markAsRead(item.id);
                      }}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config.bg} border border-white/5 shrink-0 relative`}>
                        {config.icon}
                        {!item.isRead && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-slate-900 animate-pulse" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className={`text-[11px] font-black uppercase tracking-tight leading-snug ${!item.isRead ? 'text-white' : 'text-slate-400'}`}>
                            {item.title}
                          </h3>
                          <HiOutlineChevronDown className={`text-slate-700 shrink-0 transition-transform mt-1 ${expandedId === item.id ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                             {config.label}
                           </span>
                           <p className="text-[9px] text-slate-600 font-bold uppercase flex items-center gap-1">
                             <HiOutlineClock size={10} /> {item.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Detail */}
                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden bg-black/20 border-t border-white/5"
                        >
                          <div className="p-4">
                            <p className="text-[10px] text-slate-300 font-bold leading-relaxed italic">
                              "{item.body}"
                            </p>
                            
                            {/* Tombol Aksi Cepat (Opsional sesuai jenis) */}
                            {item.type === "SKU" && (
                              <button 
                                onClick={() => navigate("/pembina/verifikasi-sku")}
                                className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg"
                              >
                                Pergi ke Antrean Verifikasi
                              </button>
                            )}
                            {item.type === "SOS" && (
                              <button 
                                onClick={() => navigate("/pembina/monitor-sos")}
                                className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg"
                              >
                                Lihat Lokasi Darurat
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto py-8 text-center opacity-30 mx-6 border-t border-white/5">
           <p className="text-[8px] font-bold uppercase tracking-[0.5em]">Navigasi Intel Unified Messaging v4.5</p>
        </footer>
      </div>
    </div>
  );
}