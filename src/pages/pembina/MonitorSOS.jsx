import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase"; 
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
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineCheckCircle, HiOutlineExclamation } from "react-icons/hi";

export default function MonitorSOS() {
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);
  const prevAlertsCount = useRef(0);

  // 1. Auto-Request Permission & Global Interaction Listener
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

  // 2. Monitoring SOS Active & History (Realtime)
  useEffect(() => {
    setLoading(true);

    // Query untuk SOS Aktif
    const qActive = query(
      collection(db, "sos_signals"),
      where("status", "==", "active"),
      orderBy("timestamp", "desc")
    );

    // Query untuk Riwayat SOS
    const qHistory = query(
      collection(db, "sos_signals"),
      where("status", "==", "resolved"),
      orderBy("resolvedAt", "desc"),
      limit(10)
    );

    // Listener Sinyal Aktif
    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Trigger Notifikasi Lokal
      if (data.length > prevAlertsCount.current && data.length > 0) {
        const newest = data[0];
        if (Notification.permission === "granted") {
          new Notification("⚠️ SINYAL SOS MASUK!", {
            body: `Anggota: ${newest.nama} butuh bantuan segera!`,
            icon: "https://cdn-icons-png.flaticon.com/128/595/595067.png",
          });
        }
      }

      prevAlertsCount.current = data.length;
      setAlerts(data);
      // Mematikan loading hanya jika data berhasil di-fetch
      setLoading(false);

      // Logika Audio
      if (data.length > 0 && hasInteracted) {
        audioRef.current?.play().catch(() => console.log("Menunggu interaksi user..."));
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    }, (error) => {
      console.error("Error Fetch Active:", error);
      setLoading(false); // Tetap matikan loading jika error (biasanya masalah Index)
    });

    // Listener Riwayat
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const histData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(histData);
    }, (error) => {
      console.error("Error Fetch History:", error);
    });

    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [hasInteracted]);

  const handleResolve = async (id, nama) => {
    try {
      const docRef = doc(db, "sos_signals", id);
      await updateDoc(docRef, {
        status: "resolved",
        resolvedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error resolving:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-24 text-white italic font-medium overflow-x-hidden">
      
      {/* AUDIO ELEMENT */}
      <audio ref={audioRef} loop preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* HEADER TACTICAL */}
      <div className={`pt-12 pb-20 px-8 rounded-b-[4rem] relative shadow-2xl transition-all duration-700 ${alerts.length > 0 ? 'bg-red-600 animate-pulse-fast shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'bg-slate-800'}`}>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-5">
            <Link to="/pembina" className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all">
                <img src="https://cdn-icons-png.flaticon.com/128/271/271220.png" className="w-5 h-5 invert rotate-180" alt="back" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-tight italic">SOS Monitoring</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasInteracted ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-bounce'}`} />
                <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">
                  {hasInteracted ? "Radar Online" : "Klik layar untuk sinkronisasi suara"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA: ACTIVE RADAR */}
      <div className="px-6 -mt-10 relative z-20">
        <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 ml-4 flex items-center gap-2">
          <HiOutlineExclamation size={14} /> Sinyal Aktif Terdeteksi
        </h2>
        
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4 bg-slate-800/20 rounded-[3rem] border border-white/5">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mencari Sinyal...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[3rem] p-12 text-center border border-white/5 mb-10 shadow-inner">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic leading-relaxed">Situasi Kondusif <br/> Radar Standby</p>
          </div>
        ) : (
          <div className="space-y-6 mb-12">
            <AnimatePresence>
              {alerts.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white rounded-[3rem] p-7 shadow-[0_30px_60px_rgba(220,38,38,0.4)] border-[6px] border-red-500 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6 text-slate-900">
                    <div>
                      <h3 className="text-lg font-black uppercase italic leading-none">{item.nama}</h3>
                      <p className="text-xs text-red-600 font-black mt-1">{item.kontak || "No Contact"}</p>
                    </div>
                    <div className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-black animate-pulse">SOS</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="bg-blue-600 text-white py-5 rounded-[1.8rem] text-[10px] font-black uppercase text-center active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <HiOutlineLocationMarker size={16}/> Buka Peta
                    </a>
                    <button 
                      onClick={() => handleResolve(item.id, item.nama)}
                      className="bg-slate-900 text-white py-5 rounded-[1.8rem] text-[10px] font-black uppercase active:scale-95 transition-all shadow-xl"
                    >
                      <HiOutlineCheckCircle size={16} className="inline mr-1"/> Selesai
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* --- LOG RIWAYAT SOS --- */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 ml-4 flex items-center gap-2 italic">
            <HiOutlineClock size={14} /> Riwayat Penanganan (Terbaru)
          </h2>
          
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-[10px] text-slate-600 font-bold uppercase italic py-10">Belum ada riwayat</p>
            ) : (
              history.map((log) => (
                <div key={log.id} className="bg-slate-800/30 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 border border-green-500/20">
                      <HiOutlineCheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase italic text-slate-200">{log.nama}</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">
                        Tertangani: {log.resolvedAt?.toDate().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-400 font-bold uppercase italic opacity-50">#RESOLVED</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-fast {
          0%, 100% { background-color: #dc2626; }
          50% { background-color: #7f1d1d; }
        }
        .animate-pulse-fast { animation: pulse-fast 0.6s infinite; }
      `}</style>
    </div>
  );
}