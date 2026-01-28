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
    // 1. Monitor laporan SOS yang masih 'active'
    const q = query(
      collection(db, "emergency_calls"),
      where("status", "==", "active"),
      orderBy("tgl_darurat", "desc")
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
      } else {
        stopAlertSound();
      }
    });

    return () => {
      unsubscribe();
      stopAlertSound();
    };
  }, []);

  const playAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser"));
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
      const docRef = doc(db, "emergency_calls", id);
      await updateDoc(docRef, {
        status: "resolved",
        tgl_selesai: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error resolving SOS:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24 text-white italic font-medium">
      {/* AUDIO ELEMENT (Gunakan link suara sirine mp3) */}
      <audio ref={audioRef} loop>
        <source src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* HEADER */}
      <div className={`pt-12 pb-16 px-8 rounded-b-[3.5rem] relative shadow-2xl transition-colors duration-500 ${alerts.length > 0 ? 'bg-red-600 animate-pulse' : 'bg-slate-800'}`}>
        <div className="flex items-center gap-5 relative z-10">
          <Link to="/pembina" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <img src="https://cdn-icons-png.flaticon.com/128/271/271220.png" className="w-4 h-4 invert" alt="back" />
          </Link>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Emergency Monitor</h1>
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-[0.3em]">
              {alerts.length > 0 ? "⚠️ DANGER: SINYAL AKTIF" : "System Secure"}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="px-6 -mt-8 relative z-20">
        {loading ? (
          <div className="text-center py-20 animate-pulse font-black uppercase text-xs">Connecting to SOS Server...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-800/50 rounded-[3rem] p-12 text-center border border-slate-700">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <img src="https://cdn-icons-png.flaticon.com/128/10629/10629607.png" className="w-8 h-8 invert" alt="secure" />
            </div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Tidak ada panggilan darurat</p>
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {alerts.map((item) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(220,38,38,0.3)] border-4 border-red-500 animate-bounce-subtle">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center animate-pulse">
                      <img src="https://cdn-icons-png.flaticon.com/128/595/595067.png" className="w-6 h-6" alt="sos" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase italic">{item.nama}</h3>
                      <p className="text-[10px] text-red-600 font-black uppercase tracking-tighter animate-pulse">Butuh Bantuan Segera!</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-400 font-black uppercase">Waktu</p>
                    <p className="text-[10px] text-slate-600 font-bold">{item.tgl_darurat?.toDate().toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* INFO LOKASI */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="https://cdn-icons-png.flaticon.com/128/1865/1865269.png" className="w-3 h-3" alt="loc" />
                    <p className="text-[9px] font-black text-slate-500 uppercase">Koordinat GPS:</p>
                  </div>
                  <p className="text-[10px] text-slate-800 font-bold italic">{item.lokasi?.lat}, {item.lokasi?.lng}</p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={item.lokasi?.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase text-center shadow-lg active:scale-95 transition-all"
                  >
                    Buka Peta
                  </a>
                  <button 
                    onClick={() => handleResolve(item.id, item.nama)}
                    className="bg-slate-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}