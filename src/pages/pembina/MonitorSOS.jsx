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
  orderBy
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function MonitorSOS() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // 1. Monitor koleksi 'sos_signals' (Sesuai dengan yang dikirim Navbar)
    const q = query(
      collection(db, "sos_signals"),
      where("status", "==", "active"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts(data);
      setLoading(false);

      // 2. Mainkan suara sirine jika ada alert baru masuk
      if (data.length > 0) {
        playAlertSound();
        // Trigger getaran pada device pembina jika didukung
        if (window.navigator.vibrate) window.navigator.vibrate([500, 300, 500]);
      } else {
        stopAlertSound();
      }
    }, (error) => {
      console.error("Firestore Listen Error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      stopAlertSound();
    };
  }, []);

  const playAlertSound = () => {
    if (audioRef.current) {
      // Kita set volume ke 1.0 (Maksimal) karena ini darurat
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(e => console.log("Audio play blocked: Pembina harus interaksi dengan layar dulu."));
    }
  };

  const stopAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleResolve = async (id, nama) => {
    if (!window.confirm(`Tandai keadaan darurat ${nama} sebagai 'Selesai Ditangani'?`)) return;

    try {
      const docRef = doc(db, "sos_signals", id);
      await updateDoc(docRef, {
        status: "resolved",
        resolvedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error resolving SOS:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24 text-white italic font-medium">
      {/* AUDIO ELEMENT - Sirine High Pitch */}
      <audio ref={audioRef} loop>
        <source src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* HEADER DENGAN FLASHING BACKGROUND */}
      <div className={`pt-12 pb-16 px-8 rounded-b-[3.5rem] relative shadow-2xl transition-all duration-500 ${alerts.length > 0 ? 'bg-red-600 animate-pulse-fast shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'bg-slate-800'}`}>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-5">
            <Link to="/pembina" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
               <img src="https://cdn-icons-png.flaticon.com/128/271/271220.png" className="w-4 h-4 invert rotate-180" alt="back" />
            </Link>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter leading-tight">Emergency Monitor</h1>
              <p className="text-[9px] text-white/60 font-bold uppercase tracking-[0.3em]">
                {alerts.length > 0 ? "⚠️ DANGER: SINYAL TERDETEKSI" : "System Secure"}
              </p>
            </div>
          </div>
          {alerts.length > 0 && (
            <div className="bg-white text-red-600 px-4 py-1 rounded-full text-[10px] font-black animate-bounce">
              {alerts.length} ALERT
            </div>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="px-6 -mt-8 relative z-20">
        {loading ? (
          <div className="text-center py-20 animate-pulse font-black uppercase text-xs text-red-500">
            Establishing Secure Connection...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-800/50 rounded-[3rem] p-12 text-center border border-slate-700">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <img src="https://cdn-icons-png.flaticon.com/128/10629/10629607.png" className="w-8 h-8 invert" alt="secure" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Situasi Kondusif</p>
          </div>
        ) : (
          <div className="space-y-6 pb-10">
            {alerts.map((item) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] p-6 shadow-[0_25px_50px_rgba(220,38,38,0.4)] border-4 border-red-500 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center animate-pulse shadow-inner">
                      <img src="https://cdn-icons-png.flaticon.com/128/595/595067.png" className="w-7 h-7" alt="sos" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase italic leading-none">{item.nama}</h3>
                      <p className="text-[10px] text-red-600 font-black uppercase tracking-tighter mt-1">{item.kontak || "No Contact"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-red-600 text-white text-[7px] px-2 py-0.5 rounded-full font-black uppercase mb-1 inline-block">Urgent</span>
                    <p className="text-[10px] text-slate-600 font-bold">{item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* INFO LOKASI TERINTEGRASI */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="https://cdn-icons-png.flaticon.com/128/1865/1865269.png" className="w-3 h-3" alt="loc" />
                    <p className="text-[9px] font-black text-slate-500 uppercase">GPS Location:</p>
                  </div>
                  <p className="text-[11px] text-slate-800 font-bold italic tracking-tight">
                    {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <a 
                    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase text-center shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                  >
                    🚀 Buka Google Maps
                  </a>
                  <button 
                    onClick={() => handleResolve(item.id, item.nama)}
                    className="bg-slate-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all"
                  >
                    ✅ Selesai Ditangani
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-fast {
          0%, 100% { background-color: rgb(220 38 38); }
          50% { background-color: rgb(153 27 27); }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}