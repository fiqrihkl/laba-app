import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  addDoc, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORT KONTEKS KONFIRMASI ---
import { useConfirm } from "./context/ConfirmContext";

// --- HOOK LOGIKA ---
import { usePembinaDashboard } from "../../hooks/usePembinaDashboard";

// --- SUB-KOMPONEN ---
import CommandHeader from "./components/CommandHeader";
import NaviIntelOrb from "./components/NaviIntelOrb";

// --- ICONS ---
import { 
  HiQrcode, HiOutlineChevronRight, HiOutlineUserGroup, HiOutlineLogout,
  HiOutlineAdjustments, HiOutlineCollection, HiOutlineChartPie,
  HiOutlineLightningBolt, HiOutlineStatusOnline,
  HiOutlineAcademicCap, HiOutlineShieldExclamation,
  HiOutlineShieldCheck, HiOutlineTrendingUp, HiOutlineTrendingDown,
  HiOutlineSearch, HiOutlineDocumentDownload, HiOutlineLightningBolt as HiFlash
} from "react-icons/hi";

export default function PembinaDashboard() {
  const navigate = useNavigate();
  const confirm = useConfirm(); 
  const [activeTab, setActiveTab] = useState("command"); 
  
  // State untuk XP Management
  const [selectedUserXP, setSelectedUserXP] = useState(null);
  const [xpValue, setXpValue] = useState("");
  const [xpReason, setXpReason] = useState("");
  const [xpType, setXpType] = useState("addition"); 
  
  // Data dari hook (onlineUsers dan leaderboard dihandle di sini)
  const { 
    pembinaData, 
    presentUsers, 
    onlineUsers = [], 
    leaderboard = [],  
    stats, 
    alerts, 
    loading, 
    unreadCount 
  } = usePembinaDashboard();

  const handleLogout = () => {
    confirm({
      title: "Terminate Session?",
      message: "AKHIRI SESI MANAJEMEN PEMBINA DAN KELUAR DARI SISTEM NAVIGASI?",
      type: "danger",
      onConfirm: () => {
        signOut(auth).then(() => navigate("/"));
      }
    });
  };

  const handleUpdateXP = async () => {
    if (!selectedUserXP || !xpValue || !xpReason) {
      alert("LENGKAPI POIN DAN ALASAN!");
      return;
    }

    confirm({
      title: "Execute XP Command?",
      message: `KONFIRMASI PERUBAHAN ${xpValue} XP UNTUK ${selectedUserXP.nama}?`,
      type: "blue",
      onConfirm: async () => {
        const pointsToUpdate = xpType === "addition" ? parseInt(xpValue) : -parseInt(xpValue);
        try {
          const userRef = doc(db, "users", selectedUserXP.id);
          await updateDoc(userRef, {
            points: increment(pointsToUpdate),
            attendanceLog: arrayUnion({
              timestamp: new Date().toISOString(),
              activity: xpReason,
              pointsEarned: pointsToUpdate,
              isSeen: false 
            })
          });

          await addDoc(collection(db, "logs"), {
            action: "PENYESUAIAN XP",
            adminName: auth.currentUser?.displayName || "PEMBINA",
            targetName: selectedUserXP.nama,
            targetId: selectedUserXP.id,
            reason: `${xpReason} (${pointsToUpdate > 0 ? '+' : ''}${pointsToUpdate} XP)`,
            timestamp: serverTimestamp(),
          });

          setSelectedUserXP(null);
          setXpValue("");
          setXpReason("");
        } catch (e) { 
          alert("GAGAL SINKRONISASI DATABASE.");
        }
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans uppercase text-[10px] tracking-widest italic font-black">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
      Syncing Intelligence...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans selection:bg-blue-900 overflow-x-hidden italic">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative border-x border-white/5 bg-[#020617]">
        
        <CommandHeader 
          pembinaData={pembinaData}
          unreadCount={unreadCount} 
          presentCount={presentUsers.length}
          alertsCount={alerts.sos}
        />

        <div className="px-6 mt-6">
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab("command")}
              className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'command' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <HiOutlineStatusOnline size={16} /> Monitoring
            </button>
            <button 
              onClick={() => setActiveTab("hub")}
              className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'hub' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <HiOutlineAdjustments size={16} /> Kelola Data
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "command" ? (
            <motion.div key="command" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-6 flex flex-col gap-6 mt-6">
              
              {/* OPERATIONAL PULSE */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Operational Pulse
                  </h2>
                  <span className="text-[9px] text-slate-600 font-black">{onlineUsers.length} ACTIVE</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scroll no-scrollbar">
                  {onlineUsers.length > 0 ? onlineUsers.map((user) => (
                    <div key={user.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                      <div className="relative">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm uppercase shadow-[0_0_15px_rgba(59,130,246,0.2)] overflow-hidden">
                          {user.fotoUrl ? (
                            <img src={user.fotoUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            user.nama?.substring(0, 1)
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#020617] rounded-full shadow-lg" />
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-300 uppercase truncate w-14">{user.nama?.split(' ')[0]}</p>
                        <p className="text-[7px] text-emerald-500 font-bold uppercase">Online</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-[9px] text-slate-700 uppercase font-black py-4">No digital activity detected...</p>
                  )}
                </div>
              </section>

              {/* URGENT ALERTS */}
              <div className="grid grid-cols-3 gap-2">
                <Link to="/pembina/monitor-sos" className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${alerts.sos > 0 ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" : "bg-slate-900 border-white/5 text-slate-500"}`}>
                  <HiOutlineShieldExclamation size={20} />
                  <span className="text-[7px] font-black uppercase tracking-tighter">SOS</span>
                  <span className="text-sm font-black">{alerts.sos || 0}</span>
                </Link>
                <Link to="/pembina/investigasi-sfh" className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${alerts.sfh > 0 ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" : "bg-slate-900 border-white/5 text-slate-500"}`}>
                  <HiOutlineShieldCheck size={20} />
                  <span className="text-[7px] font-black uppercase tracking-tighter">SFH</span>
                  <span className="text-sm font-black">{alerts.sfh || 0}</span>
                </Link>
                <Link to="/pembina/verifikasi-sku" className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${alerts.sku > 0 ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" : "bg-slate-900 border-white/5 text-slate-500"}`}>
                  <HiOutlineAcademicCap size={20} className={alerts.sku > 0 ? "text-red-500" : "text-blue-500"} />
                  <span className="text-[7px] font-black uppercase tracking-tighter">SKU</span>
                  <span className="text-sm font-black">{alerts.sku || 0}</span>
                </Link>
              </div>

              <NaviIntelOrb alerts={alerts} presentCount={presentUsers.length} />

              <button onClick={() => navigate("/pembina/scanner")} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 flex items-center justify-between shadow-lg transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center"><HiQrcode size={24} /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">Absensi Kehadiran</p>
                    <p className="text-[10px] opacity-70 uppercase font-sans">Scan QR Anggota</p>
                  </div>
                </div>
                <HiOutlineChevronRight />
              </button>

              {/* LIVE FEED */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Live Presensi
                  </h2>
                  <span className="text-[10px] text-slate-600 font-black">{presentUsers.length} HADIR</span>
                </div>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scroll">
                  {presentUsers.map((u) => (
                    <div key={u.id} className="bg-slate-900 border border-white/5 p-3 rounded-xl flex justify-between items-center group hover:border-blue-500/50 transition-all text-left">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center font-black text-blue-400 text-xs border border-white/5 uppercase overflow-hidden">
                            {u.fotoUrl ? <img src={u.fotoUrl} className="w-full h-full object-cover" alt="" /> : u.nama?.substring(0, 1)}
                          </div>
                          {onlineUsers.find(o => o.id === u.id) && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#020617] rounded-full shadow-lg" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-200 uppercase">{u.nama}</p>
                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{u.tingkat || "Laskar"}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedUserXP(u)} className="p-2 text-slate-600 hover:text-blue-400 transition-colors">
                        <HiOutlineLightningBolt size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-6 mt-8 flex flex-col gap-8">
              
              {/* LEADERBOARD PREVIEW (MINIMALIST PODIUM) */}
              <section className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 text-center flex items-center justify-center gap-2">
                  <HiOutlineTrendingUp className="text-blue-500" /> Top Intelligence
                </h2>

                <div className="flex items-end justify-center gap-2 mb-6 h-32">
                  {[...leaderboard]
                    .sort((a, b) => {
                      if (b.level !== a.level) return b.level - a.level;
                      return b.points - a.points;
                    })
                    .slice(0, 3)
                    .map((user, index) => {
                      const order = index === 0 ? "order-2" : index === 1 ? "order-1" : "order-3";
                      const isFirst = index === 0;
                      const isSecond = index === 1;

                      return (
                        <motion.div key={user.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`flex flex-col items-center ${order} flex-1`}>
                          <div className={`relative mb-2 rounded-2xl flex items-center justify-center font-black transition-all overflow-visible ${isFirst ? "w-16 h-16 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] text-xl" : "w-12 h-12 bg-slate-800 border border-white/10 text-slate-400 text-sm"}`}>
                            {user.fotoUrl ? (
                              <img src={user.fotoUrl} alt={user.nama} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <span>{user.nama?.substring(0, 1)}</span>
                            )}
                            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-xl z-20 ${isFirst ? "bg-yellow-500 text-black" : "bg-slate-700 text-white"}`}>
                              {index + 1}
                            </div>
                            {isFirst && (
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="text-center w-full">
                            <p className={`text-[9px] font-black uppercase truncate px-1 mb-0.5 ${isFirst ? 'text-white' : 'text-slate-500'}`}>{user.nama?.split(' ')[0]}</p>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[7px] text-blue-500 font-bold uppercase tracking-widest leading-none">LVL {user.level || 1}</span>
                              <span className={`text-[8px] font-black italic ${isFirst ? 'text-yellow-500' : 'text-slate-400'}`}>{user.points?.toLocaleString()} XP</span>
                            </div>
                          </div>
                          <div className={`w-full mt-2 rounded-t-lg bg-gradient-to-b ${isFirst ? "h-8 from-yellow-500/20 to-transparent border-t border-yellow-500/30" : isSecond ? "h-4 from-slate-700/20 to-transparent border-t border-white/5" : "h-2 from-slate-800/20 to-transparent border-t border-white/5"}`} />
                        </motion.div>
                      );
                    })}
                </div>

                <button onClick={() => navigate("/leaderboard")} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-all active:scale-95 italic">
                  Access Full Leaderboard
                </button>
              </section>

              {/* MANAGEMENT GRID */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Manajemen Pasukan</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/kelola-pengguna" className="bg-slate-900 border border-white/5 p-4 rounded-xl text-left hover:bg-slate-800 transition-all">
                    <HiOutlineUserGroup className="text-emerald-500 mb-2" size={20} />
                    <p className="text-xs font-black text-slate-200 uppercase">Database</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-sans">Aktivasi Akun</p>
                  </Link>
                  <Link to="/admin/struktur" className="bg-slate-900 border border-white/5 p-4 rounded-xl text-left hover:bg-slate-800 transition-all">
                    <HiOutlineChartPie className="text-purple-500 mb-2" size={20} />
                    <p className="text-xs font-black text-slate-200 uppercase">Struktur</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-sans">Organisasi</p>
                  </Link>
                </div>
              </div>

              {/* ADMINISTRASI & LAPORAN */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Administrasi & Laporan</h2>
                <div className="grid grid-cols-1 gap-3">
                  <Link to="/pembina/export-presensi" className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl flex items-center justify-between hover:bg-blue-500/20 transition-all group">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <HiOutlineDocumentDownload size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-200 uppercase tracking-tight">Rekap Presensi Anggota</p>
                        <p className="text-[9px] text-blue-500/70 uppercase font-black tracking-widest italic mt-1">Generate Laporan PDF Bulanan</p>
                      </div>
                    </div>
                    <HiOutlineChevronRight className="text-blue-900" />
                  </Link>
                </div>
              </div>

              {/* XP SYSTEM MENU */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">XP System</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => navigate("/admin/validasi-poin")} className="bg-slate-900 border border-white/5 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <HiOutlineTrendingUp size={24} className="text-blue-500" />
                      <div>
                        <p className="text-xs font-black text-blue-200 uppercase tracking-tight">Reward & Punishment</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest italic mt-1">Manual XP Adjustment</p>
                      </div>
                    </div>
                    <HiOutlineChevronRight className="text-slate-700" />
                  </button>
                </div>
              </div>

              {/* KURIKULUM */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kurikulum</h2>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <Link to="/admin/master-sku" className="bg-slate-900 border border-white/5 p-4 rounded-xl hover:bg-slate-800 transition-all">
                    <HiOutlineCollection className="text-blue-400 mb-1" size={18} />
                    <p className="text-xs font-black text-slate-200 uppercase">Master SKU</p>
                  </Link>
                  <Link to="/admin/pengumuman" className="bg-slate-900 border border-white/5 p-4 rounded-xl hover:bg-slate-800 transition-all">
                    <HiOutlineLightningBolt className="text-yellow-500 mb-1" size={18} />
                    <p className="text-xs font-black text-slate-200 uppercase">Broadcast</p>
                  </Link>
                </div>
              </div>

              {/* SKU */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Syarat Kecakapan Umum (SKU)</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => navigate("/pembina/statistik-sku")} className="bg-slate-900 border border-white/5 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <HiOutlineChartPie size={24} className="text-purple-500" />
                      <div>
                        <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Analisis Capaian SKU</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest italic mt-1">Capaian SKU Pasukan</p>
                      </div>
                    </div>
                    <HiOutlineChevronRight className="text-slate-700" />
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 py-12 mt-auto">
          <button onClick={handleLogout} className="w-full text-slate-600 hover:text-red-500 transition-all py-3 border border-dashed border-white/10 rounded-xl uppercase font-black text-[9px] tracking-widest flex items-center justify-center gap-2">
            <HiOutlineLogout size={16} /> Logout Sesi Pembina
          </button>
        </div>

        {/* MODAL PENYESUAIAN XP */}
        <AnimatePresence>
          {selectedUserXP && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden relative">
                <h3 className="text-lg font-black text-white mb-1 uppercase text-center tracking-tighter leading-none">{selectedUserXP.nama}</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black text-center mb-6 tracking-widest italic opacity-50">Intelligence Dossier: XP System</p>
                <div className="space-y-4">
                  <div className="flex bg-black p-1 rounded-xl border border-white/5">
                    <button onClick={() => setXpType("addition")} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all ${xpType === 'addition' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-600'}`}>
                      <HiOutlineTrendingUp /> Hadiah
                    </button>
                    <button onClick={() => setXpType("reduction")} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all ${xpType === 'reduction' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-600'}`}>
                      <HiOutlineTrendingDown /> Sanksi
                    </button>
                  </div>
                  <input type="number" value={xpValue} onChange={(e) => setXpValue(e.target.value)} placeholder="JUMLAH POIN" className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-center text-xl font-black text-blue-400 focus:border-blue-500 outline-none uppercase" />
                  <textarea value={xpReason} onChange={(e) => setXpReason(e.target.value)} placeholder="ALASAN PENYESUAIAN..." className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-[10px] font-bold text-slate-300 focus:border-blue-500 outline-none h-20 resize-none uppercase tracking-tighter italic" />
                  <div className="flex flex-col gap-2 pt-2">
                    <button onClick={handleUpdateXP} className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${xpType === 'addition' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>Execute Command</button>
                    <button onClick={() => { setSelectedUserXP(null); setXpReason(""); }} className="w-full text-slate-600 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Abort Mission</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}