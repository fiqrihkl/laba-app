import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VakiAvatar = ({ level = 1, userData, className, isEvolving = false }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [currentDialog, setCurrentDialog] = useState("");
  const [clickCount, setClickCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const clickTimer = useRef(null);
  const isFirstRender = useRef(true); // Untuk mendeteksi perubahan level

  // --- LOGIKA JENIS KELAMIN ---
  const gender = userData?.jenisKelamin || "Laki-laki";
  
  const energy = (userData?.energy !== undefined && userData?.energy !== null) 
    ? userData.energy 
    : 100;
  const isTired = energy < 30;

  // --- AUDIO LOGIC ---
  const playSound = (type) => {
    try {
      let fileName = "";
      if (type === "click") fileName = "/sounds/click.mp3";
      if (type === "collect") fileName = "/sounds/collect.mp3";
      if (type === "whistle") fileName = "/sounds/whistle.mp3";

      const audio = new Audio(fileName);
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.log("Audio play blocked by browser policy");
    }
  };

  // Trigger suara Collect saat level berubah (Evolusi)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    playSound("collect");
  }, [level]);

  // Dialog Lists
  const intimateDialogs = [
    "Halo! Sudah minum air putih hari ini? ✨",
    "Gimana harimu di sekolah? Istirahat bareng aku yuk.",
    "Aku bangga banget liat progresmu. Konsisten ya!",
    "Lagi sedih ya? Sini cerita, aku bakal dengerin kok.",
    "Jangan begadang terus, nanti pas Pramuka ngantuk lho!",
    "Kamu hebat hari ini! Apresiasi diri sendiri dulu yuk.",
    "Sudah makan belum? Jangan sampai telat makan ya.",
    "Ingat, kamu berharga. Tetap semangat jadi Laskar Bahari!",
    "Makasih ya sudah mampir. Kamu moodbooster aku banget!",
    "Ada misi sulit? Kabari aku ya, kita selesaikan bareng."
  ];

  const tiredDialogs = [
    "Maafin aku ya lagi lemes, tapi aku tetep sayang kok...",
    "Aku butuh energi, tapi liat kamu login aja aku seneng.",
    "Lagi low-batt nih, temenin aku rebahan sebentar ya?",
    "Maaf ya kalau hari ini aku nggak seceria biasanya..."
  ];

  const handleMaskotClick = () => {
    if (isSpinning) return;

    playSound("click");

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      setClickCount(0);
    }, 3000);

    if (newCount >= 7) {
      triggerEasterEgg();
    } else {
      if (showDialog) return;
      const source = isTired ? tiredDialogs : intimateDialogs;
      const randomText = source[Math.floor(Math.random() * source.length)];
      
      setCurrentDialog(randomText);
      setShowDialog(true);

      setTimeout(() => {
        setShowDialog(false);
      }, 5000); 
    }
  };

  const triggerEasterEgg = () => {
    setIsSpinning(true);
    setClickCount(0);
    setCurrentDialog("Waaah! Kamu gemes banget sih klik aku terus! 😆 ❤️");
    setShowDialog(true);
    playSound("whistle");

    setTimeout(() => {
      setIsSpinning(false);
      setShowDialog(false);
    }, 8000);
  };

  const getAvatarImage = () => {
    const folder = gender === "Perempuan" ? "putri" : "putra";
    if (level >= 30) return `/assets/avatars/${folder}/lvl30.png`;
    if (level >= 20) return `/assets/avatars/${folder}/lvl20.png`;
    if (level >= 15) return `/assets/avatars/${folder}/lvl15.png`;
    if (level >= 10) return `/assets/avatars/${folder}/lvl10.png`;
    if (level >= 5)  return `/assets/avatars/${folder}/lvl5.png`;
    if (level >= 2)  return `/assets/avatars/${folder}/lvl2.png`;
    return `/assets/avatars/${folder}/lvl1.png`;
  };

  const isGolden = level >= 30;

  return (
    <div className={`relative flex items-center justify-center cursor-pointer ${className}`}>
      {/* FLASH EVOLUTION */}
      <AnimatePresence>
        {isEvolving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 2.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white rounded-full blur-[100px] z-[5]"
          />
        )}
      </AnimatePresence>

      {/* SPEECH BUBBLE (Posisi diperbaiki agar tidak tertindis) */}
      <div className="absolute inset-0 flex justify-center pointer-events-none z-[110]">
        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -130 }} // Y negatif lebih tinggi agar di atas kepala
              exit={{ opacity: 0, scale: 0.8, y: 0 }}
              className="absolute flex flex-col items-center"
            >
              <div className={`
                px-5 py-4 rounded-[2rem] shadow-2xl backdrop-blur-xl border border-white/20 text-center 
                w-[200px] relative pointer-events-auto
                ${isSpinning ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : "bg-white/95 text-slate-800"}
              `}>
                <p className="text-[11px] font-bold italic leading-relaxed tracking-tight">
                  {currentDialog}
                </p>
                
                {/* Tail / Ekor Bubble */}
                <div className={`
                  absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 
                  border-r border-b border-white/10
                  ${isSpinning ? "bg-orange-500" : "bg-white/95"}
                `}></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MASKOT IMAGE */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${gender}-${level}-${isTired}`} 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: isEvolving ? [1, 1.2, 1] : 1,
            rotate: isSpinning ? 360 : 0,
            filter: isTired ? "grayscale(1) contrast(0.7) brightness(0.8)" : "none"
          }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMaskotClick}
          className="relative z-10 w-full h-full flex items-center justify-center"
        >
          <motion.img 
            src={getAvatarImage()} 
            alt="Mascot" 
            className="w-full h-full object-contain drop-shadow-2xl"
            animate={isTired ? { y: [0, 5, 0] } : { y: [0, -12, 0] }}
            transition={{ duration: isTired ? 6 : 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* AURA & SHADOW */}
      {isGolden && !isTired && (
        <motion.div className="absolute inset-0 bg-yellow-400/20 blur-[80px] rounded-full -z-10" animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.3, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      )}
      <motion.div className="absolute bottom-4 w-2/3 h-5 bg-black/40 rounded-[100%] blur-2xl -z-10" animate={isTired ? { scale: [1, 1.05, 1] } : { scale: [1, 1.25, 1] }} transition={{ duration: isTired ? 6 : 4, repeat: Infinity }} />
    </div>
  );
};

export default VakiAvatar;