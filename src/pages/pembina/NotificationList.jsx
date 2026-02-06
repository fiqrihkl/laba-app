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
  HiOutlineTrash,
  HiOutlineSpeakerphone,
  HiOutlineShieldExclamation,
  HiOutlineClock,
  HiOutlineChevronDown
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

  // 3. Tandai Semua sebagai Terbaca (Batch Operation)
  const markAllAsRead = async () => {
    const q = query(collection(db, "notifications"), where("isRead", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });

    await batch.commit();
  };

  // Helper Ikon Kategori
  const getIcon = (type) => {
    switch (type) {
      case "ANNOUNCEMENT": return <HiOutlineSpeakerphone className="text-blue-500" />;
      case "SOS": return <HiOutlineShieldExclamation className="text-red-500" />;
      default: return <HiOutlineBell className="text-slate-500" />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-500 uppercase text-[10px] tracking-widest italic font-black">
      <div className="w-8 h-8 border-2 border-slate-800 border-t-blue-600 rounded-full animate-spin mb-4" />
      Decrypting Feed...
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
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Intelligence Feed</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Notifikasi Sistem</p>
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
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Belum ada transmisi data</p>
              </div>
            ) : (
              notifications.map((item) => (
                <motion.div 
                  layout key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-slate-900 border border-white/5 rounded-xl overflow-hidden transition-all ${!item.isRead ? 'border-blue-500/30' : ''}`}
                >
                  {/* Card Trigger */}
                  <div 
                    className="p-4 flex items-start gap-4 cursor-pointer" 
                    onClick={() => {
                      setExpandedId(expandedId === item.id ? null : item.id);
                      if (!item.isRead) markAsRead(item.id);
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800 border border-white/5 shrink-0 relative`}>
                      {getIcon(item.type)}
                      {!item.isRead && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-slate-900 animate-pulse" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`text-[11px] font-black uppercase tracking-tight leading-snug ${!item.isRead ? 'text-white' : 'text-slate-400'}`}>
                          {item.title}
                        </h3>
                        <HiOutlineChevronDown className={`text-slate-700 shrink-0 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 flex items-center gap-1">
                        <HiOutlineClock size={10} /> {item.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
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
                          {item.category && (
                             <div className="mt-3 inline-block px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[7px] font-black text-blue-400 uppercase tracking-widest">
                               Division: {item.category}
                             </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto py-8 text-center opacity-30 mx-6 border-t border-white/5">
           <p className="text-[8px] font-bold uppercase tracking-[0.5em]">Navigasi Intel Unified Messaging</p>
        </footer>
      </div>
    </div>
  );
}