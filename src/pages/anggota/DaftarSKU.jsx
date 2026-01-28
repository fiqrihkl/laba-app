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
import { Link, useNavigate } from "react-router-dom";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineCheckCircle, 
  HiOutlineClock, 
  HiOutlineDocumentText,
  HiOutlineAcademicCap
} from "react-icons/hi";

export default function DaftarSKU({ userData }) {
  const [masterSKU, setMasterSKU] = useState([]);
  const [skuProgress, setSkuProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const navigate = useNavigate();

  // --- LOGIKA PENENTUAN TINGKATAN SKU YANG DITAMPILKAN ---
  const getTargetTingkat = () => {
    const tingkatUser = userData?.tingkat?.toUpperCase();

    if (!tingkatUser || tingkatUser === "BELUM ADA TINGKATAN") {
      return "Ramu";
    } else if (tingkatUser === "RAMU") {
      return "Rakit";
    } else if (tingkatUser === "RAKIT") {
      return "Terap";
    } else if (tingkatUser === "TERAP") {
      return "Terap"; 
    }
    return "Ramu"; 
  };

  const tingkatTarget = getTargetTingkat();

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);

    // 1. Ambil Master Data SKU sesuai tingkatan target
    const qMaster = query(
      collection(db, "master_sku"),
      where("tingkat", "==", tingkatTarget),
      orderBy("nomor", "asc")
    );

    const unsubMaster = onSnapshot(
      qMaster,
      (snap) => {
        const list = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setMasterSKU(list);
      },
      (err) => console.error("Gagal memuat Master SKU:", err)
    );

    // 2. Ambil Progres SKU Siswa secara real-time pada tingkatan target tersebut
    const qProgress = query(
      collection(db, "sku_progress"),
      where("uid", "==", auth.currentUser.uid),
      where("tingkat", "==", tingkatTarget)
    );

    const unsubProgress = onSnapshot(
      qProgress,
      (snap) => {
        const progressMap = {};
        snap.forEach((doc) => {
          const data = doc.data();
          progressMap[String(data.nomor_poin)] = data.status;
        });
        setSkuProgress(progressMap);
        setLoading(false);
      },
      (err) => {
        console.error("Gagal memuat Progres:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubMaster();
      unsubProgress();
    };
  }, [tingkatTarget, auth.currentUser]);

  const handleAjukan = async (poin) => {
    if (skuProgress[String(poin.nomor)]) {
      return alert("Poin ini sudah diajukan atau sudah lulus.");
    }

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
      alert(`Berhasil! Poin ${poin.nomor} ${tingkatTarget} telah diajukan ke Pembina.`);
    } catch (error) {
      console.error("Error Pengajuan:", error);
      alert("Gagal mengirim pengajuan.");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
        <div className="text-center font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-widest">
          Sinkronisasi Buku SKU...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 pt-12 pb-24 px-8 rounded-b-[4.5rem] text-white relative shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition z-10">
          <HiOutlineChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="text-center mt-4 relative z-10">
          <HiOutlineAcademicCap className="w-10 h-10 mx-auto mb-4 text-blue-300 opacity-50" />
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
            Buku SKU {tingkatTarget}
          </h1>
          <p className="text-[10px] font-bold text-blue-200 uppercase mt-3 tracking-[0.2em] opacity-80">
            {userData?.tingkat === "Terap" ? "Level Maksimal Tercapai" : `Target Pelantikan: ${tingkatTarget}`}
          </p>
        </div>
      </div>

      {/* DAFTAR POIN SKU */}
      <div className="px-6 -mt-10 space-y-4 relative z-20">
        {masterSKU.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] text-center shadow-xl border border-slate-100 flex flex-col items-center">
            <HiOutlineDocumentText className="w-10 h-10 text-slate-100 mb-4" />
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-loose">
              Belum ada kurikulum SKU {tingkatTarget} <br /> yang dirilis oleh Pembina.
            </p>
          </div>
        ) : (
          masterSKU.map((poin) => {
            const status = skuProgress[String(poin.nomor)];

            return (
              <div
                key={poin.id}
                className={`bg-white p-6 rounded-[2.5rem] shadow-sm border transition-all duration-500 hover:shadow-md ${
                  status === "verified" ? "border-green-100 bg-green-50/20" : "border-slate-50"
                }`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${
                      status === "verified" ? "bg-green-500 text-white" : "bg-slate-50 text-slate-400"
                    }`}>
                      {poin.nomor}
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block">Butir SKU</span>
                      <span className={`text-[7px] font-black uppercase italic ${status === "verified" ? "text-green-500" : "text-blue-500"}`}>
                        {tingkatTarget}
                      </span>
                    </div>
                  </div>

                  {status === "verified" ? (
                    <div className="flex items-center gap-1.5 bg-green-500 px-4 py-2 rounded-full shadow-lg shadow-green-500/20 animate-in zoom-in duration-300">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5 text-white" />
                      <span className="text-white text-[8px] font-black uppercase tracking-tighter">Lulus</span>
                    </div>
                  ) : status === "pending" ? (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 animate-pulse">
                      <HiOutlineClock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-600 text-[8px] font-black uppercase tracking-tighter">Antrean</span>
                    </div>
                  ) : (
                    <button
                      disabled={submitting === poin.nomor}
                      onClick={() => handleAjukan(poin)}
                      className="bg-blue-900 text-white text-[8px] font-black px-6 py-2.5 rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-blue-900/10 disabled:opacity-50">
                      {submitting === poin.nomor ? "..." : "Ajukan Ujian"}
                    </button>
                  )}
                </div>

                <div className="px-1">
                   <p className={`text-[11px] leading-relaxed font-bold italic ${
                    status === "verified" ? "text-slate-400 line-through decoration-green-500/30" : "text-slate-700"
                   }`}>
                    "{poin.deskripsi}"
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
    </div>
  );
}