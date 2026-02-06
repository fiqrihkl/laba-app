import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  doc,
  limit
} from "firebase/firestore";

/**
 * Hook khusus untuk Dashboard Pembina (Command Center)
 * Mengelola data profil, presensi live, sistem alert (SOS/SFH/SKU), status online, dan leaderboard.
 */
export const usePembinaDashboard = () => {
  const [pembinaData, setPembinaData] = useState(null);
  const [presentUsers, setPresentUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]); // State baru: Status Digital
  const [leaderboard, setLeaderboard] = useState([]); // State baru: Intelligence Ranking
  const [stats, setStats] = useState({ totalAnggota: 0 });
  const [alerts, setAlerts] = useState({ sos: 0, sfh: 0, sku: 0, tingkat: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mendapatkan tanggal hari ini untuk filter presensi lapangan
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("[SYSTEM-LOG] No user authenticated.");
      return;
    }

    console.log("[SYSTEM-LOG] Inisialisasi Sinkronisasi Radar NAVI...");

    // 1. PROFIL PEMBINA (Real-time)
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setPembinaData({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }, (err) => console.error("[ERROR-PROFIL]", err));

    // 2. STATISTIK TOTAL ANGGOTA (Daftar Laskar)
    const qStats = query(collection(db, "users"), where("role", "==", "anggota"));
    const unsubStats = onSnapshot(qStats, (snap) => {
      setStats({ totalAnggota: snap.size });
    }, (err) => console.error("[ERROR-STATS]", err));

    // 3. LIVE FEED PRESENSI (Kehadiran Fisik di Lapangan hari ini)
    const qPresent = query(
      collection(db, "users"),
      where("tanggalPresensi", "==", today),
      orderBy("lastAttendance", "desc")
    );
    const unsubPresent = onSnapshot(qPresent, (snap) => {
      setPresentUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("[ERROR-PRESENSI]", err));

    // 4. OPERATIONAL PULSE (Anggota yang sedang aktif membuka aplikasi)
    const qOnline = query(
      collection(db, "users"), 
      where("role", "==", "anggota"),
      where("isOnline", "==", true)
    );
    const unsubOnline = onSnapshot(qOnline, (snap) => {
      setOnlineUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("[ERROR-ONLINE]", err));

    // 5. LEADERBOARD (Top Intelligence Ranking - XP Tertinggi)
    const qLeaderboard = query(
      collection(db, "users"),
      where("role", "==", "anggota"),
      orderBy("points", "desc"),
      limit(5) // Ambil Top 5 untuk ringkasan dashboard
    );
    const unsubLeaderboard = onSnapshot(qLeaderboard, (snap) => {
      setLeaderboard(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("[ERROR-LEADERBOARD]", err));

    // 6. MONITOR SOS (Urgent Distress Signals)
    const qSOS = query(collection(db, "sos_signals"), where("status", "==", "active"));
    const unsubSOS = onSnapshot(qSOS, (snap) => {
      if (snap.size > 0) {
        console.warn(`[ALERT] Terdeteksi ${snap.size} sinyal SOS aktif!`);
      }
      setAlerts(prev => ({ ...prev, sos: snap.size }));
    }, (err) => console.error("[ERROR-SOS]", err));

    // 7. MONITOR SFH (Laporan Safe From Harm)
    const qSFH = query(collection(db, "sfh_reports"), where("status", "==", "unread"));
    const unsubSFH = onSnapshot(qSFH, (snap) => {
      setAlerts(prev => ({ ...prev, sfh: snap.size }));
    }, (err) => console.error("[ERROR-SFH]", err));
    
    // 8. MONITOR ANTREAN SKU
    const qSKU = query(collection(db, "sku_progress"), where("status", "==", "pending"));
    const unsubSKU = onSnapshot(qSKU, (snap) => {
      setAlerts(prev => ({ ...prev, sku: snap.size }));
    }, (err) => console.error("[ERROR-SKU]", err));

    // 9. MONITOR NOTIFIKASI REAL-TIME
    const qNotif = query(collection(db, "notifications"), where("isRead", "==", false));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      setUnreadCount(snap.size);
    }, (err) => console.error("[ERROR-NOTIF]", err));

    // 10. MONITOR PENGAJUAN TINGKAT
    const qTingkat = query(collection(db, "pengajuan_tingkat"), where("status", "==", "pending"));
    const unsubTingkat = onSnapshot(qTingkat, (snap) => {
      setAlerts(prev => ({ ...prev, tingkat: snap.size }));
    }, (err) => console.error("[ERROR-TINGKAT]", err));

    // CLEANUP: Memutuskan semua uplink saat dashboard di-unmount
    return () => {
      console.log("[SYSTEM-LOG] Memutuskan koneksi Radar Command Center...");
      unsubUser();
      unsubStats();
      unsubPresent();
      unsubOnline();
      unsubLeaderboard();
      unsubSOS();
      unsubSFH();
      unsubSKU();
      unsubNotif();
      unsubTingkat();
    };
  }, [today]);

  return { 
    pembinaData, 
    presentUsers, 
    onlineUsers, // Return data online
    leaderboard, // Return data leaderboard
    stats, 
    alerts, 
    unreadCount, 
    loading 
  };
};