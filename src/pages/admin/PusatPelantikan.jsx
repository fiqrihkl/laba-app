import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineBadgeCheck, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck, 
  HiOutlineClock 
} from "react-icons/hi";

// Import fungsi pelantikan dari utilitas
import { processGraduation } from "../../utils/certUtils";

export default function PusatPelantikan() {
  const [masterSKU, setMasterSKU] = useState([]);
  const [verifiedProgress, setVerifiedProgress] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil Master SKU Realtime
    const unsubMaster = onSnapshot(collection(db, "master_sku"), (snap) => {
      setMasterSKU(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Ambil Data Semua Anggota (Realtime)
    const unsubUser = onSnapshot(query(collection(db, "users"), where("role", "==", "anggota")), (snap) => {
      const userMap = {};
      snap.forEach(doc => {
        userMap[doc.data().uid] = { docId: doc.id, ...doc.data() };
      });
      setUsersData(userMap);
    });

    // 3. Ambil Progres SKU Verified
    const unsubProgress = onSnapshot(query(collection(db, "sku_progress"), where("status", "==", "verified")), (snap) => {
      setVerifiedProgress(snap.docs.map(doc => doc.data()));
      setLoading(false);
    });

    return () => { 
      unsubMaster(); 
      unsubUser(); 
      unsubProgress(); 
    };
  }, []);

  // LOGIKA UTAMA: Menentukan target poin dinamis per anggota
  const getStatusPelantikan = () => {
    const activeUserGroups = verifiedProgress.reduce((acc, curr) => {
      const userData = usersData[curr.uid];
      
      if (userData) {
        /**
         * LOGIKA PEMETAAN TARGET (ALUR BERJENJANG):
         * Kita tentukan SKU apa yang harus dikerjakan berdasarkan field 'tingkat' di profil.
         */
        const currentProfileRank = userData.tingkat?.toUpperCase() || "PENGGALANG";
        let targetSKUForUser = "";

        if (currentProfileRank === "PENGGALANG") targetSKUForUser = "RAMU";
        else if (currentProfileRank === "RAMU") targetSKUForUser = "RAKIT";
        else if (currentProfileRank === "RAKIT") targetSKUForUser = "TERAP";

        // Hanya hitung jika tingkat di data SKU Progress (verified) cocok dengan target tingkatan user saat ini
        if (targetSKUForUser !== "" && curr.tingkat?.toUpperCase() === targetSKUForUser) {
          const groupKey = `${curr.uid}_${targetSKUForUser}`;
          if (!acc[groupKey]) {
            acc[groupKey] = { 
              nama: curr.nama_anggota, 
              uid: curr.uid, 
              tingkat: targetSKUForUser, // SKU yang sedang ditempuh (Contoh: RAMU)
              poinVerified: [] 
            };
          }
          acc[groupKey].poinVerified.push(curr);
        }
      }
      return acc;
    }, {});

    return Object.values(activeUserGroups).map(user => {
      const userData = usersData[user.uid];
      if (!userData) return null;

      const userAgama = userData.agama?.toString().trim().toUpperCase() || ""; 
      const tingkatMisiTarget = user.tingkat; // RAMU / RAKIT / TERAP
      
      const targetPoinList = masterSKU.filter(m => {
        const mLevel = m.tingkat?.toUpperCase();
        const mCategory = m.kategori?.toUpperCase();
        const mSubAgama = m.sub_agama?.toUpperCase();
        const mNomor = Number(m.nomor);

        if (mLevel !== tingkatMisiTarget) return false;
        
        if (mNomor === 4 || mCategory === "SPIRITUAL" || mCategory === "AGAMA") {
          if (mSubAgama) {
            return mSubAgama === userAgama;
          }
        }
        return true;
      });

      const totalTarget = targetPoinList.length;
      const currentCount = user.poinVerified.length;

      return {
        ...user,
        totalTarget: totalTarget,
        currentCount,
        isReady: totalTarget > 0 && currentCount >= totalTarget
      };
    }).filter(u => u !== null && u.totalTarget > 0);
  };

  /**
   * FUNGSI EKSEKUSI PELANTIKAN
   */
  const handleSahPelantikan = async (anggota) => {
    if(!window.confirm(`Sahkan pelantikan ${anggota.nama} menjadi tingkat ${anggota.tingkat}?`)) return;

    try {
      /**
       * PERBAIKAN LOGIKA:
       * Jika anggota dilantik karena menyelesaikan SKU RAMU, maka tingkat barunya adalah RAMU.
       * Kita langsung ambil 'anggota.tingkat' sebagai profil barunya.
       */
      const tingkatBaru = anggota.tingkat.toUpperCase();

      // 1. Jalankan utilitas pelantikan (Transaction untuk generate nomor sertifikat)
      // Pastikan processGraduation di certUtils juga mengupdate field 'tingkat' dengan benar.
      const res = await processGraduation(anggota.uid, anggota.tingkat);

      if (res.success) {
        // 2. Update Dokumen User di Firestore agar field 'tingkat' sesuai dengan SKU yang diselesaikan
        const userDocRef = doc(db, "users", usersData[anggota.uid].docId);
        await updateDoc(userDocRef, {
          tingkat: tingkatBaru,
          last_promotion: serverTimestamp()
        });

        alert(`BERHASIL! ${anggota.nama} kini resmi menjadi Penggalang ${tingkatBaru}`);
      } else {
        alert("Gagal: " + res.error);
      }
    } catch (error) {
      console.error("Error Pelantikan:", error);
      alert("Gagal mensahkan pelantikan: " + error);
    }
  };

  const allStatus = getStatusPelantikan();
  const listSiapLantik = allStatus.filter(u => u.isReady);
  const listSedangBerjuang = allStatus.filter(u => !u.isReady);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-amber-500 font-black animate-pulse uppercase text-[10px] tracking-widest italic">
        Menghitung Kelayakan Pelantikan...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 italic font-sans selection:bg-red-500">
      
      <header className="mb-12">
        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
          <HiOutlineShieldCheck className="text-red-600" size={40} />
          Pusat Pelantikan
        </h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mt-2 ml-1">Protocol Authority Hub — Laskar Bahari</p>
      </header>

      <div className="space-y-16">
        
        {/* SECTION 1: SIAP LANTIK */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-12 bg-amber-600"></div>
            <h2 className="text-[11px] font-black uppercase text-amber-500 tracking-[0.3em]">Kandidat Siap Lantik</h2>
          </div>
          
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {listSiapLantik.length > 0 ? (
                listSiapLantik.map((anggota) => (
                  <motion.div 
                    key={`${anggota.uid}_${anggota.tingkat}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gradient-to-br from-amber-600/20 to-transparent border border-amber-500/30 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between shadow-2xl backdrop-blur-md"
                  >
                    <div className="text-center md:text-left mb-6 md:mb-0">
                      <h3 className="font-black text-2xl uppercase tracking-tight text-white">{anggota.nama}</h3>
                      <div className="flex gap-3 mt-4 justify-center md:justify-start">
                        <span className="bg-red-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-red-400/50">
                          LANTIK KE: {anggota.tingkat}
                        </span>
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase border border-emerald-400/50">
                          SKU TUNTAS ({anggota.currentCount}/{anggota.totalTarget})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSahPelantikan(anggota)}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase shadow-2xl transition-all active:scale-95 flex items-center gap-3 border-b-4 border-amber-800"
                    >
                      <HiOutlineBadgeCheck size={22} /> Sahkan Pelantikan
                    </button>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]"
                >
                  <HiOutlineUserGroup size={50} className="mx-auto text-slate-800 mb-4 opacity-20" />
                  <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Belum Ada Anggota yang Tuntas SKU</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* SECTION 2: DAFTAR PROGRES (MONITORING) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-12 bg-slate-700"></div>
            <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Dalam Tahap Pengujian</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {listSedangBerjuang.length > 0 ? (
                listSedangBerjuang.map((u) => (
                  <motion.div 
                    layout
                    key={`${u.uid}_${u.tingkat}`} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/10 transition-all shadow-lg group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-black text-xs uppercase text-slate-300 tracking-tight leading-tight">{u.nama}</h4>
                        <p className="text-[8px] text-amber-500 font-bold uppercase mt-1 tracking-widest italic">Uji SKU {u.tingkat}</p>
                      </div>
                      <div className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-xl border border-amber-500/10">
                        {u.currentCount} / {u.totalTarget}
                      </div>
                    </div>
                    
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-slate-600 transition-all duration-1000 group-hover:bg-amber-600" 
                        style={{ width: `${u.totalTarget > 0 ? (u.currentCount / u.totalTarget) * 100 : 0}%` }}
                      ></div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[7px] font-black text-slate-600 uppercase tracking-widest italic">
                      <HiOutlineClock size={12} /> Sedang Menyelesaikan SKU
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 opacity-30">
                   <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada aktivitas pengujian</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}