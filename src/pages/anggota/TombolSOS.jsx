import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { HiLightningBolt, HiOutlineExclamation } from "react-icons/hi";

export default function TombolSOS({ userProfile }) {
  const [loading, setLoading] = useState(false);

  // --- EFEK GETARAN OTOMATIS SAAT MODAL DIBUKA ---
  useEffect(() => {
    // Memberikan getaran peringatan (dua getaran pendek) saat modal pertama kali muncul
    if (window.navigator.vibrate) {
      window.navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const handleSOS = async () => {
    // 1. Konfirmasi sederhana (mencegah salah pencet)
    const yakin = window.confirm("KIRIM SINYAL DARURAT SEKARANG? Lokasi Anda akan terpantau radar Pembina!");
    if (!yakin) return;

    setLoading(true);

    // 2. Ambil Lokasi GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          try {
            // 3. Simpan ke Firestore (Koleksi sos_signals agar sinkron dengan MonitorSOS)
            await addDoc(collection(db, "sos_signals"), {
              uid: auth.currentUser.uid,
              nama: userProfile?.nama || "Anggota Tanpa Nama",
              kontak: userProfile?.telepon || "-",
              latitude: lat,
              longitude: lng,
              status: "active",
              timestamp: serverTimestamp(),
            });

            // Haptic Feedback Sukses (Getaran panjang penegasan)
            if (window.navigator.vibrate) {
              window.navigator.vibrate([100, 30, 100, 30, 500]);
            }

            alert("SINYAL SOS TERKIRIM! Tetap tenang, sinyal Anda sudah masuk ke radar Pembina.");
          } catch (error) {
            alert("Gagal mengirim sinyal: " + error.message);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          alert("Gagal mendapatkan lokasi. Pastikan izin GPS diberikan.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLoading(false);
      alert("Browser/HP Anda tidak mendukung GPS.");
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
        {/* Pulse Animations */}
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
          onClick={handleSOS}
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

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}