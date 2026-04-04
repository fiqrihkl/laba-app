import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineBadgeCheck, HiOutlineFingerPrint, HiOutlineLibrary, HiOutlineLockClosed } from 'react-icons/hi';

const VerifyCertificate = () => {
  const { certId } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const q = query(
          collection(db, "certificates"), 
          where("noSertifikat", "==", certId)
        );
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
    <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-6 font-sans fixed inset-0 z-[9999]">
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
      <div className="bg-red-950/20 border border-red-500/30 p-8 rounded-[2rem] max-w-xs backdrop-blur-xl text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl text-white font-black">!</span>
        </div>
        <h2 className="text-white text-lg font-black uppercase tracking-tighter mb-2">Data Tidak Ditemukan</h2>
        <p className="text-slate-400 text-[10px] uppercase font-bold leading-tight mb-6 tracking-widest text-center">
          Mohon maaf, ID Sertifikat [{certId}] tidak terdaftar dalam sistem database kami. Silakan periksa kembali kode atau hubungi sekretariat Laskar Bahari.
        </p>
        <button onClick={() => window.location.href='/'} className="w-full py-3 bg-red-500/10 border border-red-500/50 text-red-500 text-[8px] font-black uppercase rounded-xl">Kembali ke Beranda</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 h-screen w-full bg-[#020617] flex flex-col items-center justify-center font-sans z-[9999] p-4 overflow-hidden selection:bg-blue-900">
      
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-900 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden relative"
      >
        {/* Blue Ribbon Accent */}
        <div className="absolute top-0 right-8 w-10 h-12 bg-blue-600 flex items-end justify-center pb-2 shadow-lg z-20">
          <HiOutlineBadgeCheck size={20} className="text-white" />
        </div>

        {/* Status Header */}
        <div className="p-5 text-center border-b border-slate-100 bg-slate-50/80 relative">
          <div className="flex justify-center gap-4 mb-2">
             <img src="/logo/logo.png" className="h-12 object-contain" alt="Laskar Bahari" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-1 rounded-full mb-1 shadow-sm">
            <HiOutlineShieldCheck size={14} className="text-emerald-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Sertifikat Terverifikasi Asli</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 space-y-4 relative">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.10] pointer-events-none p-12">
            <img src="/logo/logo.png" className="object-contain" alt="Laskar Bahari" />
          </div>

          <div className="text-center relative z-10">
            <p className="text-slate-400 text-[8px] uppercase font-black tracking-[0.2em] mb-2">Penghargaan Diberikan Kepada:</p>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none border-b-4 border-blue-600 inline-block px-4 pb-1">
              {certData.namaPenerima}
            </h2>
            
            {/* Semangat Text Section */}
            <div className="mt-4 px-2">
              <p className="text-slate-600 text-[10px] font-bold leading-relaxed">
                "Sistem mengonfirmasi bahwa identitas di atas adalah pemilik sah dari sertifikat ini. Terima kasih telah menunjukkan dedikasi dan semangat juang yang tinggi dalam kegiatan Laskar Bahari. Teruslah berkarya, pandu sejati!"
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-2 relative z-10">
            {[
              { label: "Kegiatan / Proyek", value: certData.eventTitle },
              { label: "Nomor Registrasi", value: certData.noSertifikat },
              { label: "Waktu Penetapan", value: certData.eventDate },
              { label: "Lokasi Otoritas", value: certData.eventLocation },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <p className="text-slate-400 text-[7px] font-black mb-0.5 tracking-tighter uppercase">{item.label}</p>
                <p className={`text-slate-800 font-bold text-[9px] uppercase leading-tight ${item.label === 'Nomor Registrasi' ? 'text-blue-700 font-mono' : ''}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Otoritas Area - Signature & Hologram Upgrade */}
          <div className="flex items-end justify-between pt-4 relative z-10 border-t border-slate-50">
            <div className="space-y-2">
               <div>
                 <p className="text-[6px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1 text-left">Diterbitkan Oleh:</p>
                 <p className="text-[9px] text-slate-800 font-black uppercase leading-none text-left">Pasukan Laskar Bahari</p>
                 <p className="text-[7px] text-slate-500 font-bold uppercase text-left">Gudep 10.491 - 10.492 SMPN 1 Biau</p>
               </div>
               {/* 2. Status "Signed by System" */}
               <div className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm inline-flex">
                 <HiOutlineLockClosed size={10} className="text-emerald-600" />
                 <p className="text-[6px] text-emerald-600 font-black uppercase italic tracking-tighter">Signed by System - Official Database Validation</p>
               </div>
            </div>
            
            <div className="relative text-center min-w-[100px]">
               {/* Stempel Original
               <img src="/stempel-official.png" className="h-14 absolute -top-8 -left-5 opacity-60 rotate-12 pointer-events-none" alt="Seal" /> */}
               
               <div className="relative z-10 flex flex-col items-center">
                  {/* 3. Hologram Keamanan Digital */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg flex items-center justify-center border-2 border-white/50 mb-1">
                    <HiOutlineBadgeCheck size={22} className="text-white drop-shadow-md animate-pulse" />
                  </div>
                  <div className="border-b border-slate-200 mb-1 w-full flex items-end justify-center italic text-slate-300 text-[7px] tracking-widest uppercase font-bold">Otoritas Sah</div>
                  <p className="text-[8px] font-black text-slate-900 uppercase underline decoration-blue-600 decoration-2">Pembina Satuan</p>
                  <p className="text-[5px] text-slate-400 font-black uppercase mt-1 tracking-widest">Tervalidasi Digital</p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Technical Metadata */}
        <div className="bg-[#020617] p-3 text-center">
          <p className="text-[6px] text-slate-500 font-mono tracking-widest uppercase opacity-50 italic">
            Arsip Digital Laskar Bahari • ID-WEST-BIAU • {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>

      {/* Semangat Footer */}
      <div className="mt-8 text-center px-8 opacity-40">
        <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.3em] leading-relaxed">
          Ikhlas Bakti Bina Bangsa Berbudi Bawa Laksana
        </p>
      </div>
    </div>
  );
};

export default VerifyCertificate;