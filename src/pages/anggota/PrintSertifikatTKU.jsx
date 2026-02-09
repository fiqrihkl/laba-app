import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { HiOutlineDownload, HiOutlineChevronLeft, HiOutlinePrinter } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function PrintSertifikatTKU({ userData }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef(null);
  const navigate = useNavigate();

  // Deteksi tingkat berdasarkan data user
  const userTingkat = userData?.tingkat || "RAMU"; 

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "certificate_config");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(snap.data());
        }
      } catch (err) {
        console.error("Error fetching cert config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const generatePDF = async () => {
    const element = certificateRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Kualitas tinggi untuk cetak
        useCORS: true,
        logging: false,
        backgroundColor: null
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1123, 794], // Rasio A4 Landscape
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 1123, 794);
      pdf.save(`TKU_${userTingkat.toUpperCase()}_${userData?.nama?.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      alert("Gagal mengunduh PDF. Pastikan koneksi stabil.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-amber-500 font-black animate-pulse uppercase text-[10px] tracking-[0.5em] italic">
        Generating Digital Badge...
      </div>
    </div>
  );

  const currentTingkat = config?.templates?.[userTingkat.toUpperCase()];

  if (!currentTingkat || !currentTingkat.templateURL) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <p className="text-slate-500 uppercase font-black text-[10px] italic mb-6 tracking-widest text-center">
          Template {userTingkat} Belum Diatur Oleh Pembina
        </p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 border border-white/10 rounded-2xl text-white text-[9px] font-black uppercase">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-10 flex flex-col items-center font-sans italic">
      
      {/* TOOLBAR KONTROL */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-10 bg-white/5 p-5 rounded-[2rem] border border-white/10 backdrop-blur-xl sticky top-4 z-50">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-400">
          <HiOutlineChevronLeft size={20} />
        </button>
        
        <div className="text-center">
          <h1 className="text-white font-black uppercase text-xs tracking-[0.2em] leading-none">Piagam Digital TKU</h1>
          <p className="text-[8px] text-amber-500 font-black uppercase mt-1 tracking-widest">Laskar Bahari Authority</p>
        </div>

        <button 
          onClick={generatePDF}
          className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
        >
          <HiOutlineDownload size={16} /> Download
        </button>
      </div>

      {/* AREA RENDERING SERTIFIKAT */}
      <div className="w-full flex justify-center pb-20 custom-scroll">
        <div 
          ref={certificateRef}
          className="relative bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden"
          style={{
            width: "1123px",
            height: "794px",
            backgroundImage: `url(${currentTingkat.templateURL})`,
            backgroundSize: "100% 100%",
            transform: "scale(var(--zoom-level, 0.4))",
            transformOrigin: "top center",
          }}
        >
          <style>{`
            :root { --zoom-level: 0.28; }
            @media (min-width: 768px) { --zoom-level: 0.55; }
            @media (min-width: 1280px) { --zoom-level: 0.75; }
          `}</style>

          {/* Menampilkan Nama Anggota */}
          <div
            className="absolute font-bold flex items-center justify-center"
            style={{
              left: `${currentTingkat.elements.nama.x}%`,
              top: `${currentTingkat.elements.nama.y}%`,
              fontSize: `${currentTingkat.elements.nama.fontSize}px`,
              color: currentTingkat.elements.nama.color,
              transform: "translate(-50%, -50%)",
              whiteSpace: "nowrap",
            }}
          >
            {userData?.nama?.toUpperCase()}
          </div>

          {/* Menampilkan Nomor Sertifikat */}
          <div
            className="absolute font-mono font-bold"
            style={{
              left: `${currentTingkat.elements.nomor.x}%`,
              top: `${currentTingkat.elements.nomor.y}%`,
              fontSize: `${currentTingkat.elements.nomor.fontSize}px`,
              color: currentTingkat.elements.nomor.color,
              transform: "translate(-50%, -50%)",
            }}
          >
            {userData?.lulus_info?.[userTingkat.toUpperCase()]?.noSertifikat || "NO-DATA/LB/2026"}
          </div>

          {/* Menampilkan Tanggal Otomatis */}
          <div
            className="absolute font-bold"
            style={{
              left: `${currentTingkat.elements.tanggal.x}%`,
              top: `${currentTingkat.elements.tanggal.y}%`,
              fontSize: `${currentTingkat.elements.tanggal.fontSize}px`,
              color: currentTingkat.elements.tanggal.color,
              transform: "translate(-50%, -50%)",
            }}
          >
            {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}