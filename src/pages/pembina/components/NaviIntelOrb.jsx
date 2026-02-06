import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NaviIntelOrb({ alerts, presentCount }) {
  // Logika Pesan Navi (Intelijen Berbasis Data Realtime)
  const intelReport = useMemo(() => {
    const sosCount = alerts?.sos || 0;
    const sfhCount = alerts?.sfh || 0; // Laporan SFH baru
    const skuCount = alerts?.sku || 0;
    const activeLaskar = presentCount || 0;

    // 1. PRIORITAS 1: SOS (Sangat Kritis)
    if (sosCount > 0) {
      return {
        text: `PERINGATAN TINGGI! ${sosCount} SINYAL SOS AKTIF TERDETEKSI. SEGERA LAKUKAN PENANGANAN DARURAT!`,
        color: "text-red-500",
        glow: "bg-red-500",
        status: "critical"
      };
    }

    // 2. PRIORITAS 2: SFH (Keamanan Anggota)
    if (sfhCount > 0) {
      return {
        text: `LOG INVESTIGASI: ${sfhCount} LAPORAN INSIDEN SFH MASUK KE MEJA REDAKSI. BUTUH TINDAK LANJUT SEGERA.`,
        color: "text-red-400",
        glow: "bg-red-600",
        status: "danger"
      };
    }

    // 3. PRIORITAS 3: Antrean SKU (Operasional)
    if (skuCount > 0) {
      return {
        text: `LAPORAN RUTIN: ${skuCount} BERKAS SKU MENUNGGU VALIDASI ANDA. STATUS: ANTREAN AKTIF.`,
        color: "text-amber-400",
        glow: "bg-amber-500",
        status: "warning"
      };
    }

    // 4. PRIORITAS 4: Aktivitas Lapangan
    if (activeLaskar > 0) {
      return {
        text: `STATUS OPTIMAL: ${activeLaskar} LASKAR TERDETEKSI AKTIF DALAM RADAR. SITUASI TERPANTAU KONDUSIF.`,
        color: "text-blue-400",
        glow: "bg-blue-500",
        status: "normal"
      };
    }

    // 5. KONDISI IDLE: Radar Bersih
    return {
      text: "RADAR BERSIH. BELUM ADA AKTIVITAS ANGGOTA YANG TERDETEKSI DALAM SISTEM.",
      color: "text-slate-500",
      glow: "bg-slate-700",
      status: "idle"
    };
  }, [alerts, presentCount]);

  return (
    <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
      {/* INDICATOR SIDEBAR */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-500 ${intelReport.glow}`} />

      {/* ORB ANIMATION SYSTEM */}
      <div className="relative shrink-0">
        {/* Pulsating Outer Glow */}
        <motion.div 
          key={`glow-${intelReport.status}`}
          animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-full blur-xl ${intelReport.glow}`}
        />
        
        {/* Core Intel Orb */}
        <div className="relative w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-black shadow-inner">
            {/* Rotating Tech Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className={`absolute inset-0 border-x border-t border-transparent rounded-full opacity-40 ${intelReport.glow.replace('bg-', 'border-')}`}
            />
            {/* Central Heartbeat */}
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-2.5 h-2.5 rounded-full ${intelReport.glow} shadow-[0_0_12px_rgba(255,255,255,0.4)]`} 
            />
        </div>
      </div>

      {/* INTELLIGENCE TEXT DATA */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
            <span className="w-1 h-1 bg-slate-500 rounded-full animate-pulse" />
            <p className="text-[7px] font-black uppercase text-slate-500 tracking-[0.2em] italic">Intelligence Uplink: NAVI</p>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={intelReport.text}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            className={`text-[10px] font-bold uppercase leading-tight tracking-wide italic ${intelReport.color}`}
          >
            "{intelReport.text}"
          </motion.p>
        </AnimatePresence>
      </div>

      {/* SCANLINE EFFECT DECORATION */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}