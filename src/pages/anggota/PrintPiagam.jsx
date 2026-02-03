import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { SKU_CATEGORIES } from "../../utils/badgeLogic";
import * as htmlToImage from "html-to-image";
import { HiOutlineDownload, HiOutlineChevronLeft, HiOutlineShieldCheck } from "react-icons/hi";

function PrintPiagam() {
  const { badgeKey } = useParams(); // Mengambil kunci kategori (contoh: SPIRITUAL)
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const downloadCertificate = async () => {
    if (certificateRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(certificateRef.current, {
          quality: 1,
          pixelRatio: 3, 
          backgroundColor: "#ffffff",
        });
        
        const link = document.createElement("a");
        link.download = `Piagam_${badgeKey}_${userData?.nama || "Navigator"}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error("Error:", error);
        alert("Gagal memproses gambar digital.");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-400 font-black tracking-widest animate-pulse">
      LOADING DIGITAL ASSET...
    </div>
  );

  const badgeInfo = SKU_CATEGORIES[badgeKey];
  const claimData = userData?.claimedBadges?.[badgeKey];
  
  // LOGIKA PATH GAMBAR: Menggunakan badgeKey dari URL untuk memanggil file spesifik
  const logoPath = `/images/badge/${badgeKey}.png`;
  
  const piagamId = `NAV-${badgeKey?.toUpperCase()}-${auth.currentUser?.uid.substring(0, 8).toUpperCase()}`;

  const getRankStatus = () => {
    const level = claimData?.level?.toLowerCase();
    if (level === "ramu") return "Calon Penggalang Rakit";
    if (level === "rakit") return "Calon Penggalang Terap";
    return "Calon Penggalang Ramu";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 flex flex-col items-center overflow-y-auto">
      {/* Action Bar */}
      <div className="w-full max-w-[400px] flex justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 text-[10px] font-black tracking-widest hover:text-white transition-all uppercase">
          <HiOutlineChevronLeft size={16}/> Back to Hub
        </button>
        <button onClick={downloadCertificate} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all">
          <HiOutlineDownload size={16} className="inline mr-2"/> Download Artifact
        </button>
      </div>

      {/* Certificate Canvas Area */}
      <div 
        ref={certificateRef}
        className="relative bg-white flex flex-col items-center overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        style={{
          width: "400px",
          height: "580px",
          padding: "30px 40px",
          border: "16px solid #1e293b", 
        }}
      >
        {/* ID Piagam & Tanggal */}
        <div className="absolute top-6 left-6 right-6 flex justify-between z-20">
            <div className="text-left">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-tighter leading-none">Certificate ID</p>
                <p className="text-[8px] font-mono font-bold text-slate-400">{piagamId}</p>
            </div>
            <div className="text-right">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-tighter leading-none">Issue Date</p>
                <p className="text-[8px] font-bold text-slate-400">
                    {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
            </div>
        </div>

        <div className="absolute inset-2 border-[1px] border-amber-400/30 pointer-events-none"></div>
        
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none select-none flex flex-wrap justify-center content-start rotate-[-15deg] scale-125"
          style={{ fontSize: '8px', fontWeight: '900', color: '#1e293b' }}
        >
          {Array.from({ length: 160 }).map((_, i) => (
            <span key={i} className="m-2">LASKAR BAHARI</span>
          ))}
        </div>

        <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent"></div>

        {/* Header Section */}
        <div className="relative z-10 flex flex-col items-center w-full mt-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/50 animate-[spin_10s_linear_infinite]"></div>
            <div className="bg-white p-3 rounded-full relative z-10 shadow-xl border border-slate-100">
              {/* GAMBAR LOGO BADGE DINAMIS */}
              <img 
                src={logoPath} 
                alt={`${badgeKey} Badge`}
                className="w-14 h-14 object-contain"
                onError={(e) => { 
                  e.target.onerror = null; 
                  e.target.src = "/images/badge/default.png"; // Fallback jika file PNG kategori tidak ditemukan
                }} 
              />
            </div>
          </div>
          
          <h1 className="text-[22px] font-black uppercase tracking-tighter text-slate-900 leading-none">
            Piagam <span className="text-blue-600 font-black">Penghargaan</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 mb-6">
             <div className="h-[2px] w-6 bg-amber-400"></div>
             <p className="text-[8px] font-black text-slate-400 tracking-[0.3em] uppercase">
                Laskar Bahari Navigation System
             </p>
             <div className="h-[2px] w-6 bg-amber-400"></div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 tracking-widest">Diberikan Kepada Navigator:</p>
          <h2 className="text-[26px] font-black uppercase italic text-slate-800 tracking-tighter mb-4 drop-shadow-sm">
            {userData?.nama || "Navigator"}
          </h2>

          <div className="space-y-3 w-full text-center">
            <p className="text-[11px] leading-relaxed text-slate-600 font-medium px-4">
              Atas keberhasilannya mencapai kualifikasi luar biasa di dalam sistem navigasi:
            </p>

            {/* Achievement Box */}
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 blur-lg opacity-10 transition-opacity"></div>
              <div className="relative bg-[#0f172a] p-3 rounded-2xl border-b-4 border-blue-600 shadow-xl">
                <p className="text-[13px] font-black text-white uppercase tracking-wider mb-0.5">
                    GOLD MASTER: {badgeInfo?.name || badgeKey}
                </p>
                <div className="inline-block px-3 py-0.5 bg-blue-500/20 rounded-full">
                  <p className="text-[8px] font-black text-blue-400 uppercase italic">
                    Rank Status: {getRankStatus()}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[9.5px] italic font-bold text-slate-500 leading-tight px-6 line-clamp-3">
                "{badgeInfo?.competency || "Telah teruji dan layak menyandang gelar kualifikasi dalam sistem operasional Laskar Bahari."}"
              </p>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto w-full flex justify-between items-end relative z-10 pt-4 border-t-2 border-slate-50">
          <div className="text-left">
            <div className="flex items-center gap-1 text-blue-600 mb-1">
              <HiOutlineShieldCheck size={12} className="animate-pulse" />
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">System Verified</span>
            </div>
            <p className="text-[7px] uppercase font-bold text-slate-300 leading-none">Auth Signature</p>
            <p className="text-[9px] font-mono font-black text-slate-500 tracking-tighter">
              NAV-{auth.currentUser?.uid.substring(0,12).toUpperCase()}
            </p>
          </div>

          {/* Stempel NAVI */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 opacity-80 pointer-events-none">
             <div className="border-4 border-double border-blue-600/30 rounded-full w-14 h-14 flex items-center justify-center rotate-[-15deg]">
                <div className="text-center">
                    <p className="text-[8px] font-black text-blue-600/50 leading-none">NAVI</p>
                    <p className="text-[5px] font-bold text-blue-600/30 uppercase leading-none">Authentic</p>
                </div>
             </div>
          </div>

          <div className="text-right">
             <p className="text-[7px] uppercase font-bold text-slate-300 leading-none">Mission Cleared</p>
             <p className="text-[10px] font-black text-slate-800">
               {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
             </p>
             <div className="mt-0.5">
                <span className="text-[9px] font-black italic text-blue-600 tracking-tighter">NAVIGASI APP</span>
             </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-slate-500 text-[9px] font-black uppercase tracking-[0.5em] animate-bounce mb-10">
        Level Up Your Journey
      </p>
    </div>
  );
}

export default PrintPiagam;