import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode"; 

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
  HiOutlineEye,
  HiOutlineCollection,
  HiOutlineDownload,
  HiOutlineShieldCheck
} from "react-icons/hi";

export default function DaftarSKU({ userData }) {
  const [masterSKU, setMasterSKU] = useState([]);
  const [skuProgress, setSkuProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewTingkat, setViewTingkat] = useState(null);
  const [certConfig, setCertConfig] = useState(null); 

  const flipBook = useRef(null);
  const navigate = useNavigate();
  const userAgama = userData?.agama || "";

  const getTargetTingkat = () => {
    const tingkatProfil = userData?.tingkat?.toUpperCase() || "PENGGALANG";
    if (tingkatProfil === "PENGGALANG") return "Ramu";
    if (tingkatProfil === "RAMU") return "Rakit";
    if (tingkatProfil === "RAKIT") return "Terap";
    return "Ramu"; 
  };

  const tingkatMisiAktif = getTargetTingkat();

  // Load Certificate Config secara realtime
  useEffect(() => {
    const docRef = doc(db, "settings", "certificate_config");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setCertConfig(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (tingkatMisiAktif && !viewTingkat) {
      setViewTingkat(tingkatMisiAktif);
    }
  }, [tingkatMisiAktif]);

  useLayoutEffect(() => {
    if (flipBook.current && viewTingkat) {
      try {
        const instance = flipBook.current.pageFlip();
        if (instance) instance.turnToPage(0);
      } catch (e) {}
    }
  }, [viewTingkat]);

  const isCurrentViewAllVerified = masterSKU.length > 0 && masterSKU.every(poin => 
    skuProgress[`${poin.nomor}-${poin.deskripsi}`] === "verified"
  );

  useEffect(() => {
    if (!auth.currentUser || !viewTingkat) return;
    setLoading(true);

    const qMaster = query(
      collection(db, "master_sku"),
      where("tingkat", "==", viewTingkat),
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
      setLoading(false);
    }, (err) => {
      console.error("Error SKU:", err);
      setLoading(false);
    });

    const qProgress = query(
      collection(db, "sku_progress"),
      where("uid", "==", auth.currentUser.uid),
      where("tingkat", "==", viewTingkat)
    );

    const unsubProgress = onSnapshot(qProgress, (snap) => {
      const progressMap = {};
      snap.forEach((doc) => {
        const data = doc.data();
        const uniqueKey = `${data.nomor_poin}-${data.deskripsi_poin}`;
        progressMap[uniqueKey] = data.status;
      });
      setSkuProgress(progressMap);
    });

    return () => { unsubMaster(); unsubProgress(); };
  }, [viewTingkat, auth.currentUser, userAgama]);

  const handleAjukan = async (poin) => {
    if (viewTingkat !== tingkatMisiAktif) {
      alert("Hanya bisa mengajukan pada tingkatan aktif.");
      return;
    }
    const uniqueKey = `${poin.nomor}-${poin.deskripsi}`;
    if (skuProgress[uniqueKey]) return;
    setSubmitting(poin.id);
    try {
      await addDoc(collection(db, "sku_progress"), {
        uid: auth.currentUser.uid,
        nama_anggota: userData?.nama || "Anggota",
        tingkat: viewTingkat,
        nomor_poin: Number(poin.nomor),
        deskripsi_poin: poin.deskripsi,
        kategori: (poin.kategori || "SPIRITUAL").toUpperCase(),
        sub_agama: poin.sub_agama || "", 
        status: "pending",
        tgl_pengajuan: serverTimestamp(),
        verifikator_nama: "",
      });
    } catch (error) { alert("Gagal mengirim."); } finally { setSubmitting(null); }
  };

  const handleDownloadSertifikat = async () => {
    setIsPrinting(true);
    try {
      if (!certConfig) throw "Konfigurasi tidak ditemukan!";
      
      const currentTingkat = viewTingkat.toUpperCase();
      const template = certConfig.templates[currentTingkat];
      const lulusInfo = userData?.lulus_info?.[currentTingkat];

      if (!template?.url || !lulusInfo) throw "Data sertifikat belum siap!";

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = template.url;

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (template.fields.qrcode) {
          const qrField = template.fields.qrcode;
          const verifyUrl = `${window.location.origin}/verify/${auth.currentUser.uid}/${currentTingkat}`;
          const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 512, color: { dark: qrField.color || "#000000", light: "#ffffff" } });
          const qrImg = new Image();
          qrImg.src = qrDataUrl;
          await new Promise(r => { qrImg.onload = () => {
            const size = (qrField.fontSize * canvas.width) / 1000;
            ctx.drawImage(qrImg, (qrField.x/100)*canvas.width - size/2, (qrField.y/100)*canvas.height - size/2, size, size);
            r();
          }});
        }

        Object.keys(template.fields).forEach(key => {
          if (key === "qrcode") return;
          const field = template.fields[key];
          let val = "";
          
          if (key === "nama") val = userData.nama.toUpperCase();
          
          // FIX: REPLACE {SURAT} PADA NOMOR SERTIFIKAT SAAT CETAK
          if (key === "nomor") {
            const suratInduk = certConfig?.lastSuratNumber || "";
            val = (lulusInfo.noSertifikat || "").replace(/{SURAT}/g, suratInduk);
          }

          if (key === "tanggal") {
            const dateSource = field.customDate;
            const d = dateSource ? new Date(dateSource) : new Date();
            val = d.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
          }

          const fontSize = (field.fontSize * canvas.width) / 1000;
          ctx.font = `${field.fontStyle || "normal"} ${field.fontWeight || "bold"} ${fontSize}px ${field.fontFamily || "Arial"}`;
          ctx.fillStyle = field.color || "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(val, (field.x/100)*canvas.width, (field.y/100)*canvas.height);
        });

        const link = document.createElement("a");
        link.download = `Sertifikat_${currentTingkat}_${userData.nama}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();
        setIsPrinting(false);
      };
    } catch (e) { alert(e); setIsPrinting(false); }
  };

  const chunkSKU = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
  const skuPages = chunkSKU(masterSKU, 5);

  if (loading || !viewTingkat) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white italic text-[10px] tracking-widest uppercase">Memuat Dokumen...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center py-10 px-4 italic selection:bg-red-800">
      
      {/* HEADER */}
      <div className="w-full max-w-lg flex justify-between items-center mb-6 px-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full border border-white/10 active:scale-95 transition"><HiOutlineChevronLeft className="w-6 h-6" /></button>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Buku SKU Digital</h2>
          <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] mt-1">
            {viewTingkat !== tingkatMisiAktif ? `ARSIP: ${viewTingkat}` : 'Laskar Bahari Navigator'}
          </p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-red-600 rounded-2xl rotate-12 shadow-lg text-white shadow-red-900/20"><HiBookOpen className="w-6 h-6" /></div>
      </div>

      {/* NOTIFIKASI MODE RIWAYAT */}
      {viewTingkat !== tingkatMisiAktif && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-amber-600 text-white text-[9px] font-black px-4 py-2 rounded-full mb-4 uppercase flex items-center gap-2 z-10 shadow-xl border border-white/20">
          <HiOutlineEye size={14} /> Mode Riwayat: {viewTingkat} 
          <button onClick={() => setViewTingkat(tingkatMisiAktif)} className="ml-2 bg-white text-amber-700 px-2 py-0.5 rounded-md hover:bg-slate-100 font-bold transition-all text-[8px]">Kembali</button>
        </motion.div>
      )}

      <div className="relative group scale-[0.95] md:scale-100">
        <HTMLFlipBook 
          key={viewTingkat}
          width={320} height={480} size="fixed" minWidth={200} maxWidth={1000}
          minHeight={300} maxHeight={1533} showCover={true} flipAngle={30}
          className="shadow-2xl" ref={flipBook} useMouseEvents={true} startPage={0}
        >
          {/* COVER */}
          <Page number="Cover">
            <div className="flex flex-col items-center justify-between h-full py-4 px-2 border-[1px] border-[#8b4513]/20 rounded-sm">
              <div className="w-full h-full border-[2px] border-[#8b4513]/30 p-4 flex flex-col items-center relative bg-[#fdf6e3]/50 shadow-inner text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Gerakan Pramuka</p>
                <div className="w-20 h-20 mb-4 p-2 bg-white/50 rounded-full border border-[#8b4513]/10 flex items-center justify-center shadow-sm">
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-[26px] font-black text-slate-800 uppercase leading-[0.8] tracking-tighter italic">Syarat <br/> Kecakapan <br/> <span className="text-red-700">Umum</span></h1>
                <div className="px-6 py-2 border-2 border-red-700 rounded-full mt-4 shadow-sm bg-red-50/50"><p className="text-xs font-black text-red-700 uppercase tracking-[0.3em]">{viewTingkat}</p></div>
                <div className="mt-auto w-full p-4 border border-[#8b4513]/20 rounded-lg bg-white/20 shadow-sm text-left relative overflow-hidden">
                  <HiOutlineIdentification className="absolute -right-2 -bottom-2 w-16 h-16 text-[#8b4513]/5 rotate-[-15deg]" />
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><div className="w-1 h-1 bg-red-700 rounded-full" /> Identitas Pemilik:</div>
                  <div className="border-l-2 border-red-700 pl-3">
                    <div className="text-[12px] font-black text-slate-900 uppercase italic leading-none">{userData?.nama || "NAVI MEMBER"}</div>
                  </div>
                </div>
              </div>
            </div>
          </Page>

          {/* RIWAYAT */}
          <Page number="Logbook">
            <div className="flex flex-col h-full text-left">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-300 pb-2">
                <HiOutlineCollection className="text-red-700 w-5 h-5" />
                <h3 className="text-[12px] font-black text-slate-800 uppercase italic">Log Pencapaian</h3>
              </div>
              <div className="space-y-3">
                {["Ramu", "Rakit", "Terap"].map((tk) => {
                  const isDone = userData?.lulus_info?.[tk.toUpperCase()]?.isLulus;
                  const isActive = viewTingkat === tk;
                  const isDoing = tingkatMisiAktif === tk;
                  return (
                    <div key={tk} onClick={() => (isDone || isDoing) && setViewTingkat(tk)}
                      className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${isActive ? 'border-red-700 bg-red-50 shadow-sm' : 'border-slate-200 bg-slate-50'} ${!isDone && !isDoing ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-red-400'}`}>
                      <div className="flex justify-between items-center text-left">
                        <div>
                          <p className={`text-[10px] font-black ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>SKU {tk}</p>
                          <p className="text-[7px] font-bold text-slate-400 uppercase">{isDone ? 'Lihat Arsip Sertifikat' : isDoing ? 'Sedang Ditempuh' : 'Terkunci'}</p>
                        </div>
                        {isDone && <HiOutlineBadgeCheck className="text-emerald-600 w-5 h-5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Page>

          {/* ISI SKU */}
          {skuPages.length > 0 ? skuPages.map((pageItems, pIdx) => (
            <Page key={pIdx} number={pIdx + 1}>
              <h4 className="text-[10px] font-black text-red-800 uppercase mb-4 border-b border-red-800/20 pb-1 flex justify-between"><span>Daftar Misi</span><span>{viewTingkat}</span></h4>
              <table className="w-full border-collapse">
                <thead className="bg-slate-800 text-white"><tr className="text-[8px] uppercase font-black"><th className="p-2 border border-slate-800 w-8">No</th><th className="p-2 border border-slate-800 text-left">Misi</th><th className="p-2 border border-slate-800 w-12">Paraf</th></tr></thead>
                <tbody>
                  {pageItems.map((poin) => {
                    const status = skuProgress[`${poin.nomor}-${poin.deskripsi}`];
                    return (
                      <tr key={poin.id} className="border-b border-slate-300">
                        <td className="p-2 text-[10px] font-black italic text-center align-top text-slate-800">{poin.nomor || "-"}</td>
                        <td className="p-2 align-top text-left"><p className={`text-[9px] font-bold italic leading-snug text-slate-700 ${status === "verified" ? "line-through opacity-40 text-emerald-700" : ""}`}>{poin.deskripsi}</p></td>
                        <td className="p-2 text-center align-middle">
                          {status === "verified" ? <HiOutlineCheckCircle className="text-emerald-600 w-5 h-5 mx-auto" /> : 
                           status === "pending" ? <HiOutlineClock className="text-amber-600 w-5 h-5 mx-auto animate-pulse" /> : 
                           <button onClick={() => handleAjukan(poin)} disabled={submitting === poin.id || viewTingkat !== tingkatMisiAktif} className="bg-red-800 text-white text-[7px] font-black px-2 py-1.5 rounded uppercase disabled:opacity-30 active:scale-95 transition-all shadow-sm">Ajukan</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Page>
          )) : (
            <Page number="Empty"><div className="h-full flex items-center justify-center text-[10px] uppercase font-black opacity-30 italic text-center p-4">Poin SKU {viewTingkat} <br/> Belum Tersedia</div></Page>
          )}

          {/* PENGESAHAN */}
          <Page number="Legal">
            <div className="flex flex-col h-full py-2 px-1 text-center border-4 border-double border-[#8b4513]/20 m-1 rounded-sm bg-[#fdf6e3]/30 relative overflow-hidden text-slate-800">
              <h3 className="text-[12px] font-black uppercase tracking-widest border-b-2 border-red-700 pb-1 mb-2 mt-2">LEMBAR PENGESAHAN</h3>
              
              <div className="flex-1 flex flex-col justify-center space-y-2">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-black uppercase italic leading-tight text-slate-900">Nama: {userData?.nama}</div>
                  <div className="text-[9px] font-bold uppercase text-slate-600">Tingkat: {userData?.tingkat || "PENGGALANG"}</div>
                </div>

                <div className="text-[9px] leading-relaxed px-2 text-slate-700 text-center">
                  <p>Menyatakan bahwa yang bersangkutan telah menyelesaikan <b>SKU Tingkat {viewTingkat}</b> dan dilantik pada tanggal <span className="font-bold underline italic">
                    {certConfig?.templates?.[viewTingkat.toUpperCase()]?.fields?.tanggal?.customDate
                      ? new Date(certConfig.templates[viewTingkat.toUpperCase()].fields.tanggal.customDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
                      : "........................"}
                  </span>.</p>
                  
                  <p className="mt-1 text-[8.5px]">Selanjutnya yang bersangkutan berhak mengenakan Tanda Kecakapan Umum <span className="font-bold">{viewTingkat}</span> dengan harapan untuk senantiasa meningkatkan keterampilannya berdasarkan <b>Tri Satya</b> dan <b>Dasa Dharma</b> pramuka.</p>
                </div>

                <div className="py-2">
                  {userData?.lulus_info?.[viewTingkat?.toUpperCase()]?.isLulus ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                      <HiOutlineShieldCheck className="w-8 h-8 text-emerald-600 mb-1" />
                      <p className="text-[9px] font-black text-emerald-700 uppercase">LULUS & DISAHKAN</p>
                      <button onClick={handleDownloadSertifikat} disabled={isPrinting} className="mt-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-[8px] px-4 py-1.5 rounded-full font-black shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                        {isPrinting ? "MENGOLAH..." : <><HiOutlineDownload size={12}/> CETAK SERTIFIKAT {viewTingkat.toUpperCase()}</>}
                      </button>
                    </motion.div>
                  ) : isCurrentViewAllVerified && viewTingkat === tingkatMisiAktif ? (
                    <div className="flex flex-col items-center space-y-1">
                      <HiOutlineClock className="w-8 h-8 text-amber-500 animate-pulse" />
                      <p className="text-[9px] font-black text-amber-700 uppercase leading-tight">Pengisian Selesai,<br/>Menunggu Pelantikan</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-40 grayscale text-center">
                      <HiOutlineClock className="w-8 h-8 text-slate-400 mb-1" />
                      <p className="text-[9px] font-black text-slate-500 uppercase italic">Dalam Proses Pengisian</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto mb-2 w-full px-6">
                <div className="text-[8px] uppercase text-center text-slate-800">
                  <p className="font-bold italic leading-none text-slate-500 text-[7px]">Yang melantik,</p>
                  <p className="font-black leading-tight text-[8px]">Pembina Gugus Depan</p>
                  <div className="h-6" />
                  <p className="text-red-700 font-black tracking-tighter underline leading-none text-[8px]">GUDEP 10.491-10.492</p>
                </div>
              </div>
            </div>
          </Page>

          <Page number="End">
            <div className="flex flex-col items-center justify-center h-full text-center p-6 border-[1px] border-[#8b4513]/20 m-1 rounded-sm bg-[#fdf6e3]/40">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-6 tracking-[0.5em]">Laskar Bahari Navigator</p>
              <h3 className="text-xs font-black italic text-slate-800 uppercase underline">Gugus Depan <br/> <span className="text-red-700 text-sm">10.491-10.492</span></h3>
              <p className="text-[10px] text-slate-500 font-bold mb-10 uppercase text-center w-full">PANGKALAN SMP NEGERI 1 BIAU</p>
              <div className="italic text-[10px] text-slate-600 font-bold border-y border-slate-200 py-4 w-full uppercase text-center leading-relaxed">"Dilaut Kami Jaya, <br/> Di Darat Kami Bisa"</div>
              <div className="mt-auto opacity-50 text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigator System v1.2</div>
            </div>
          </Page>
        </HTMLFlipBook>

        <div className="flex justify-center gap-6 w-full mt-8 px-4 text-left">
          <button type="button" onClick={() => flipBook.current.pageFlip().flipPrev()} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all shadow-lg"><HiOutlineChevronLeft className="w-4 h-4 text-red-600" /> Prev</button>
          <button type="button" onClick={() => flipBook.current.pageFlip().flipNext()} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all shadow-lg text-right">Next <HiOutlineChevronRight className="w-4 h-4 text-red-600" /></button>
        </div>
      </div>
    </div>
  );
}