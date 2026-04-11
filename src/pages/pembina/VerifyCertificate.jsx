import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  HiOutlineShieldCheck, 
  HiOutlineBadgeCheck, 
  HiOutlineFingerPrint, 
  HiOutlineLockClosed,
  HiOutlineLibrary
} from 'react-icons/hi';

const VerifyCertificate = () => {
  const location = useLocation();
  // Mengambil ID penuh dari URL, menghapus prefix "/v/" dan melakukan decode karakter spesial (seperti /)
  const certId = decodeURIComponent(location.pathname.replace(/^\/v\//, ''));
  
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certId) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(collection(db, "certificates"), where("noSertifikat", "==", certId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setCertData(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Critical Verification Error:", error);
      } finally {
        // Simulasi loading agar transisi terasa halus
        setTimeout(() => setLoading(false), 1200);
      }
    };
    fetchCertificate();
  }, [certId]);

  if (loading) return (
    <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center fixed inset-0 z-[9999]">
      <div className="w-14 h-14 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin relative mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <HiOutlineFingerPrint size={24} className="text-blue-400" />
        </div>
      </div>
      <h2 className="text-white text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Menghubungkan ke Server...</h2>
      <p className="text-slate-500 text-[8px] uppercase mt-2 italic">Navi Security Protocol Active</p>
    </div>
  );

  if (!certData) return (
    <div className="h-screen w-full bg-[#020617] flex items-center justify-center p-6 fixed inset-0 z-[9999]">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-red-950/20 border border-red-500/30 p-8 rounded-[2.5rem] max-w-xs backdrop-blur-xl text-center shadow-2xl">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-white font-black">!</span>
        </div>
        <h2 className="text-white text-base font-black uppercase mb-2">Dokumen Tidak Valid</h2>
        <p className="text-slate-400 text-[9px] uppercase font-bold leading-tight mb-6 tracking-widest">
          ID Dokumen [{certId}] tidak terdaftar dalam database resmi Laskar Bahari.
        </p>
        <button onClick={() => window.location.href='/'} className="w-full py-3 bg-red-500/10 border border-red-500/50 text-red-500 text-[8px] font-black uppercase rounded-xl">Kembali ke Beranda</button>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans z-[9999] overflow-hidden p-3 selection:bg-blue-900">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[380px] w-full relative perspective-2000"
      >
        {/* CONTAINER UTAMA - 3D REALISTIC GLASS */}
        <div className="relative w-full bg-white/[0.03] backdrop-blur-[40px] rounded-[2.5rem] 
                        border-[1.5px] border-white/20
                        shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] 
                        overflow-hidden">
          
          {/* Specular Highlights */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-white/10 via-transparent to-transparent opacity-30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-[200%] animate-glass-sheen pointer-events-none" />

          <div className="relative z-10">
            {/* Header branding - Compact */}
            <div className="pt-5 pb-3 px-6 text-center border-b border-white/5 bg-white/[0.01]">
              <div className="flex justify-center mb-3">
                 <img src="/logo/logo.png" className="h-12 object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" alt="Laskar Bahari" />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 px-3 py-0.5 rounded-full backdrop-blur-md">
                <HiOutlineShieldCheck size={10} className="animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-[0.1em]">Verifikasi Berhasil</span>
              </div>
            </div>

            {/* Nama & Motivasi */}
            <div className="px-6 py-4 space-y-4 text-center">
              <div>
                <p className="text-blue-300/40 text-[7px] uppercase font-black tracking-[0.2em] mb-1 italic">Penghargaan Diberikan Kepada:</p>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md border-b-2 border-blue-600 inline-block px-4 pb-1">
                  {certData.namaPenerima}
                </h2>
              </div>
              
              <div className="px-1">
                <p className="text-slate-300/70 text-[9px] font-bold leading-relaxed italic line-clamp-6">
                  "Protokol keamanan LASKAR BAHARI mengonfirmasi bahwa identitas di atas adalah pemilik sah yang terdaftar dalam arsip digital Laskar Bahari. Sertifikat ini merupakan manifestasi dari kedisiplinan, ketangguhan, dan loyalitas Anda yang luar biasa. Teruslah mengarungi samudera kebaikan dan jadilah mercusuar inspirasi bagi sesama. Selamat berkarya, Pandu Sejati!"
                </p>
              </div>
            </div>

            {/* Grid Detail Data - Compact */}
            <div className="px-6 grid grid-cols-2 gap-2">
              {[
                { label: "Kegiatan / Proyek", value: certData.eventTitle },
                { label: "Nomor Registrasi", value: certData.noSertifikat },
                { label: "Waktu Penetapan", value: certData.eventDate },
                { label: "Lokasi Otoritas", value: certData.eventLocation },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/10 p-2.5 rounded-xl group transition-all hover:bg-white/[0.06]">
                  <p className="text-blue-300/30 text-[6px] font-black mb-0.5 uppercase tracking-widest">{item.label}</p>
                  <p className={`text-white font-bold text-[9px] uppercase truncate ${item.label === 'Nomor Registrasi' ? 'text-blue-400 font-mono tracking-normal' : ''}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Otoritas Area */}
            <div className="px-6 py-5 flex justify-between items-end border-t border-white/5 mt-4 bg-black/5 relative">
              {/* Fake Holographic Seal */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none" />
              
              <div className="space-y-2 relative z-10">
                <div className="bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5 w-fit">
                   <HiOutlineLockClosed size={10} className="text-emerald-500" />
                   <p className="text-[6px] text-emerald-500 font-black uppercase italic tracking-tighter">Database Signature Validated</p>
                </div>
                <div>
                   <p className="text-[10px] text-white font-black uppercase leading-none">Laskar Bahari</p>
                   <p className="text-[6px] text-slate-500 font-bold uppercase tracking-widest">Gudep 10.491 - 10.492 SMPN 1 Biau</p>
                </div>
              </div>

              <div className="relative text-center min-w-[90px] z-10">
                <div className="relative flex flex-col items-center">
                   {/* Realistic Digital Stamp (CSS Based) */}
                   <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600/20 to-blue-400/20 shadow-lg flex items-center justify-center border-2 border-white/30 mb-1 rotate-6 relative backdrop-blur-sm">
                     <HiOutlineBadgeCheck size={28} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                     {/* Circular Text Placeholder (Visual Only) */}
                     <div className="absolute inset-0 border border-blue-500/30 rounded-full scale-110 animate-[spin_10s_linear_infinite]" />
                   </div>
                   <p className="text-[8px] font-black text-white uppercase underline decoration-blue-600 decoration-2">Pembina Satuan</p>
                   <p className="text-[6px] text-slate-500 font-bold uppercase tracking-widest mt-1">Otoritas Database</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Metadata Bar */}
          <div className="bg-black/40 py-2 px-6 text-center border-t border-white/5">
            <p className="text-[6px] text-slate-500 font-mono tracking-[0.2em] uppercase opacity-60 italic">
              Navi Protocol Secure Archive • {new Date().getFullYear()} • REV: 2.0.4
            </p>
          </div>
        </div>
      </motion.div>

      {/* Motto Footer */}
      <div className="mt-6 text-center px-8 opacity-40">
        <p className="text-white text-[8px] font-black uppercase tracking-[0.4em] italic leading-relaxed">
          Satyaku Kudarmakan, Darmaku Kubaktikan
        </p>
      </div>

      {/* Custom Styles for Glass Effect */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glass-sheen {
          0% { transform: translateX(-150%) skewX(-25deg); }
          30%, 100% { transform: translateX(150%) skewX(-25deg); }
        }
        .animate-glass-sheen {
          animation: glass-sheen 6s infinite ease-in-out;
        }
        .perspective-2000 {
          perspective: 2000px;
        }
        .line-clamp-6 {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}} />
    </div>
  );
};

export default VerifyCertificate;