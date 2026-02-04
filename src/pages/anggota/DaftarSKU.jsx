import React, { useState, useEffect, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineChevronRight,
  HiOutlineCheckCircle, 
  HiOutlineClock, 
  HiOutlineAcademicCap,
  HiBookOpen,
  HiOutlineIdentification,
  HiOutlineBadgeCheck,
  HiOutlineQrcode
} from "react-icons/hi";

// --- KOMPONEN HALAMAN BUKU ---
const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page bg-[#fdf6e3] shadow-inner overflow-hidden flex flex-col border-l border-black/5" ref={ref}>
      <div className="p-6 h-full border-2 border-[#e2dcc8] m-2 relative flex flex-col shadow-sm">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')` }} />
        {props.children}
        <div className="mt-auto text-center text-[10px] font-bold text-slate-400 italic">
          - {props.number} -
        </div>
      </div>
    </div>
  );
});

export default function DaftarSKU({ userData }) {
  const [masterSKU, setMasterSKU] = useState([]);
  const [skuProgress, setSkuProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const flipBook = useRef(null);
  const navigate = useNavigate();

  const userAgama = userData?.agama || "";

  const getTargetTingkat = () => {
    const tingkatUser = userData?.tingkat?.toUpperCase();
    if (!tingkatUser || tingkatUser === "BELUM ADA TINGKATAN") return "Ramu";
    if (tingkatUser === "RAMU") return "Rakit";
    if (tingkatUser === "RAKIT") return "Terap";
    return "Ramu"; 
  };

  const tingkatTarget = getTargetTingkat();

  // Logika validasi pengesahan (Cek apakah semua poin verified)
  const isAllVerified = masterSKU.length > 0 && masterSKU.every(poin => 
    skuProgress[`${poin.nomor}-${poin.deskripsi}`] === "verified"
  );

  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);

    const qMaster = query(
      collection(db, "master_sku"),
      where("tingkat", "==", tingkatTarget),
      orderBy("nomor", "asc")
    );

    const unsubMaster = onSnapshot(qMaster, (snap) => {
      let list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (Number(data.nomor) === 4) {
          if (data.sub_agama?.toLowerCase() === userAgama?.toLowerCase()) {
            list.push({ id: doc.id, ...data });
          }
        } else {
          list.push({ id: doc.id, ...data });
        }
      });
      setMasterSKU(list);
    });

    const qProgress = query(
      collection(db, "sku_progress"),
      where("uid", "==", auth.currentUser.uid),
      where("tingkat", "==", tingkatTarget)
    );

    const unsubProgress = onSnapshot(qProgress, (snap) => {
      const progressMap = {};
      snap.forEach((doc) => {
        const data = doc.data();
        const uniqueKey = `${data.nomor_poin}-${data.deskripsi_poin}`;
        progressMap[uniqueKey] = data.status;
      });
      setSkuProgress(progressMap);
      setLoading(false);
    });

    return () => { unsubMaster(); unsubProgress(); };
  }, [tingkatTarget, auth.currentUser, userAgama]);

  const handleAjukan = async (poin) => {
    const uniqueKey = `${poin.nomor}-${poin.deskripsi}`;
    if (skuProgress[uniqueKey]) return;
    setSubmitting(poin.id);
    try {
      await addDoc(collection(db, "sku_progress"), {
        uid: auth.currentUser.uid,
        nama_anggota: userData?.nama || "Anggota",
        tingkat: tingkatTarget,
        nomor_poin: Number(poin.nomor),
        deskripsi_poin: poin.deskripsi,
        kategori: (poin.kategori || "SPIRITUAL").toUpperCase(),
        sub_agama: poin.sub_agama || "", 
        status: "pending",
        tgl_pengajuan: serverTimestamp(),
        verifikator_nama: "",
      });
    } catch (error) {
      alert("Gagal mengirim pengajuan.");
    } finally {
      setSubmitting(null);
    }
  };

  const chunkSKU = (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };
  const skuPages = chunkSKU(masterSKU, 5);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
        <HiOutlineAcademicCap size={60} className="text-red-500 opacity-50" />
      </motion.div>
      <p className="font-black italic uppercase text-[10px] tracking-[0.4em] mt-8 text-slate-500">Membuka Lembaran SKU...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center py-10 px-4 overflow-hidden selection:bg-red-800 italic">
      
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full border border-white/10 active:scale-90 transition shadow-lg">
          <HiOutlineChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">Buku SKU Digital</h2>
          <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] mt-1">Laskar Bahari Navigator</p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-red-600 rounded-2xl rotate-12 shadow-lg shadow-red-600/20 border border-white/10 text-white">
          <HiBookOpen className="w-6 h-6" />
        </div>
      </div>

      <div className="relative group">
        <HTMLFlipBook 
          width={320} height={480} size="fixed" minWidth={200} maxWidth={1000}
          minHeight={300} maxHeight={1533} showCover={true} flipAngle={30}
          className="shadow-2xl" ref={flipBook} maxShadowOpacity={0.5}
          mobileScrollSupport={true} clickEventForward={true} useMouseEvents={true}
          swipeDistance={30} showPageCorners={true} disableFlipByClick={false} startPage={0}
        >
          {/* COVER DEPAN */}
          <Page number="Cover">
            <div className="flex flex-col items-center justify-between h-full py-4 px-2 border-[1px] border-[#8b4513]/20 rounded-sm">
              <div className="w-full h-full border-[2px] border-[#8b4513]/30 p-4 flex flex-col items-center relative rounded-sm shadow-inner bg-[#fdf6e3]/50">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8b4513]/30" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#8b4513]/30" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Gerakan Pramuka</p>
                <div className="w-24 h-24 mb-4 p-2 bg-white/50 rounded-full shadow-sm border border-[#8b4513]/10">
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-center space-y-1">
                  <h1 className="text-[28px] font-black text-slate-800 uppercase leading-[0.8] tracking-tighter italic">
                    Syarat <br/> Kecakapan <br/> <span className="text-red-700">Umum</span>
                  </h1>
                </div>

                <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#8b4513]/50 to-transparent my-1" />

                <div className="flex flex-col items-center">
                   <div className="px-5 py-1.5 border-2 border-red-700 rounded-full">
                     <p className="text-xs font-black text-red-700 uppercase tracking-[0.3em]">
                        {tingkatTarget}
                     </p>
                   </div>
                </div>
                <div className="mt-auto w-full px-2">
                  <div className="relative p-4 border border-[#8b4513]/20 rounded-lg bg-white/20 shadow-sm overflow-hidden text-left">
                    <HiOutlineIdentification className="absolute -right-2 -bottom-2 w-16 h-16 text-[#8b4513]/5 rotate-[-15deg]" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-700 rounded-full" /> Identitas Pemilik:
                    </p>
                    <div className="border-l-2 border-red-700 pl-3">
                      <p className="text-[13px] font-black text-slate-900 uppercase italic tracking-wide leading-none py-1">
                        {userData?.nama || "NAVI MEMBER"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Page>

          {/* HALAMAN ISI SKU */}
          {skuPages.map((pageItems, pIdx) => (
            <Page key={pIdx} number={pIdx + 1}>
              <h4 className="text-[10px] font-black text-red-800 uppercase italic mb-4 border-b border-red-800/20 pb-1 flex justify-between">
                <span>Misi Utama</span>
                <span>{tingkatTarget}</span>
              </h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2 text-[8px] uppercase font-black border border-slate-800">No</th>
                    <th className="p-2 text-[8px] uppercase font-black border border-slate-800 text-left">Misi Pengembangan</th>
                    <th className="p-2 text-[8px] uppercase font-black border border-slate-800 text-center">Paraf</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((poin) => {
                    const status = skuProgress[`${poin.nomor}-${poin.deskripsi}`];
                    const isVerified = status === "verified";
                    const isPending = status === "pending";
                    return (
                      <tr key={poin.id} className="border-b border-slate-300">
                        <td className="p-2 text-[10px] font-black italic text-slate-800 text-center align-top">{poin.nomor}</td>
                        <td className="p-2 align-top text-left">
                          <p className={`text-[9px] font-bold italic leading-snug text-slate-700 ${isVerified ? "line-through opacity-40" : ""}`}>
                            {poin.deskripsi}
                          </p>
                        </td>
                        <td className="p-2 text-center align-middle">
                          <AnimatePresence mode="wait">
                            {isVerified ? (
                              <HiOutlineCheckCircle className="text-emerald-600 w-5 h-5 mx-auto" />
                            ) : isPending ? (
                              <HiOutlineClock className="text-amber-600 w-5 h-5 mx-auto animate-pulse" />
                            ) : (
                              <button onClick={() => handleAjukan(poin)} disabled={submitting === poin.id}
                                className="bg-red-800 text-white text-[7px] font-black px-2 py-1.5 rounded uppercase active:scale-95 disabled:opacity-30 border border-white/10"
                              >
                                {submitting === poin.id ? "..." : "Uji"}
                              </button>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Page>
          ))}

          {/* --- LEMBAR PENGESAHAN (HALAMAN TERAKHIR BARU) --- */}
          <Page number="Pengesahan">
            <div className="flex flex-col items-center h-full py-4 text-center border-[1px] border-[#8b4513]/20 m-1 rounded-sm">
              <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-red-700 pb-1 mb-6">
                Lembar Pengesahan
              </h3>

              <div className="w-full px-4 mb-6">
                <p className="text-[9px] text-slate-600 italic leading-relaxed mb-4">
                  Berdasarkan hasil ujian Syarat Kecakapan Umum (SKU) tingkat <span className="font-bold text-red-700">{tingkatTarget}</span>, 
                  dengan ini menyatakan bahwa pemilik buku ini:
                </p>
                
                <div className="bg-white/30 p-3 rounded-lg border border-slate-300 shadow-inner">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Nama Lengkap:</p>
                  <p className="text-[11px] font-black text-slate-900 uppercase italic text-left border-l-2 border-red-700 pl-2">
                    {userData?.nama || "ANGGOTA LASKAR BAHARI"}
                  </p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3 mb-1 text-left">Sistem ID (Digital):</p>
                  <p className="text-[9px] font-mono text-slate-600 text-left bg-slate-200 px-2 py-1 rounded">
                    {auth.currentUser?.uid.substring(0, 16).toUpperCase()}...
                  </p>
                </div>
              </div>

              {/* Status Validasi */}
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-400 rounded-2xl mb-6 relative overflow-hidden bg-slate-50/50 min-w-[180px]">
                {isAllVerified ? (
                  <>
                    <HiOutlineBadgeCheck className="w-12 h-12 text-emerald-600 mb-1" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">Dokumen Sah</p>
                    <p className="text-[7px] text-slate-500 mt-1 uppercase">Terverifikasi Sistem NAVIGASI</p>
                    <div className="absolute top-0 right-0 opacity-10"><HiOutlineQrcode size={50} /></div>
                  </>
                ) : (
                  <>
                    <HiOutlineClock className="w-10 h-10 text-slate-400 mb-1" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Proses Ujian</p>
                    <p className="text-[7px] text-slate-400 mt-1 uppercase italic">Belum Dapat Disahkan</p>
                  </>
                )}
              </div>

              <div className="mt-auto space-y-2 px-6">
                <p className="text-[8px] text-slate-500 italic">Disahkan secara digital oleh</p>
                <div className="h-[1px] w-full bg-slate-300" />
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">Pembina Gugus Depan</p>
                <p className="text-[7px] text-red-700 font-bold uppercase tracking-tighter">10.491-10.492 SMP NEGERI 1 BIAU</p>
              </div>
            </div>
          </Page>

          {/* COVER BELAKANG */}
          <Page number="End">
            <div className="flex flex-col items-center justify-center h-full text-center p-6 border-[1px] border-[#8b4513]/20 m-1 rounded-sm">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-6 tracking-[0.5em]">Otoritas Penerbit</p>
              <h3 className="text-xs font-black italic text-slate-800 uppercase tracking-widest leading-relaxed">
                Gugus Depan <br/> <span className="text-red-700 text-sm">10.491-10.492</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-bold mb-10">SMP NEGERI 1 BIAU</p>
              <div className="relative py-6 px-6 border-y-2 border-double border-slate-300 w-full text-center">
                <div className="italic text-[10px] text-slate-600 font-bold leading-relaxed tracking-wider uppercase">
                  "Dilaut Kami Jaya, <br/> Di Darat Kami Bisa"
                </div>
              </div>
              <div className="mt-auto opacity-50">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigator System v1.2</p>
              </div>
            </div>
          </Page>
        </HTMLFlipBook>

        {/* TOMBOL NAVIGASI */}
        <div className="flex justify-between w-full mt-8 px-4">
          <button type="button" onClick={() => flipBook.current.pageFlip().flipPrev()}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-all active:scale-90 p-3 bg-white/5 rounded-2xl border border-white/10"
          >
            <HiOutlineChevronLeft className="w-4 h-4 text-red-600" /> Sebelumnya
          </button>
          <button type="button" onClick={() => flipBook.current.pageFlip().flipNext()}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-all active:scale-90 p-3 bg-white/5 rounded-2xl border border-white/10"
          >
            Selanjutnya <HiOutlineChevronRight className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="mt-12 text-center opacity-40">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] italic text-slate-500">Sentuh ujung kertas untuk membalik halaman</p>
      </div>
    </div>
  );
}