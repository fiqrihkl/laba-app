import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VAKI AVATAR - Living Mascot Edition
 * Developer: Fiqri Haikal (Teknik Informatika)
 * Note: Tanpa bonus SKU, fokus pada manajemen energi & emosi.
 */

const VakiAvatar = ({ level = 1, userData, className, isEvolving = false }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [currentDialog, setCurrentDialog] = useState("");
  const isFirstRender = useRef(true);

  // --- LOGIKA DATA USER ---
  const gender = userData?.jenisKelamin || "Laki-laki";
  const energy = userData?.energy ?? 100;

  // Status visual berdasarkan "nyawa" maskot
  const isCritical = energy < 20; 
  const isTired = energy < 50;   

  // --- AUDIO LOGIC ---
  const playSound = (type) => {
    try {
      const fileName = {
        click: "/sounds/click.mp3",
        evolve: "/sounds/collect.mp3",
        low: "/sounds/sad_notif.mp3"
      }[type];

      if (fileName) {
        const audio = new Audio(fileName);
        audio.volume = 0.4;
        audio.play();
      }
    } catch (error) {
      console.log("Audio play blocked");
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    playSound("evolve");
  }, [level]);

  // --- HANDLING INTERACTION ---
  const handleMaskotClick = () => {
    playSound("click");
    if (showDialog) return;

    let speech = "";
    if (isCritical) {
      speech = "Navigator... radar aku hampir mati... tolong isi energi aku di pangkalan... 🤒";
    } else if (isTired) {
      speech = "Huft, aku butuh asupan logistik nih biar bisa temani kamu navigasi lagi. 🪫";
    } else {
      // Mengambil mood dari AI Qwen (Tanpa imbalan poin SKU)
      speech = userData?.aiMood || "Radar aktif! Siap berlayar menaklukkan ujian SKU hari ini? ⚓";
    }
    
    setCurrentDialog(speech);
    setShowDialog(true);

    setTimeout(() => setShowDialog(false), 5000); 
  };

  const getAvatarImage = () => {
    const folder = gender === "Perempuan" ? "putri" : "putra";
    const lvlKey = level >= 30 ? 30 : level >= 20 ? 20 : level >= 15 ? 15 : level >= 10 ? 10 : level >= 5 ? 5 : level >= 2 ? 2 : 1;
    return `/assets/avatars/${folder}/lvl${lvlKey}.png`;
  };

  return (
    <div className={`relative flex items-center justify-center cursor-pointer ${className}`}>
      
      {/* EFFECT EVOLUSI */}
      <AnimatePresence>
        {isEvolving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 2.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/30 rounded-full blur-[100px] z-[5]"
          />
        )}
      </AnimatePresence>

      {/* SPEECH BUBBLE */}
      <div className="absolute inset-0 flex justify-center pointer-events-none z-[110]">
        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -130 }} 
              exit={{ opacity: 0, scale: 0.8, y: 0 }}
              className="absolute flex flex-col items-center"
            >
              <div className={`
                px-5 py-4 rounded-[2.5rem] shadow-2xl backdrop-blur-xl border border-white/20 text-center 
                w-[220px] relative pointer-events-auto
                ${isCritical ? "bg-red-600/90 text-white" : "bg-white/95 text-slate-800"}
              `}>
                <p className="text-[10px] font-bold italic leading-relaxed tracking-tight uppercase">
                  {currentDialog}
                </p>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 ${isCritical ? "bg-red-600/90" : "bg-white/95"}`}></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MASKOT IMAGE */}
      <motion.div
        key={`${gender}-${level}-${energy}`} 
        animate={{ 
          filter: isCritical 
            ? "grayscale(1) brightness(0.6) contrast(1.2)" 
            : isTired 
              ? "grayscale(0.6) brightness(0.8)" 
              : "none"
        }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMaskotClick}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <motion.img 
          src={getAvatarImage()} 
          alt="Mascot" 
          className="w-full h-full object-contain drop-shadow-2xl font-bold"
          animate={isCritical ? { y: [0, 4, 0] } : { y: [0, -12, 0] }}
          transition={{ duration: isCritical ? 6 : 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* SHADOW */}
      <motion.div 
        className="absolute bottom-4 w-2/3 h-5 bg-black/40 rounded-[100%] blur-2xl -z-10" 
        animate={isCritical ? { scale: [1, 1.05, 1], opacity: 0.6 } : { scale: [1, 1.25, 1], opacity: 0.4 }} 
        transition={{ duration: isCritical ? 6 : 4, repeat: Infinity }} 
      />
    </div>
  );
};

export default VakiAvatar;