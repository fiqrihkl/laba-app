import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../../firebase";
import {
  collection, query, where, getDocs, doc,
  updateDoc, increment, arrayUnion, serverTimestamp, getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineChevronLeft, 
  HiOutlineQrcode, 
  HiOutlineBadgeCheck, 
  HiOutlineXCircle, 
  HiOutlineRefresh,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle
} from "react-icons/hi";

export default function ScannerPembina() {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "", sub: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- STATE PENCARIAN MANUAL ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const scannerRef = useRef(null);
  const navigate = useNavigate();

  // --- AUDIO FEEDBACK ---
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine"; 
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.error("Audio API not supported"); }
  };

  const startScanner = async () => {
    try {
      if (scannerRef.current && !scannerRef.current.isScanning) {
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          onScanSuccess
        );
      }
    } catch (err) { console.error("Scanner failed:", err); }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        const readerElement = document.getElementById("reader");
        if (readerElement) readerElement.innerHTML = "";
      } catch (err) { console.error("Stop failed:", err); }
    }
  };

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }
    const timer = setTimeout(() => { startScanner(); }, 500);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    if (isProcessing) return;
    playBeep();
    if ("vibrate" in navigator) navigator.vibrate(100);
    await stopScanner();
    setScanResult(decodedText);
    await processAttendance(decodedText, "HADIR");

    setTimeout(async () => {
      setScanResult(null);
      setStatus({ type: "", message: "", sub: "" });
      await startScanner();
    }, 2000); 
  };

  // --- LOGIKA PENCARIAN MANUAL ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "==", "anggota")
      );
      const snap = await getDocs(q);
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.nama.toLowerCase().includes(searchQuery.toLowerCase()));
      setSearchResults(filtered);
    } catch (err) { console.error(err); }
  };

  // --- LOGIKA UTAMA KEHADIRAN (SCAN & MANUAL) ---
  const processAttendance = async (scannedUID, attendanceStatus) => {
    setIsProcessing(true);
    setStatus({ type: "loading", message: "MEMPROSES DATA...", sub: "Updating Identity Log" });

    try {
      const q = query(collection(db, "users"), where("uid", "==", scannedUID));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userRef = doc(db, "users", userDoc.id);

        let xpBonus = 0;
        let logMessage = "";

        // Penentuan Poin Berdasarkan Status
        switch(attendanceStatus) {
          case "HADIR": 
            xpBonus = 50; 
            logMessage = "Presensi Latihan Rutin";
            break;
          case "SAKIT":
            xpBonus = 10;
            logMessage = "Laporan Sakit (Tervalidasi)";
            break;
          case "IZIN":
            xpBonus = 5;
            logMessage = "Laporan Izin (Tervalidasi)";
            break;
          default: xpBonus = 0;
        }

        await updateDoc(userRef, {
          points: increment(xpBonus),
          lastAttendance: serverTimestamp(),
          tanggalPresensi: new Date().toISOString().split("T")[0],
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: logMessage,
            pointsEarned: xpBonus,
            type: "PRESENSI"
          }),
        });

        setStatus({ 
          type: "success", 
          message: `${attendanceStatus}: ${userData.nama}`, 
          sub: `+${xpBonus} XP ditambahkan ke Laskar` 
        });
        setSelectedUser(null);
        setSearchQuery("");
      } else {
        setStatus({ type: "error", message: "ID TIDAK TERDAFTAR", sub: "Gagal memverifikasi identitas" });
      }
    } catch (error) {
      setStatus({ type: "error", message: "KONEKSI BERMASALAH", sub: "Cek jaringan internet Anda" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-32 font-sans italic selection:bg-blue-900">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/pembina")} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Command Center</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Verification Uplink</p>
            </div>
          </div>
          <HiOutlineQrcode size={22} className="text-slate-600" />
        </header>

        <main className="p-6 space-y-8">
          {/* SCANNER VIEWPORT */}
          <div className="w-full aspect-square relative bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div id="reader" className="w-full h-full overflow-hidden scale-x-[-1]"></div>
            {!scanResult && !status.message && (
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border border-blue-500/30 rounded-xl relative">
                   <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                   <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                   <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                   <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                   <div className="absolute inset-x-0 top-1/2 h-[1px] bg-blue-500/40 animate-scan-line"></div>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC STATUS CARD */}
          <AnimatePresence>
            {status.message && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`p-5 rounded-2xl border flex items-center gap-4 ${
                  status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
                  status.type === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                <div className="text-2xl">
                  {status.type === "success" ? <HiOutlineBadgeCheck /> : status.type === "loading" ? <HiOutlineRefresh className="animate-spin" /> : <HiOutlineXCircle />}
                </div>
                <div className="text-left">
                  <h3 className="text-[11px] font-black uppercase tracking-widest">{status.message}</h3>
                  <p className="text-[9px] font-bold opacity-60 uppercase">{status.sub}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MANUAL SEARCH SECTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <HiOutlineSearch className="text-slate-600" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual Lookup (Izin/Sakit)</h2>
            </div>

            <div className="relative">
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="CARI NAMA ANGGOTA..."
                className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all uppercase"
              />
              
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} 
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden z-[50] shadow-2xl max-h-60 overflow-y-auto custom-scroll">
                    {searchResults.map(user => (
                      <button key={user.id} onClick={() => setSelectedUser(user)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 border-b border-white/5 transition-all text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 font-black text-[10px] uppercase">{user.nama.substring(0, 2)}</div>
                          <div>
                            <p className="text-[11px] font-black text-slate-200 uppercase leading-none mb-1">{user.nama}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-black">{user.tingkat || "Laskar"}</p>
                          </div>
                        </div>
                        <HiOutlineCheckCircle className="text-slate-700" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </main>

        {/* MODAL STATUS KEHADIRAN MANUAL */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] p-8 border border-white/10 text-center">
                <HiOutlineInformationCircle size={32} className="mx-auto text-blue-500 mb-4" />
                <h3 className="text-sm font-black text-white uppercase mb-1">{selectedUser.nama}</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black mb-8 italic">Pilih Status Kehadiran</p>
                
                <div className="space-y-3">
                  <button onClick={() => processAttendance(selectedUser.uid, "HADIR")} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Set Hadir Manual</button>
                  <button onClick={() => processAttendance(selectedUser.uid, "SAKIT")} className="w-full bg-slate-800 text-amber-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-amber-500/20">Set Sakit (+10 XP)</button>
                  <button onClick={() => processAttendance(selectedUser.uid, "IZIN")} className="w-full bg-slate-800 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5">Set Izin (+5 XP)</button>
                  <button onClick={() => setSelectedUser(null)} className="w-full py-3 text-[9px] text-slate-600 font-black uppercase">Batalkan</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-auto py-8 text-center border-t border-white/5 mx-6">
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.5em] opacity-40">NAVIGASI Verification Protocol v3.0</p>
        </footer>
      </div>

      <style>{`
        @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 3s linear infinite; }
        #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        #reader__dashboard_section_csr button { 
          background: #2563eb !important; color: white !important; border-radius: 1rem !important; 
          padding: 14px 28px !important; font-size: 10px !important; text-transform: uppercase !important;
          font-weight: 900 !important; border: none !important; margin: 15px auto !important;
          letter-spacing: 0.1em; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  );
}