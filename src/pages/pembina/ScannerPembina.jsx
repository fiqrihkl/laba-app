import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// IMPORT REACT ICONS
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
  
  // PERBAIKAN UTAMA: Gunakan useRef untuk melacak instance scanner
  const scannerInstance = useRef(null); 
  const navigate = useNavigate();

  useEffect(() => {
    // Fungsi untuk memulai scanner
    const startScanner = () => {
      // Jika sudah ada instance, jangan buat lagi (mencegah kamera ganda)
      if (scannerInstance.current) return;

      const scanner = new Html5QrcodeScanner("reader", {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] 
      });

      scanner.render(onScanSuccess, onScanFailure);
      scannerInstance.current = scanner;
    };

    startScanner();

    async function onScanSuccess(decodedText) {
      if (isProcessing) return;
      
      try {
        setScanResult(decodedText);
        processAttendance(decodedText);
        
        // Opsional: Hentikan scanner setelah berhasil scan satu kali
        if (scannerInstance.current) {
          scannerInstance.current.clear().catch(err => console.error(err));
          scannerInstance.current = null;
        }
      } catch (err) {
        console.error("Gagal memproses hasil scan:", err);
      }
    }

    function onScanFailure(err) {
      // Abaikan error pembacaan rutin
    }

    // CLEANUP: Sangat krusial untuk menghentikan kamera saat meninggalkan halaman
    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.clear().catch(error => {
          console.error("Gagal membersihkan scanner pada unmount:", error);
        });
        scannerInstance.current = null;
      }
    };
  }, [isProcessing]);

  // --- FUNGSI PROSES PRESENSI ---
  const processAttendance = async (scannedUID) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatus("⏳ Memvalidasi Anggota...");

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", scannedUID));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(db, "users", userDoc.id);
        const userData = userDoc.data();

        await updateDoc(userRef, {
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
      console.error("Kesalahan Database:", error);
      setStatus("⚠️ ERROR: Masalah koneksi atau izin.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    // Reset state dan paksa inisialisasi ulang scanner
    setScanResult(null);
    setStatus("");
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-100">
        
        {/* HEADER AREA */}
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
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-400/20">
               <HiOutlineQrcode size={22} className="text-blue-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="px-8 -mt-10 relative z-20">
          <div className="bg-white p-4 rounded-[3.5rem] shadow-2xl border border-slate-50 relative overflow-hidden group">
            {!scanResult && (
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-10">
                <div className="w-full aspect-square border-2 border-blue-500/20 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-blue-600 rounded-tl-2xl"></div>
                  <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-blue-600 rounded-tr-2xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-blue-600 rounded-bl-2xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-blue-600 rounded-br-2xl"></div>
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 animate-scan-line shadow-[0_0_20px_#3b82f6]"></div>
                </div>
              </div>
            )}
            <div id="reader" className="w-full rounded-[3rem] overflow-hidden bg-slate-900 border-4 border-slate-50 min-h-[320px]"></div>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="px-8 flex-1 flex flex-col justify-start pt-12">
          {status && (
            <div className={`p-7 rounded-[2.5rem] text-center font-black text-[10px] uppercase tracking-widest border-2 shadow-xl animate-in fade-in zoom-in duration-500 ${
                status.includes("BERHASIL") ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
              }`}>
              <div className="flex flex-col items-center gap-4 leading-tight">
                {status.includes("BERHASIL") ? <HiOutlineBadgeCheck size={40} /> : <HiOutlineXCircle size={40} />}
                {status}
              </div>
            </div>
          )}

          {scanResult && (
            <button onClick={handleReset} className="mt-8 w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
              <HiOutlineRefresh size={18} /> Lanjutkan Pemindaian
            </button>
          )}

          {!scanResult && !status && (
            <div className="mt-10 text-center flex flex-col items-center gap-4 opacity-40 italic">
               <div className="w-12 h-1 px-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-1/2 animate-loading-bar"></div>
               </div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ready for Captain Verification...</p>
            </div>
          )}
        </div>

        <footer className="py-10 text-center bg-white mt-auto border-t border-slate-100">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">Nautical Identity Security v3.5</p>
        </footer>
      </div>

      <style>{`
        @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
        .animate-scan-line { animation: scan-line 2.5s ease-in-out infinite; }
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-loading-bar { animation: loading-bar 1.5s infinite; }
        #reader button { background-color: #0f172a !important; color: white !important; border-radius: 1.25rem !important; padding: 12px 24px !important; font-weight: 900 !important; text-transform: uppercase !important; border: none !important; margin: 15px auto !important; display: block; }
      `}</style>
    </div>
  );
}