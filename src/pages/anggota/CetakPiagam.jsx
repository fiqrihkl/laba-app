import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import * as htmlToImage from "html-to-image";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlinePrinter, 
  HiOutlineDownload,
  HiOutlineShieldCheck
} from "react-icons/hi";

export default function CetakPiagam() {
  const location = useLocation();
  const navigate = useNavigate();
  const certificateRef = useRef(null);

  // Mengambil data dari state (dikirim dari Profile.jsx)
  const { cert, userData } = location.state || {};

  if (!cert || !userData) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 font-black uppercase tracking-widest italic">Data Piagam Tidak Ditemukan</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-red-500 font-black uppercase text-xs">Kembali ke Profil</button>
      </div>
    );
  }

  const downloadPiagam = async () => {
    if (!certificateRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(certificateRef.current, {
        quality: 1,
        pixelRatio: 3, // High Resolution
      });
      const link = document.createElement("a");
      link.download = `PIAGAM_${cert.stageName.toUpperCase()}_${userData.nama.split('')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Gagal mengunduh piagam:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-10 flex flex-col items-center italic font-medium selection:bg-red-800">
      
      {/* HEADER NAV */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 active:scale-95 transition-all"
        >
          <HiOutlineChevronLeft size={24} />
        </button>
        <div className="text-center leading-none">
          <h1 className="text-xl font-black uppercase tracking-tighter">Preview Piagam</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mt-2 font-black">Official Recognition System</p>
        </div>
        <div className="w-12" />
      </div>

      {/* CERTIFICATE AREA */}
      <div className="w-full flex justify-center overflow-x-auto pb-10 custom-scroll">
        <div 
          ref={certificateRef}
          className="relative w-[1123px] h-[794px] bg-white text-slate-900 shadow-[0_50px_100px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden border-[20px] border-double border-amber-600"
          style={{ 
            backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
            transform: "scale(var(--cert-scale, 0.3))",
            transformOrigin: "top center"
          }}
        >
          <style>{`
            :root { --cert-scale: 0.32; }
            @media (min-width: 640px) { :root { --cert-scale: 0.5; } }
            @media (min-width: 1024px) { :root { --cert-scale: 0.8; } }
            @media (min-width: 1280px) { :root { --cert-scale: 1; } }
          `}</style>

          {/* Ornamen Sudut */}
          <div className="absolute top-4 left-4 w-32 h-32 border-t-4 border-l-4 border-amber-600" />
          <div className="absolute top-4 right-4 w-32 h-32 border-t-4 border-r-4 border-amber-600" />
          <div className="absolute bottom-4 left-4 w-32 h-32 border-b-4 border-l-4 border-amber-600" />
          <div className="absolute bottom-4 right-4 w-32 h-32 border-b-4 border-r-4 border-amber-600" />

          {/* Konten Utama */}
          <div className="flex flex-col items-center px-24 pt-20 text-center">
            <img src="/logo/logo.png" className="w-24 h-24 mb-6 object-contain" alt="Logo" />
            
            <h2 className="text-amber-700 font-serif text-5xl font-black uppercase tracking-[0.2em] mb-2">Piagam Penghargaan</h2>
            <p className="text-slate-500 font-serif text-lg tracking-[0.5em] uppercase mb-10 border-b-2 border-amber-200 pb-2">Laskar Bahari SMP Negeri 1 Biau</p>
            
            <p className="text-xl font-serif italic mb-2">Diberikan dengan hormat kepada:</p>
            <h3 className="text-slate-900 font-serif text-6xl font-black uppercase border-b-4 border-double border-amber-600 px-10 py-4 mb-6 italic">
              {userData.nama}
            </h3>
            <p className="text-lg font-serif italic tracking-wide leading-relaxed max-w-3xl">
              Atas keberhasilan dan dedikasi luar biasa dalam mengembangkan kemampuan diri <br /> sehingga resmi mencapai tingkatan evolusi strategis:
            </p>

            <div className="mt-8 bg-amber-50 px-12 py-6 rounded-full border-2 border-amber-200 shadow-inner">
              <h4 className="text-amber-800 text-4xl font-black uppercase italic tracking-widest">
                STAGE: {cert.stageName}
              </h4>
            </div>

            <div className="w-full flex justify-between items-end mt-20">
              {/* QR Verify */}
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-2 border-2 border-amber-200 rounded-xl">
                  <QRCodeCanvas value={`VERIFY-${cert.id}`} size={100} level="H" />
                </div>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest italic">{cert.code}</p>
              </div>

              {/* Tanda Tangan */}
              <div className="text-center flex flex-col items-center">
                <p className="text-sm font-serif italic mb-16">Ditetapkan pada: {new Date(cert.dateAwarded).toLocaleDateString('id-ID')}</p>
                <div className="w-48 h-[1px] bg-slate-400 mb-2" />
                <p className="text-lg font-black uppercase tracking-widest text-slate-900">Pembina Laskar</p>
                <p className="text-xs text-slate-500 font-bold">Gudep 10.491-10.492</p>
              </div>

              {/* Seal Resmi */}
              <div className="relative">
                 <HiOutlineShieldCheck className="text-amber-600/20 w-40 h-40 absolute -top-20 -left-20 rotate-12" />
                 <div className="w-32 h-32 bg-amber-600 rounded-full flex flex-col items-center justify-center text-white border-4 border-white shadow-xl rotate-[-15deg]">
                    <span className="text-[10px] font-black tracking-widest">OFFICIAL</span>
                    <span className="text-2xl font-black italic">LB</span>
                    <span className="text-[8px] font-black tracking-widest uppercase">Verified</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="fixed bottom-10 left-0 w-full flex justify-center gap-6 px-6 z-[1001]">
         <button 
           onClick={downloadPiagam}
           className="bg-white text-[#020617] px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center gap-3 group"
         >
           <HiOutlineDownload size={20} className="group-hover:translate-y-1 transition-transform" />
           Download HD Piagam
         </button>
         
         <button 
           onClick={() => window.print()}
           className="bg-red-600 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center gap-3"
         >
           <HiOutlinePrinter size={20} />
           Print Now
         </button>
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { height: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @media print {
          body * { visibility: hidden; }
          #certificate-area, #certificate-area * { visibility: visible; }
          #certificate-area { position: absolute; left: 0; top: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}