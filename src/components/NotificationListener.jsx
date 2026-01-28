import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where, 
  Timestamp 
} from "firebase/firestore";
import { HiOutlineBell, HiOutlineX, HiOutlineSpeakerphone } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function NotificationListener({ user }) {
  const [notification, setNotification] = useState(null);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Hanya dengarkan notifikasi yang dibuat SETELAH user login (mencegah notif lama muncul)
    const now = Timestamp.now();
    
    const q = query(
      collection(db, "notifications"),
      where("createdAt", ">", now),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setNotification({ id: snapshot.docs[0].id, ...data });
        triggerNotification();
      }
    });

    return () => unsubscribe();
  }, [user]);

  const triggerNotification = () => {
    setShow(true);
    // Mainkan suara notifikasi pendek jika diinginkan
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(e => console.log("Audio play blocked by browser"));

    // Otomatis tutup setelah 8 detik
    setTimeout(() => {
      setShow(false);
    }, 8000);
  };

  const handleAction = () => {
    if (notification?.targetPath) {
      navigate(notification.targetPath);
    }
    setShow(false);
  };

  if (!show || !notification) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-in slide-in-from-top-10 duration-500 italic">
      <div className="bg-white/95 backdrop-blur-xl border border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-5 flex items-center gap-5 relative overflow-hidden group">
        
        {/* DEKORASI BACKGROUND */}
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
        
        {/* ICON ANIMASI */}
        <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0 relative">
           <HiOutlineSpeakerphone size={24} className="animate-bounce" />
           <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
        </div>

        {/* TEXT CONTENT */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[8px] font-black uppercase text-blue-600 tracking-[0.2em]">Siaran Baru</span>
             <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Baru Saja</span>
          </div>
          <h4 className="text-xs font-black text-slate-800 uppercase leading-tight line-clamp-1 tracking-tight">
            {notification.body || "Ada pengumuman baru!"}
          </h4>
          <button 
            onClick={handleAction}
            className="mt-2 text-[9px] font-black text-blue-900 uppercase flex items-center gap-1 hover:gap-2 transition-all"
          >
            Baca Sekarang <span className="text-lg leading-none">→</span>
          </button>
        </div>

        {/* CLOSE BUTTON */}
        <button 
          onClick={() => setShow(false)}
          className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <HiOutlineX size={18} />
        </button>

        {/* PROGRESS TIMER BAR (Visual timer penutupan) */}
        <div className="absolute bottom-0 left-0 h-1 bg-blue-100 w-full">
           <div className="h-full bg-blue-600 animate-timer-bar"></div>
        </div>
      </div>

      <style>{`
        @keyframes timer-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-timer-bar {
          animation: timer-bar 8s linear forwards;
        }
      `}</style>
    </div>
  );
}