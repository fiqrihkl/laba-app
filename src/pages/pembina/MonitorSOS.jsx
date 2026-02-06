import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase"; 
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- ICONS ---
import { 
  HiOutlineClock, 
  HiOutlineLocationMarker, 
  HiOutlineCheckCircle, 
  HiOutlineChevronLeft,
  HiOutlineShieldExclamation,
  HiVolumeOff,
  HiOutlinePhone,
  HiOutlineHeart,
  HiOutlineExternalLink
} from "react-icons/hi";

export default function MonitorSOS() {
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);
  const prevAlertsCount = useRef(0);
  const navigate = useNavigate();

  const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null, nama: "" });

  // 1. Initial Logic: Permissions & Audio Unlock
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const enableAudio = () => {
      setHasInteracted(true);
      window.removeEventListener("click", enableAudio);
    };
    window.addEventListener("click", enableAudio);
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  // 2. Realtime Intelligence
  useEffect(() => {
    const qActive = query(
      collection(db, "sos_signals"),
      where("status", "==", "active"),
      orderBy("timestamp", "desc")
    );

    const qHistory = query(
      collection(db, "sos_signals"),
      where("status", "==", "resolved"),
      orderBy("resolvedAt", "desc"),
      limit(5)
    );

    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      if (data.length > 0) {
        if (hasInteracted && audioRef.current) {
          audioRef.current.play().catch(() => console.log("Audio Playback Blocked"));
        }

        if (data.length > prevAlertsCount.current) {
          const newest = data[0];
          if (Notification.permission === "granted") {
            new Notification("🚨 SOS SIGNAL DETECTED", {
              body: `Laskar ${newest.nama} mengirimkan sinyal darurat!`,
            });
          }
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }

      prevAlertsCount.current = data.length;
      setAlerts(data);
      setLoading(false);
    });

    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const histData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHistory(histData);
    });

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [hasInteracted]);

  const handleResolve = async () => {
    const { id } = modalConfig;
    try {
      const docRef = doc(db, "sos_signals", id);
      await updateDoc(docRef, { 
        status: "resolved", 
        resolvedAt: serverTimestamp(),
        handledBy: auth.currentUser?.displayName || "Pembina" 
      });
      setModalConfig({ isOpen: false, id: null, nama: "" });
    } catch (error) { 
      console.error("Failure:", error); 
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans uppercase text-[10px] tracking-widest">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin mb-4" />
      Menghubungkan Radar SOS...
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans selection:bg-red-900 transition-colors duration-700 ${alerts.length > 0 ? "bg-red-950/10" : ""}`}>
      
      <audio ref={audioRef} loop preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* HEADER */}
      <header className={`p-6 pt-12 flex items-center justify-between border-b border-white/5 transition-colors duration-500 ${alerts.length > 0 ? "bg-red-600 text-white" : "bg-slate-900/20"}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg transition-colors">
            <HiOutlineChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest leading-none">SOS Monitor</h1>
            <p className="text-[9px] font-bold uppercase tracking-tighter opacity-70">
              {alerts.length > 0 ? "Situasi Darurat Aktif" : "Sistem Radar Siaga"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-[10px] font-bold px-3 py-1 rounded-full border ${alerts.length > 0 ? "border-white animate-pulse" : "border-white/10 text-slate-500"}`}>
            {alerts.length} SIGNAL
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        
        {/* AUDIO PROMPT (CLEAN) */}
        {!hasInteracted && (
           <motion.button 
            onClick={() => setHasInteracted(true)}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full p-4 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-between shadow-lg"
           >
             <div className="flex items-center gap-3">
                <HiVolumeOff size={20} />
                <div className="text-left leading-none">
                    <p className="text-[10px] font-bold uppercase">Audio Alarm Nonaktif</p>
                    <p className="text-[9px] font-medium opacity-80 uppercase tracking-tighter">Ketuk untuk sinkronisasi suara</p>
                </div>
             </div>
             <HiOutlineCheckCircle size={18} />
           </motion.button>
        )}

        {/* ACTIVE ALERTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <HiOutlineShieldExclamation size={16} className={alerts.length > 0 ? "text-red-500" : "text-slate-600"} />
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sinyal Masuk</h2>
          </div>

          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-slate-900/50 rounded-2xl p-12 text-center border border-white/5"
              >
                <HiOutlineCheckCircle size={32} className="mx-auto text-slate-800 mb-3" />
                <p className="text-[10px] font-bold uppercase text-slate-600 tracking-widest italic">Belum ada sinyal bahaya</p>
              </motion.div>
            ) : (
              alerts.map((item) => (
                <motion.div 
                  key={item.id} layout
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
                  className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <div className="p-5 border-l-[6px] border-red-600">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white uppercase italic">{item.nama}</h3>
                        <span className="text-[8px] text-red-500 font-bold uppercase tracking-widest">Active Distress Call</span>
                      </div>
                      <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse">
                        <HiOutlineShieldExclamation size={20} />
                      </div>
                    </div>

                    {/* INFO GRID (CLEAN) */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Kontak Laskar</p>
                          <div className="flex items-center gap-2">
                             <HiOutlinePhone size={14} className="text-blue-500" />
                             <p className="text-[11px] font-bold text-slate-200">{item.kontak || "N/A"}</p>
                          </div>
                      </div>
                      <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                          <p className="text-[8px] font-bold text-red-400/60 uppercase mb-1">Status Medis</p>
                          <div className="flex items-center gap-2">
                             <HiOutlineHeart size={14} className="text-red-500" />
                             <p className="text-[11px] font-bold text-red-200 uppercase tracking-tighter italic">Cek Dossier</p>
                          </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2">
                      <a 
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                        target="_blank" rel="noreferrer"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <HiOutlineLocationMarker size={16}/> Tracking
                      </a>
                      <button 
                        onClick={() => setModalConfig({ isOpen: true, id: item.id, nama: item.nama })}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <HiOutlineCheckCircle size={16}/> Selesaikan
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>

        {/* LOG HISTORY (CLEAN) */}
        <section className="pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <HiOutlineClock size={16} /> Riwayat Penanganan
            </h2>
            <span className="text-[9px] text-slate-600 font-bold uppercase">{history.length} Terakhir</span>
          </div>
          
          <div className="space-y-2">
            {history.map((log) => (
              <div key={log.id} className="bg-slate-900/50 border border-white/5 p-3.5 rounded-xl flex items-center justify-between opacity-60 hover:opacity-100 transition-all">
                <div className="flex items-center gap-3">
                  <HiOutlineCheckCircle className="text-emerald-500" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase">{log.nama}</p>
                    <p className="text-[8px] text-slate-500 font-medium uppercase mt-0.5">
                      Berhasil ditangani • {log.resolvedAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <HiOutlineExternalLink size={14} className="text-slate-700" />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL (CONSISTENT WITH VERIFIKASI) */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 w-full max-w-xs rounded-2xl p-6 border border-white/10 text-center shadow-2xl">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <HiOutlineCheckCircle size={28} />
              </div>
              <h3 className="text-xs font-bold uppercase text-white mb-2 tracking-widest">Sinyal Teratasi?</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6 uppercase tracking-tight italic">
                Pastikan bantuan telah sampai ke <span className="text-slate-200 underline">{modalConfig.nama}</span>. Sinyal akan diarsipkan.
              </p>
              
              <div className="flex flex-col gap-2">
                <button onClick={handleResolve} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">Konfirmasi Selesai</button>
                <button onClick={() => setModalConfig({ isOpen: false, id: null, nama: "" })} className="w-full text-slate-500 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest">Batal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}