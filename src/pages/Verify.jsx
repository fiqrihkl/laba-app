import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  HiOutlineBadgeCheck, 
  HiOutlineXCircle, 
  HiOutlineUser, 
  HiOutlineCalendar, 
  HiOutlineShieldCheck,
  HiOutlineHome,
  HiOutlineHashtag // <-- Menambahkan impor yang hilang agar tidak terjadi ReferenceError
} from "react-icons/hi";

export default function Verify() {
  const { uid, tingkat } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const tingkatKey = tingkat.toUpperCase();
          const infoLulus = userData.lulus_info?.[tingkatKey];

          // Validasi apakah anggota benar-benar sudah lulus di tingkat tersebut
          if (infoLulus && infoLulus.isLulus) {
            setData({
              nama: userData.nama,
              tingkat: tingkatKey,
              noSertifikat: infoLulus.noSertifikat,
              tglLulus: infoLulus.tglLulus?.toDate() || new Date(),
              foto: userData.photoURL || null
            });
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Verification Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (uid && tingkat) fetchVerification();
  }, [uid, tingkat]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-100">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"
      />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 animate-pulse">Menghubungkan ke Server Otoritas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 flex flex-col items-center justify-center font-sans italic selection:bg-amber-500">
      
      <div className="w-full max-w-md bg-slate-900/50 border border-white/10 rounded-[3rem] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {error ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
            <HiOutlineXCircle className="w-20 h-20 text-red-600 mx-auto" />
            <div>
              <h1 className="text-xl font-black uppercase text-white tracking-tighter">Data Tidak Valid</h1>
              <p className="text-xs text-slate-500 mt-2">Sertifikat ini tidak terdaftar dalam database resmi Laskar Bahari atau telah dicabut otoritasnya.</p>
            </div>
            <Link to="/" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              <HiOutlineHome /> Kembali ke Beranda
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
            {/* Header Status */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-600/20 text-emerald-500 px-4 py-2 rounded-full border border-emerald-500/20 mb-4 shadow-lg shadow-emerald-900/20">
                <HiOutlineBadgeCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sertifikat Terverifikasi</span>
              </div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tighter leading-none">Laskar Bahari Navigator</h1>
            </div>

            {/* Profil Anggota */}
            <div className="flex flex-col items-center gap-4 py-6 border-y border-white/5">
              <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-amber-500/30 overflow-hidden flex items-center justify-center shadow-inner">
                {data.foto ? (
                  <img src={data.foto} alt="Profile" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <HiOutlineUser size={40} className="text-slate-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Nama Anggota</p>
                <h2 className="text-xl font-black text-white uppercase italic">{data.nama}</h2>
              </div>
            </div>

            {/* Detail Kelulusan */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <HiOutlineShieldCheck className="text-amber-500 shrink-0" size={24} />
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tingkat Kecakapan</p>
                  <p className="text-xs font-black text-slate-200 uppercase tracking-tighter">Pramuka Penggalang {data.tingkat}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <HiOutlineHashtag className="text-amber-500 shrink-0" size={24} />
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Nomor Registrasi</p>
                  <p className="text-xs font-mono font-bold text-amber-500">{data.noSertifikat}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <HiOutlineCalendar className="text-amber-500 shrink-0" size={24} />
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tanggal Pelantikan</p>
                  <p className="text-xs font-black text-slate-200 uppercase tracking-tighter">
                    {data.tglLulus.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Otoritas */}
            <div className="text-center pt-4 opacity-40">
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-500">
                Dokumen Digital Sah <br /> Gugus Depan 10.491-10.492 SMPN 1 Biau
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <p className="mt-8 text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">Navigator Security System v2.0</p>
    </div>
  );
}