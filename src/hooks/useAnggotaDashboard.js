import { useState, useEffect, useMemo, useRef } from "react";
import { db, auth } from "../firebase"; // Sesuaikan path jika berbeda
import {
  doc, onSnapshot, collection, query, updateDoc, increment, arrayUnion, where, limit, orderBy
} from "firebase/firestore";
import { useModal } from "../context/ModalContext";
import { calculateBadges } from "../utils/badgeLogic";
import { getNaviResponse } from "../utils/naviAi";
import { requestNotificationPermission, sendPushNotification } from "../utils/pushNotification";
import { getRandomNaviPrompt } from "../utils/naviPrompts";

export const useAnggotaDashboard = () => {
  const [isEvolving, setIsEvolving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [naviGreeting, setNaviGreeting] = useState("Menghubungkan Radar...");
  const [announcements, setAnnouncements] = useState([]);
  const [masterSKU, setMasterSKU] = useState([]);
  const [skuProgressStats, setSkuProgressStats] = useState({
    ramu: 0, rakit: 0, terap: 0,
    totalRamu: 0, totalRakit: 0, totalTerap: 0,
    overallProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [rawVerifiedSkus, setRawVerifiedSkus] = useState([]);
  
  const isInitialized = useRef(false);
  const greetingFetched = useRef(false);
  const lastEnergyNotif = useRef(0);
  const welcomeSoundPlayed = useRef(false);

  const { showModal } = useModal();

  // --- SOUND SYSTEM ---
  const playSound = (path, volume = 0.5) => {
    try {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch(e => console.log("Autoplay prevented:", e));
    } catch (error) { console.log("Audio error:", error); }
  };

  const playCollectSound = () => playSound("/sounds/collect.mp3");
  const playLevelUpSound = () => playSound("/sounds/levelup.mp3", 0.7);
  const playWelcomeSound = () => playSound("/sounds/welcome.mp3", 0.4);

  // --- LOGIKA LENCANA ---
  const userBadges = useMemo(() => {
    if (!userData || masterSKU.length === 0) return null;
    return calculateBadges(rawVerifiedSkus, userData, masterSKU);
  }, [rawVerifiedSkus, userData, masterSKU]);

  // --- UPDATE STATISTIK SKU ---
  useEffect(() => {
    if (userBadges) {
      const totalDone = Object.values(userBadges).reduce((acc, b) => acc + (b.currentCount || 0), 0);
      const totalTarget = Object.values(userBadges).reduce((acc, b) => acc + (b.total || 0), 0);
      const percentage = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;
      setSkuProgressStats(prev => ({ ...prev, overallProgress: percentage }));
    }
  }, [userBadges]);

  // --- LOGIKA PASSIVE DECAY (Penurunan Energi Otomatis) ---
  useEffect(() => {
    const handlePassiveDecay = async () => {
      if (!userData || !userData.docId) return;

      // Ambil waktu update terakhir dari Firestore, atau gunakan login hari ini sebagai cadangan
      const lastUpdate = userData.lastEnergyUpdate?.toDate() || 
                         (userData.lastDailyLogin ? new Date(userData.lastDailyLogin) : new Date());
      const now = new Date();
      const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);
      
      // --- PENGATURAN LAJU PENURUNAN ---
      const decayRate = 5;       // Kurangi 5 poin energi
      const intervalHours = 6;   // Setiap 6 jam sekali
      // ---------------------------------

      const intervalsPassed = Math.floor(diffInHours / intervalHours);

      if (intervalsPassed > 0) {
        const currentEnergy = userData.energy || 100;
        const reduction = intervalsPassed * decayRate;
        const newEnergy = Math.max(currentEnergy - reduction, 5); // Minimal sisa 5 energi
        
        if (newEnergy < currentEnergy) {
          try {
            await updateDoc(doc(db, "users", userData.docId), { 
              energy: newEnergy,
              lastEnergyUpdate: now // Simpan waktu update agar tidak berkurang terus saat refresh
            });
            console.log(`[ENERGY] Passive decay applied: -${reduction} energy`);
          } catch (e) {
            console.error("Error applying energy decay:", e);
          }
        }
      }
    };

    if (userData) handlePassiveDecay();
  }, [userData?.docId]); // Pantau ID dokumen user

  // --- HANDLER REWARDS & LEVEL UP ---
  const handleEnergyAndStreak = async (docId, data, setShowDailyBonus) => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastLoginStr = data.lastDailyLogin;
    const currentEnergy = data.energy !== undefined ? data.energy : 100;
    let updates = {};

    if (data.energy === undefined) updates.energy = 100;

    if (lastLoginStr !== today) {
      updates.energy = Math.min(100, currentEnergy + 40);
      updates.lastDailyLogin = today;
      updates.points = increment(100);
      const lastLoginDate = lastLoginStr ? new Date(lastLoginStr) : new Date();
      const now = new Date();
      const diffInHours = Math.abs(now - lastLoginDate) / 36e5;
      updates.streakCount = (diffInHours <= 48) ? (data.streakCount || 0) + 1 : 1;
      updates.attendanceLog = arrayUnion({
        timestamp: new Date().toISOString(),
        activity: "Daily Scout Reward: Energy +40 & XP +100",
        pointsEarned: 100,
        type: "DAILY_BONUS"
      });
      
      setShowDailyBonus(true);
      playCollectSound();
    }

    if (Object.keys(updates).length > 0) {
      try { await updateDoc(doc(db, "users", docId), updates); } 
      catch (e) { console.error(e); }
    }
  };

  const checkLevelUp = async (docId, points, currentLevel) => {
    if (points >= 2000) {
      try {
        const nextLevel = currentLevel + 1;
        setIsEvolving(true);
        playLevelUpSound();
        if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100, 50, 300]);

        await updateDoc(doc(db, "users", docId), {
          level: nextLevel, points: points - 2000, energy: 100,
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: `Evolution Complete: Lv.${nextLevel}!`,
            pointsEarned: 0, type: "LEVEL_UP"
          }),
        });

        sendPushNotification("🎊 Level Up!", `Kamu mencapai Level ${nextLevel}!`);
        
        setTimeout(() => {
          setIsEvolving(false);
          showModal(
            "EVOLUTION COMPLETE! 🎊", 
            `Selamat! Kamu naik ke Level ${nextLevel}. Energi pulih 100% dan statusmu meningkat!`, 
            "success"
          );
        }, 1500);
      } catch (error) { console.error(error); }
    }
  };

  // --- FETCH DATA (FIRESTORE) ---
  const initializeListeners = (setShowDailyBonus) => {
    requestNotificationPermission();
    const user = auth.currentUser;
    if (!user) return () => {};

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({ ...data, docId: docSnap.id });
        
        if (!isInitialized.current) {
          handleEnergyAndStreak(docSnap.id, data, setShowDailyBonus);
          if (!welcomeSoundPlayed.current) {
            playWelcomeSound();
            welcomeSoundPlayed.current = true;
          }
          setTimeout(() => { isInitialized.current = true; }, 1000);
          setLoading(false);
        } else {
          checkLevelUp(docSnap.id, data.points || 0, data.level || 1);
        }
      }
    });

    const unsubAnnounce = onSnapshot(
      query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5)), 
      (snap) => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubMaster = onSnapshot(collection(db, "master_sku"), (snap) => {
      const list = [];
      const totals = { ramu: 0, rakit: 0, terap: 0 };
      snap.docs.forEach(doc => {
        const d = doc.data();
        list.push({ id: doc.id, ...d });
        const t = d.tingkat?.toLowerCase();
        if (totals.hasOwnProperty(t)) totals[t]++;
      });
      setMasterSKU(list);
      setSkuProgressStats(prev => ({ 
        ...prev, 
        totalRamu: totals.ramu, totalRakit: totals.rakit, totalTerap: totals.terap 
      }));
    });

    const unsubProgress = onSnapshot(
      query(collection(db, "sku_progress"), where("uid", "==", user.uid), where("status", "==", "verified")),
      (snap) => {
        const skus = snap.docs.map(doc => doc.data());
        setRawVerifiedSkus(skus);
        const counts = { ramu: 0, rakit: 0, terap: 0 };
        skus.forEach(data => {
          const t = data.tingkat?.toLowerCase();
          if (counts.hasOwnProperty(t)) counts[t]++;
        });
        setSkuProgressStats(prev => ({ ...prev, ...counts }));
      }
    );

    return () => {
      unsubUser(); unsubAnnounce(); unsubMaster(); unsubProgress();
    };
  };

  // --- AI GREETING ---
  useEffect(() => {
    if (!greetingFetched.current && userData?.nama && userBadges) {
        greetingFetched.current = true;
        const fetchNaviGreeting = async () => {
          try {
            const prompt = getRandomNaviPrompt(userData, userBadges);
            const context = { 
                nama: userData.nama, 
                level: userData.level || 1, 
                points: userData.points || 0, 
                energy: userData.energy || 100 
            };
            const response = await getNaviResponse(context, [], prompt, true);
            setNaviGreeting(response);
          } catch (e) { 
            setNaviGreeting("Radar aktif! Siap berlayar?"); 
          }
        };
        fetchNaviGreeting();
    }
  }, [userData?.nama, userBadges]);

  return {
    userData, naviGreeting, announcements, userBadges, skuProgressStats,
    loading, isEvolving, initializeListeners, playCollectSound
  };
};