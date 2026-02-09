import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

// IMPORT REACT ICONS
import { 
  HiOutlineUserGroup, 
  HiOutlineAcademicCap, 
  HiOutlineSpeakerphone, 
  HiOutlineTemplate, 
  HiOutlineShieldCheck,
  HiOutlineDatabase,
  HiOutlineTrendingUp,
  HiOutlineBadgeCheck, // Icon baru untuk Pelantikan
  HiOutlineAdjustments  // Icon baru untuk Settings
} from "react-icons/hi";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAnggota: 0,
    totalPembina: 0,
    totalXP: 0,
  });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [readyToLantik, setReadyToLantik] = useState(0); // State baru untuk notifikasi pelantikan
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Statistik Real-time
    const qAnggota = query(collection(db, "users"), where("role", "==", "anggota"));
    const qPembina = query(collection(db, "users"), where("role", "==", "pembina"));
    const qPending = query(collection(db, "pengajuan_tingkat"), where("status", "==", "pending"));
    
    // Query untuk mendeteksi yang sudah 100% SKU tapi belum dilantik
    // Catatan: Karena filter kompleks dilakukan di client, kita pantau progres verified
    const qProgress = query(collection(db, "sku_progress"), where("status", "==", "verified"));

    const unsubAnggota = onSnapshot(qAnggota, (snap) => {
      let totalPoin = 0;
      snap.forEach((doc) => (totalPoin += doc.data().points || 0));
      setStats((prev) => ({
        ...prev,
        totalAnggota: snap.size,
        totalXP: totalPoin,
      }));
    });

    const unsubPembina = onSnapshot(qPembina, (snap) => {
      setStats((prev) => ({ ...prev, totalPembina: snap.size }));
      setLoading(false);
    });

    const unsubPending = onSnapshot(qPending, (snap) => {
      setPendingRequests(snap.size);
    });

    // Listener untuk menghitung anggota yang "Siap Lantik" secara dinamis
    const unsubReady = onSnapshot(qProgress, (snap) => {
      const groups = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!groups[d.uid]) groups[d.uid] = 0;
        groups[d.uid]++;
      });
      // Sederhananya, jika ada anggota yang punya banyak poin verified, admin harus cek
      setReadyToLantik(Object.keys(groups).length);
    });

    return () => {
      unsubAnggota();
      unsubPembina();
      unsubPending();
      unsubReady();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-xs tracking-widest">
        Authority Initializing...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-100">
        
        {/* SECTION 1: HEADER */}
        <div className="px-8 pt-12 pb-6 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-blue-900 rounded-[1.5rem] flex items-center justify-center text-white font-black shadow-xl border-2 border-white overflow-hidden uppercase text-xl">
              <HiOutlineShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-none tracking-tighter uppercase">
                Admin Panel
              </h1>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> System Controller
              </p>
            </div>
          </div>
          <button 
            onClick={() => { if(window.confirm("Keluar?")) signOut(auth) }}
            className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 active:scale-90 transition-all shadow-sm"
          >
            <HiOutlineShieldCheck className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* SECTION 2: STATS SUMMARY */}
        <div className="px-6 py-2 grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <HiOutlineUserGroup className="w-6 h-6 text-slate-400 mb-2" />
            <p className="text-xl font-black text-slate-800 leading-none">{stats.totalPembina}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase mt-1 tracking-widest">Pembina Aktif</p>
          </div>
          <div className="bg-blue-900 p-5 rounded-[2rem] shadow-lg flex flex-col items-center text-white">
            <HiOutlineTrendingUp className="w-6 h-6 text-blue-300 mb-2" />
            <p className="text-xl font-black leading-none">{stats.totalXP.toLocaleString()}</p>
            <p className="text-[7px] font-black opacity-60 uppercase mt-1 tracking-widest text-center">Total Akumulasi XP</p>
          </div>
        </div>

        {/* SECTION 3: CORE MANAGEMENT GRID (UPDATED) */}
        <div className="px-6 mt-8">
          <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 ml-2">Master Control</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/kelola-pengguna" className="aspect-square bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all group">
              <HiOutlineUserGroup className="w-7 h-7 mb-1 text-blue-600" />
              <span className="text-[7px] font-black uppercase text-slate-500 text-center px-1">Database</span>
            </Link>
            
            {/* FITUR BARU: PUSAT PELANTIKAN */}
            <Link to="/admin/pusat-pelantikan" className="aspect-square bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all group relative">
              <HiOutlineBadgeCheck className="w-7 h-7 mb-1 text-amber-600" />
              <span className="text-[7px] font-black uppercase text-slate-500 text-center px-1">Pelantikan</span>
              {readyToLantik > 0 && (
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-bounce border-2 border-white">
                  !
                </span>
              )}
            </Link>

            <Link to="/pembina/admin-hub" className="aspect-square bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-all">
              <HiOutlineDatabase className="w-7 h-7 mb-1" />
              <span className="text-[7px] font-black uppercase tracking-widest text-center px-1">Admin Hub</span>
            </Link>
          </div>
        </div>

        {/* SECTION 4: SYSTEM SECURITY & SETTINGS (UPDATED) */}
        <div className="px-6 mt-8">
          <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 ml-2">Configuration & Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* FITUR BARU: SETTINGS SERTIFIKAT */}
            <Link to="/admin/settings-sertifikat" className="bg-white border border-slate-100 p-5 rounded-[2.5rem] flex items-center gap-4 active:scale-95 transition-all shadow-sm">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <HiOutlineAdjustments className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-black uppercase text-slate-500">Cert Settings</span>
            </Link>

            <Link to="/admin/kta-editor" className="bg-white border border-slate-100 p-5 rounded-[2.5rem] flex items-center gap-4 active:scale-95 transition-all shadow-sm">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><HiOutlineTemplate className="text-blue-600 w-5 h-5" /></div>
              <span className="text-[8px] font-black uppercase text-slate-500">KTA Layout</span>
            </Link>
          </div>
        </div>

        {/* SECTION 5: EXTRA FEATURES */}
        <div className="px-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
                <Link to="/admin/verifikasi-tingkat" className="bg-white border border-slate-100 p-5 rounded-[2.5rem] flex items-center gap-4 active:scale-95 transition-all shadow-sm relative">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><HiOutlineAcademicCap className="text-green-600 w-5 h-5" /></div>
                <span className="text-[8px] font-black uppercase text-slate-500">Verif Tingkat</span>
                {pendingRequests > 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                        {pendingRequests}
                    </span>
                )}
                </Link>
                <Link to="/admin/logs" className="bg-white border border-slate-100 p-5 rounded-[2.5rem] flex items-center gap-4 active:scale-95 transition-all shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><HiOutlineShieldCheck className="text-red-600 w-5 h-5" /></div>
                <span className="text-[8px] font-black uppercase text-slate-500">Audit Logs</span>
                </Link>
            </div>
        </div>

        {/* SECTION 6: BROADCAST REDIRECTION */}
        <div className="px-6 mt-8 mb-6 flex-1">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
            <div className="relative z-10">
              <HiOutlineSpeakerphone className="w-10 h-10 text-indigo-300 mb-4" />
              <h3 className="text-lg font-black uppercase italic tracking-tighter mb-1">Quick Broadcast</h3>
              <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mb-6">Kirim informasi instan ke semua anggota</p>
              
              <button 
                onClick={() => navigate("/admin/pengumuman", { state: { openForm: true } })}
                className="bg-white text-indigo-900 px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
              >
                Buat Pengumuman
              </button>
            </div>
          </div>
        </div>

        <footer className="p-6 text-center opacity-20">
          <p className="text-[7px] font-black uppercase tracking-[0.5em]">Laskar Bahari Ultimate Authority</p>
        </footer>

      </div>
    </div>
  );
}