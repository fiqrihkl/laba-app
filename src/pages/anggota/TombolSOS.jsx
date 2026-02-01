import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiLightningBolt, 
  HiOutlineExclamation, 
  HiOutlineShieldCheck, 
  HiOutlineXCircle,
  HiOutlineCheckCircle
} from "react-icons/hi";

export default function TombolSOS({ userProfile }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // State untuk Custom Notification
  const [notification, setNotification] = useState({ 
    show: false, 
    type: "", 
    message: "" 
  });

  // --- FUNGSI EFEK SUARA SINTETIS (DING) ---
  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      // Nada "Ding" (Frekuensi tinggi ke rendah sedikit)
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio context not supported");
    }
  };

  // Fungsi untuk memicu notifikasi custom
  const triggerNotify = (type, message) => {
    setNotification({ show: true, type, message });

    // Putar suara jika sukses
    if (type === "success") {
      playSuccessSound();
    }

    // Otomatis tutup notifikasi setelah 4 detik
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 4000);
  };

  // --- EFEK GETARAN OTOMATIS SAAT MODAL DIBUKA ---
  useEffect(() => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const handleSOS = async () => {
    setLoading(true);
    setShowConfirm(false);

    // Ambil Lokasi GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Memperbaiki URL Google Maps agar valid
          const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          try {
            // Simpan ke Firestore (Koleksi sos_signals)
            await addDoc(collection(db, "sos_signals"), {
              uid: auth.currentUser.uid,
              nama: userProfile?.nama || "Anggota Tanpa Nama",
              kontak: userProfile?.telepon || "-",
              latitude: lat,
              longitude: lng,
              mapUrl: mapUrl,
              status: "active",
              timestamp: serverTimestamp(),
            });

            // Haptic Feedback Sukses
            if (window.navigator.vibrate) {
              window.navigator.vibrate([100, 30, 100, 30, 500]);
            }

            triggerNotify("success", "SINYAL SOS TERKIRIM! Tetap tenang, sinyal Anda sudah masuk ke radar Pembina.");
          } catch (error) {
            console.error("Error sending SOS:", error);
            triggerNotify("error", "Gagal mengirim sinyal: " + error.message);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          triggerNotify("error", "Gagal mendapatkan lokasi. Pastikan izin GPS diberikan.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLoading(false);
      triggerNotify("error", "Browser/HP Anda tidak mendukung GPS.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] shadow-3xl border border-white/10 relative overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/10 blur-[50px] rounded-full"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full"></div>

      <div className="text-center mb-10 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
            <HiOutlineExclamation className="text-red-500 animate-bounce" size={20} />
            <h2 className="text-white font-black uppercase text-sm tracking-[0.2em] italic">Emergency Radar</h2>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Gunakan hanya saat dalam <br /> bahaya fisik/darurat
        </p>
      </div>

      {/* SOS BUTTON CONTAINER */}
      <div className="relative flex items-center justify-center">
        {!loading && (
          <>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-32 h-32 bg-red-600/20 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute w-32 h-32 bg-red-600/10 rounded-full"
            />
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className={`relative z-10 w-36 h-36 rounded-full border-[6px] flex flex-col items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(220,38,38,0.4)] ${
            loading 
              ? "bg-slate-800 border-slate-700 opacity-50" 
              : "bg-gradient-to-b from-red-500 to-red-700 border-white/20"
          }`}
        >
          {loading ? (
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div className="flex flex-col items-center">
              <HiLightningBolt size={40} className="text-white drop-shadow-lg" />
              <span className="text-2xl font-black text-white italic tracking-tighter mt-1">SOS</span>
              <span className="text-[8px] font-black text-red-200 uppercase tracking-widest">Transmit</span>
            </div>
          )}
        </motion.button>
      </div>

      <div className="mt-10 relative z-10">
        <div className="bg-red-600/10 px-4 py-2 rounded-full border border-red-600/20">
            <p className="text-[8px] text-red-500 font-black uppercase tracking-[0.1em] animate-pulse text-center">
                📡 Broadcasting location to all pembina...
            </p>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border-2 border-red-500/50 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <HiOutlineExclamation className="text-red-500 animate-pulse" size={40} />
              </div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-3">Konfirmasi Darurat</h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8">
                KIRIM SINYAL DARURAT SEKARANG?<br/>
                <span className="text-red-400 text-[10px]">Lokasi Anda akan langsung terpantau radar Pembina Laskar Bahari secara realtime!</span>
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleSOS} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  <HiOutlineShieldCheck size={18}/> YA, KIRIM SEKARANG
                </button>
                <button onClick={() => setShowConfirm(false)} className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                  <HiOutlineXCircle size={18}/> BATALKAN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM CUSTOM NOTIFICATION ALERT */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[4000] flex justify-center px-6 pointer-events-none"
          >
            <div className={`pointer-events-auto max-w-md w-full backdrop-blur-xl border-b-4 flex items-center gap-4 p-5 rounded-3xl shadow-2xl ${
              notification.type === "success" 
              ? "bg-green-500/20 border-green-500 shadow-green-500/20" 
              : "bg-red-500/20 border-red-500 shadow-red-500/20"
            }`}>
              <div className={`p-2 rounded-full ${notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                {notification.type === "success" ? <HiOutlineCheckCircle size={24}/> : <HiOutlineExclamation size={24}/>}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">
                  {notification.type === "success" ? "System Success" : "System Error"}
                </p>
                <p className="text-xs font-bold text-white leading-tight italic">
                  {notification.message}
                </p>
              </div>
              <button 
                onClick={() => setNotification({ ...notification, show: false })}
                className="text-white/30 hover:text-white"
              >
                <HiOutlineXCircle size={20}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}