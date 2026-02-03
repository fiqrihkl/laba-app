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
  HiOutlineRefresh 
} from "react-icons/hi";

export default function ScannerPembina() {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  // --- FUNGSI AUDIO BEEP (SINTETIS) ---
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine"; 
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio API tidak didukung", e);
    }
  };

  // Fungsi untuk memulai scanner (dipisah agar bisa dipanggil ulang)
  const startScanner = async () => {
    try {
      if (scannerRef.current && !scannerRef.current.isScanning) {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScanSuccess
        );
      }
    } catch (err) {
      console.error("Gagal memulai kamera:", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        const readerElement = document.getElementById("reader");
        if (readerElement) readerElement.innerHTML = "";
      } catch (err) {
        console.error("Gagal menghentikan scanner:", err);
      }
    }
  };

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    // Jika sedang memproses data sebelumnya, abaikan scan baru
    if (isProcessing) return;

    playBeep();
    if ("vibrate" in navigator) {
      navigator.vibrate(150);
    }
    
    // 1. Berhenti scanning segera agar tidak terjadi double-read
    await stopScanner();
    
    setScanResult(decodedText);
    
    // 2. Jalankan proses database
    await processAttendance(decodedText);

    // 3. JEDA OTOMATIS: Tunggu 3 detik sebelum mengaktifkan kamera kembali
    setTimeout(async () => {
      setScanResult(null);
      setStatus("");
      await startScanner();
    }, 1000); 
  };

  const processAttendance = async (scannedUID) => {
    setIsProcessing(true);
    setStatus("⏳ Memvalidasi Anggota...");

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

        setStatus(`✅ BERHASIL! +50 XP untuk ${userData.nama}`);
      } else {
        setStatus("❌ GAGAL: Anggota tidak terdaftar.");
      }
    } catch (error) {
      console.error("Firebase Error:", error);
      setStatus("⚠️ ERROR: Masalah koneksi atau izin database.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-100">
        
        {/* HEADER */}
        <div className="bg-slate-900 pt-12 pb-20 px-8 rounded-b-[4rem] relative overflow-hidden text-white shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate("/pembina")}
                className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition shadow-lg">
                <HiOutlineChevronLeft size={24} className="text-white" />
              </button>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Pemindai KTA</h1>
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">Laskar Bahari System</p>
              </div>
            </div>
            <HiOutlineQrcode size={22} className="text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="px-8 -mt-10 relative z-20">
          <div className="bg-white p-4 rounded-[3.5rem] shadow-2xl border border-slate-50 relative overflow-hidden">
            <div id="reader" className="w-full rounded-[3rem] overflow-hidden bg-slate-900 border-4 border-slate-50 min-h-[320px]"></div>
            
            {/* Animasi garis hanya muncul saat status kosong (siap scan) */}
            {!scanResult && !status && (
              <div className="absolute inset-x-10 top-1/2 h-[2px] bg-blue-500 animate-scan-line shadow-[0_0_15px_#3b82f6] z-30"></div>
            )}
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="px-8 flex-1 flex flex-col justify-start pt-12">
          {status && (
            <div className={`p-7 rounded-[2.5rem] text-center font-black text-[10px] uppercase tracking-widest border-2 shadow-xl animate-bounce-short ${
                status.includes("BERHASIL") ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
              }`}>
              <div className="flex flex-col items-center gap-4">
                {status.includes("BERHASIL") ? <HiOutlineBadgeCheck size={40} /> : <HiOutlineXCircle size={40} />}
                {status}
                <p className="text-[7px] text-slate-400 normal-case italic mt-2">Menyiapkan scanner kembali...</p>
              </div>
            </div>
          )}

          {/* Tombol Reset tetap ada sebagai alternatif jika ingin paksa restart cepat */}
          {!status && !isProcessing && (
            <div className="mt-10 text-center opacity-40 italic">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Arahkan kamera ke QR Code Anggota</p>
            </div>
          )}
        </div>

        <footer className="py-10 text-center">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">Nautical Identity Security v3.5</p>
        </footer>
      </div>

      <style>{`
        @keyframes scan-line { 0% { transform: translateY(-100px); } 100% { transform: translateY(100px); } }
        .animate-scan-line { animation: scan-line 2s ease-in-out infinite; }
        
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-short { animation: bounce-short 1s ease-in-out infinite; }

        #reader video { 
          object-fit: cover !important; 
          border-radius: 2.5rem;
        }
        #reader button { 
          background: #0f172a !important; 
          color: white !important; 
          border-radius: 1rem !important; 
          padding: 10px 20px !important; 
          font-size: 10px !important; 
          text-transform: uppercase !important;
          font-weight: 900 !important;
          border: none !important;
          margin: 10px auto !important;
          display: block;
        }
      `}</style>
    </div>
  );
}