import React, { useState, useEffect } from "react";
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
  HiOutlineCheckCircle, 
  HiOutlineClock, 
  HiOutlineDocumentText,
  HiOutlineAcademicCap,
  HiOutlineFire
} from "react-icons/hi";

export default function DaftarSKU({ userData }) {
  const [masterSKU, setMasterSKU] = useState([]);
  const [skuProgress, setSkuProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const navigate = useNavigate();

  // --- LOGIKA PENENTUAN TINGKATAN SKU ---
  const getTargetTingkat = () => {
    const tingkatUser = userData?.tingkat?.toUpperCase();
    if (!tingkatUser || tingkatUser === "BELUM ADA TINGKATAN") return "Ramu";
    if (tingkatUser === "RAMU") return "Rakit";
    if (tingkatUser === "RAKIT") return "Terap";
    if (tingkatUser === "TERAP") return "Terap"; 
    return "Ramu"; 
  };

  const tingkatTarget = getTargetTingkat();

  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);

    const qMaster = query(
      collection(db, "master_sku"),
      where("tingkat", "==", tingkatTarget),
      orderBy("nomor", "asc")
    );

    const unsubMaster = onSnapshot(qMaster, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
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
        progressMap[String(data.nomor_poin)] = data.status;
      });
      setSkuProgress(progressMap);
      setLoading(false);
    });

    return () => {
      unsubMaster();
      unsubProgress();
    };
  }, [tingkatTarget, auth.currentUser]);

  const handleAjukan = async (poin) => {
    if (skuProgress[String(poin.nomor)]) return;
    setSubmitting(poin.nomor);
    try {
      await addDoc(collection(db, "sku_progress"), {
        uid: auth.currentUser.uid,
        nama_anggota: userData?.nama || "Anggota",
        tingkat: tingkatTarget,
        nomor_poin: Number(poin.nomor),
        deskripsi_poin: poin.deskripsi,
        status: "pending",
        tgl_pengajuan: serverTimestamp(),
        verifikator_nama: "",
      });
    } catch (error) {
      console.error("Error Pengajuan:", error);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <HiOutlineAcademicCap size={60} className="text-blue-500 opacity-50" />
      </motion.div>
      <p className="font-black italic uppercase text-[10px] tracking-[0.4em] mt-8 text-slate-500">Membuka Gulungan SKU...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans overflow-x-hidden selection:bg-red-800">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-white/5">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] px-6 pt-12 pb-24 relative overflow-hidden rounded-b-[4rem] shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />
          </div>

          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition z-50 mb-8"
          >
            <HiOutlineChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div className="relative z-10">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">
              TINGKATAN <br /> <span className="text-red-500 tracking-widest">{tingkatTarget}</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-red-600 rounded-full" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                {userData?.tingkat === "Terap" ? "Level Maksimal" : "Daftar SKU"}
              </p>
            </div>
          </div>
          
          <HiOutlineAcademicCap className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.03] rotate-12" />
        </div>

        {/* LIST POIN SKU */}
        <div className="px-6 -mt-10 space-y-4 relative z-20">
          {masterSKU.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-12 text-center border border-white/10 flex flex-col items-center">
              <HiOutlineDocumentText className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-relaxed italic">
                Buku SKU {tingkatTarget} belum tersedia <br /> dalam kurikulum saat ini.
              </p>
            </div>
          ) : (
            masterSKU.map((poin, index) => {
              const status = skuProgress[String(poin.nomor)];
              const isVerified = status === "verified";
              const isPending = status === "pending";

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={poin.id}
                  className={`relative p-6 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 group overflow-hidden ${
                    isVerified 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : isPending 
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-slate-900/60 border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-sm shadow-2xl transition-all duration-500 ${
                        isVerified ? "bg-emerald-500 text-white shadow-emerald-500/20 rotate-12" : "bg-white/5 text-slate-400"
                      }`}>
                        {poin.nomor}
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 block mb-1">Misi #{poin.nomor}</span>
                        <div className="flex items-center gap-2">
                          <HiOutlineFire className={isVerified ? "text-red-500" : "text-slate-700"} />
                          <span className="text-[10px] font-black uppercase italic text-slate-300 tracking-tighter">Butir SKU</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <AnimatePresence mode="wait">
                        {isVerified ? (
                          <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="flex items-center gap-1.5 bg-emerald-500 px-4 py-2 rounded-full shadow-lg shadow-emerald-500/20"
                          >
                            <HiOutlineCheckCircle className="w-4 h-4 text-white" />
                            <span className="text-white text-[9px] font-black uppercase tracking-widest">Lulus</span>
                          </motion.div>
                        ) : isPending ? (
                          <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="flex items-center gap-1.5 bg-amber-500/20 px-4 py-2 rounded-full border border-amber-500/30 animate-pulse"
                          >
                            <HiOutlineClock className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-500 text-[9px] font-black uppercase tracking-widest">Antrean</span>
                          </motion.div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={submitting === poin.nomor}
                            onClick={() => handleAjukan(poin)}
                            className="bg-white text-[#020617] text-[9px] font-black px-5 py-2.5 rounded-2xl uppercase tracking-widest shadow-xl disabled:opacity-30"
                          >
                            {submitting === poin.nomor ? "Sync..." : "Ajukan Ujian"}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="relative z-10 pl-2 border-l-2 border-white/5 group-hover:border-red-500/30 transition-colors">
                    <p className={`text-[12px] leading-relaxed font-bold italic transition-all duration-500 ${
                      isVerified ? "text-slate-500 line-through opacity-50" : "text-slate-300"
                    }`}>
                      "{poin.deskripsi}"
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-16 text-center border-t border-white/5 mt-auto">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose italic">
            Developed by <span className="text-red-600">Fiqri Haikal</span> <br />
            Level Up Your Scout Adventure! <br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}