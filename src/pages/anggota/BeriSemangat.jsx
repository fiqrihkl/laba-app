import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { HiLightningBolt } from "react-icons/hi";

const BeriSemangat = ({ userData }) => {
  const [isOnCooldown, setIsOnCooldown] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (userData?.lastEnergyUpdate) {
        const lastUpdate = userData.lastEnergyUpdate.toDate();
        const now = new Date();
        const diffInSeconds = Math.floor((now - lastUpdate) / 1000);
        const waitTime = 1 * 60 * 60; 

        setIsOnCooldown(diffInSeconds < waitTime);
      } else {
        setIsOnCooldown(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userData]);

  const handleRecharge = async () => {
    if (isOnCooldown || isProcessing || userData?.energy >= 100) return;

    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", userData.docId || userData.uid || userData.id);
      const currentEnergy = userData?.energy || 0;
      const newEnergy = Math.min(currentEnergy + 25, 100);

      await updateDoc(userRef, {
        energy: newEnergy,
        lastEnergyUpdate: serverTimestamp() 
      });

    } catch (error) {
      console.error("Gagal memberi semangat:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const shouldShow = userData?.energy < 100 && !isOnCooldown;

  return (
    /* layout: Menjaga container tetap sinkron saat elemen di dalamnya hilang */
    <motion.div layout className="flex flex-col items-center my-4">
      <AnimatePresence mode="popLayout">
        {shouldShow && (
          <motion.div
            key="button-semangat"
            layout // Properti kunci agar transisi smooth
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.2, 0.5, 0.2] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-orange-500/40 blur-2xl rounded-full"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecharge}
              disabled={isProcessing}
              className="relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-2xl border border-white/10 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <HiLightningBolt size={18} className={isProcessing ? "animate-spin" : "animate-bounce"} />
              {isProcessing ? "SINKRONISASI..." : "BERI RANSUM SEMANGAT"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BeriSemangat;