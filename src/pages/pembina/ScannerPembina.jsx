import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../../firebase";
import {
  collection, query, where, getDocs, doc,
  updateDoc, increment, arrayUnion, serverTimestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineChevronLeft, 
  HiOutlineQrcode, 
  HiOutlineBadgeCheck, 
  HiOutlineXCircle, 
  HiOutlineRefresh,
  HiOutlineUser
} from "react-icons/hi";

export default function ScannerPembina() {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "", sub: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    } catch (e) {
      console.error("Audio API not supported");
    }
  };

  const startScanner = async () => {
    try {
      if (scannerRef.current && !scannerRef.current.isScanning) {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0
          },
          onScanSuccess
        );
      }
    } catch (err) {
      console.error("Scanner failed:", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        const readerElement = document.getElementById("reader");
        if (readerElement) readerElement.innerHTML = "";
      } catch (err) {
        console.error("Stop failed:", err);
      }
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
    await processAttendance(decodedText);

    // Auto-restart after 2 seconds
    setTimeout(async () => {
      setScanResult(null);
      setStatus({ type: "", message: "", sub: "" });
      await startScanner();
    }, 2000); 
  };

  const processAttendance = async (scannedUID) => {
    setIsProcessing(true);
    setStatus({ type: "loading", message: "MEMVALIDASI ID...", sub: "Synchronizing with Database" });

    try {
      const q = query(collection(db, "users"), where("uid", "==", scannedUID));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        await updateDoc(doc(db, "users", userDoc.id), {
          points: increment(50),
          lastAttendance: serverTimestamp(),
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: "Presensi Latihan Rutin",
            pointsEarned: 50,
            type: "PRESENSI"
          }),
        });

        setStatus({ 
          type: "success", 
          message: `BERHASIL: ${userData.nama}`, 
          sub: "+50 XP ditambahkan ke Laskar" 
        });
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
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/pembina")} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">Scanner KTA</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Laskar Bahari Identity</p>
            </div>
          </div>
          <HiOutlineQrcode size={22} className="text-slate-600" />
        </header>

        {/* SCANNER VIEWPORT */}
        <main className="p-8 flex flex-col items-center">
          <div className="w-full aspect-square relative bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div id="reader" className="w-full h-full overflow-hidden scale-x-[-1]"></div>
            
            {/* Minimalist Scan Overlay */}
            {!scanResult && !status.message && (
              <>
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
                <div className="absolute inset-[40px] border border-blue-500/50 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-blue-500/30 animate-scan-line"></div>
                </div>
              </>
            )}
          </div>

          {/* STATUS DISPLAY (CONSISTENT STYLE) */}
          <div className="w-full mt-10 min-h-[140px]">
            {status.message ? (
              <div className={`p-6 rounded-xl border flex items-center gap-5 transition-all ${
                status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
                status.type === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                <div className="text-2xl">
                  {status.type === "success" ? <HiOutlineBadgeCheck /> : 
                   status.type === "loading" ? <HiOutlineRefresh className="animate-spin" /> : 
                   <HiOutlineXCircle />}
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black uppercase tracking-widest leading-none mb-1">{status.message}</h3>
                  <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">{status.sub}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 opacity-30 text-center">
                <HiOutlineUser size={24} className="mb-3 text-slate-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Arahkan ke QR KTA Anggota</p>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto py-8 text-center border-t border-white/5 mx-6">
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.5em]">NAVIGASI Identity Verification</p>
        </footer>
      </div>

      <style>{`
        @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 3s linear infinite; }

        #reader video { 
          object-fit: cover !important; 
          width: 100% !important;
          height: 100% !important;
        }
        #reader__dashboard_section_csr button { 
          background: #2563eb !important; 
          color: white !important; 
          border-radius: 0.75rem !important; 
          padding: 12px 24px !important; 
          font-size: 10px !important; 
          text-transform: uppercase !important;
          font-weight: 800 !important;
          border: none !important;
          margin: 15px auto !important;
        }
      `}</style>
    </div>
  );
}