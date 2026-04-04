import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  HiOutlineShieldCheck, 
  HiOutlineBadgeCheck, 
  HiOutlineFingerPrint, 
  HiOutlineLockClosed 
} from 'react-icons/hi';

const VerifyCertificate = () => {
  const { certId } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const q = query(collection(db, "certificates"), where("noSertifikat", "==", certId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setCertData(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setTimeout(() => setLoading(false), 1200);
      }
    };
    fetchCertificate();
  }, [certId]);

  if (loading) return (
    <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center fixed inset-0 z-[9999]">
      <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin relative mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <HiOutlineFingerPrint size={28} className="text-blue-400" />
        </div>
      </div>
      <h2 className="text-white text-[10px] font-black uppercase tracking-[0.5em]">Otentikasi Dokumen...</h2>
    </div>
  );

  if (!certData) return (
    <div className="h-screen w-full bg-[#020617] flex items-center justify-center p-6 fixed inset-0 z-[9999]">
      <div className="bg-red-950/20 border border-red-500/30 p-8 rounded-[2.5rem] max-w-xs backdrop-blur-xl text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-white font-black">!</span>
        </div>
        <h2 className="text-white text-lg font-black uppercase mb-2">Data Tidak Ditemukan</h2>
        <p className="text-slate-400 text-[10px] uppercase font-bold leading-tight mb-6 tracking-widest">
          Mohon maaf, ID Sertifikat [{certId}] tidak terdaftar dalam sistem database kami.
        </p>
        <button onClick={() => window.location.href='/'} className="w-full py-3 bg-red-500/10 border border-red-500/50 text-red-500 text-[8px] font-black uppercase rounded-xl transition-all">Kembali ke Beranda</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans z-[9999] overflow-hidden p-4 selection:bg-blue-900">
      
      {/* Background Latar Biru Bersinar */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-[420px] w-full relative perspective-2000"
      >
        {/* CONTAINER UTAMA - 3D REALISTIC GLASS */}
        <div className="relative w-full bg-white/[0.03] backdrop-blur-[45px] rounded-[3rem] 
                        border-[1.5px] border-white/20
                        shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.1)] 
                        overflow-hidden">
          
          {/* REFLEKTOR CAHAYA SUDUT (SPECULAR HIGHLIGHTS) */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/20 via-transparent to-transparent opacity-40 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-[200%] animate-glass-sheen pointer-events-none" />

          {/* ISI KONTEN */}
          <div className="relative z-10">
            {/* Header Branding */}
            <div className="pt-8 pb-4 px-8 text-center border-b border-white/5 bg-white/[0.01]">
              <div className="flex justify-center mb-4">
                 <img src="/logo/logo.png" className="h-20 object-contain filter drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" alt="Laskar Bahari" />
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 px-4 py-1 rounded-full shadow-inner backdrop-blur-md">
                <HiOutlineShieldCheck size={12} className="animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Sertifikat Terverifikasi Asli</span>
              </div>
            </div>

            {/* Area Nama & Kalimat Motivasi */}
            <div className="p-8 pb-4 space-y-4 text-center">
              <div>
                <p className="text-blue-300/40 text-[8px] uppercase font-black tracking-[0.3em] mb-2">Penghargaan Diberikan Kepada:</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md border-b-2 border-blue-500/50 inline-block px-4 pb-1">
                  {certData.namaPenerima}
                </h2>
              </div>
              
              <div className="px-2">
                <p className="text-slate-300/70 text-[9px] font-bold leading-relaxed italic text-center">
                  "Protokol keamanan LASKAR BAHARI mengonfirmasi bahwa identitas di atas adalah pemilik sah yang terdaftar dalam arsip digital Laskar Bahari. Sertifikat ini merupakan manifestasi dari kedisiplinan, ketangguhan, dan loyalitas Anda yang luar biasa di bawah panji Laskar Bahari. Teruslah mengarungi samudera kebaikan dan jadilah mercusuar inspirasi bagi sesama. Jangan pernah berhenti berkarya; dunia menanti dharma baktimu, Pandu Sejati!"
                </p>
              </div>
            </div>

            {/* Grid Detail Data */}
            <div className="px-8 grid grid-cols-2 gap-2">
              {[
                { label: "Kegiatan / Proyek", value: certData.eventTitle },
                { label: "Nomor Registrasi", value: certData.noSertifikat },
                { label: "Waktu Penetapan", value: certData.eventDate },
                { label: "Lokasi Otoritas", value: certData.eventLocation },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  <p className="text-blue-300/30 text-[6px] font-black mb-1 uppercase tracking-widest">{item.label}</p>
                  <p className={`text-white font-bold text-[9px] uppercase truncate ${item.label === 'Nomor Registrasi' ? 'text-blue-400 font-mono' : ''}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Otoritas & Tanda Tangan Digital */}
            <div className="p-8 flex justify-between items-end border-t border-white/5 mt-6 bg-black/10">
              <div className="space-y-3">
                <div className="bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 w-fit">
                   <HiOutlineLockClosed size={10} className="text-emerald-500" />
                   <p className="text-[6px] text-emerald-500 font-black uppercase italic tracking-tighter">Signed by System - Official Database Validation</p>
                </div>
                <div>
                   <p className="text-[10px] text-white font-black uppercase leading-none">Pasukan Laskar Bahari</p>
                   <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Gudep 10.491 - 10.492 SMPN 1 Biau</p>
                </div>
              </div>

              <div className="relative text-center min-w-[90px]">
                <div className="relative z-10 flex flex-col items-center">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg flex items-center justify-center border-2 border-white/20 mb-1 rotate-6">
                     <HiOutlineBadgeCheck size={26} className="text-white drop-shadow-md animate-pulse" />
                   </div>
                   <p className="text-[8px] font-black text-white uppercase underline decoration-blue-500 decoration-1 underline-offset-2">Pembina Satuan</p>
                   <p className="text-[5px] text-slate-500 font-black uppercase mt-1 tracking-widest text-center">Tervalidasi Digital</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="bg-black/40 py-2 px-8 text-center border-t border-white/5">
            <p className="text-[6px] text-slate-500 font-mono tracking-[0.3em] uppercase opacity-60">
              Arsip Digital Laskar Bahari • ID-10.491-10.492 • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Slogan Footer */}
      <div className="mt-8 text-center px-8 opacity-40">
        <p className="text-white text-[8px] font-black uppercase tracking-[0.4em] leading-relaxed">
          Dilaut Kami Jaya, Didarat Kami Bisa
        </p>
      </div>

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
        @media (max-height: 700px) {
          .max-w-[420px] { max-width: 350px; }
          h2 { font-size: 1.25rem !important; }
          .p-8 { padding: 1rem !important; }
        }
      `}} />
    </div>
  );
};

export default VerifyCertificate;