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

// --- IMPORT KONTEKS KONFIRMASI (Path disesuaikan ke folder lokal) ---
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
  HiOutlineSearch, HiOutlineDocumentDownload
} from "react-icons/hi";

export default function PembinaDashboard() {
  const navigate = useNavigate();
  const confirm = useConfirm(); // Inisialisasi Hook Konfirmasi
  const [activeTab, setActiveTab] = useState("command"); 
  
  // State untuk XP Management
  const [selectedUserXP, setSelectedUserXP] = useState(null);
  const [xpValue, setXpValue] = useState("");
  const [xpReason, setXpReason] = useState("");
  const [xpType, setXpType] = useState("addition"); // 'addition' atau 'reduction'
  
  const { pembinaData, presentUsers, stats, alerts, loading, unreadCount } = usePembinaDashboard();

  // --- FUNGSI LOGOUT DENGAN MODAL KONFIRMASI ---
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

  // --- FUNGSI EKSEKUSI PENYESUAIAN XP DENGAN MODAL KONFIRMASI ---
  const handleUpdateXP = async () => {
    if (!selectedUserXP || !xpValue || !xpReason) {
      alert("LENGKAPI POIN DAN ALASAN!");
      return;
    }

    confirm({
      title: "Execute XP Command?",
      message: `KONFIRMASI PERUBAHAN ${xpValue} XP UNTUK ${selectedUserXP.nama} DENGAN ALASAN: ${xpReason}?`,
      type: "blue",
      onConfirm: async () => {
        const pointsToUpdate = xpType === "addition" ? parseInt(xpValue) : -parseInt(xpValue);
        const currentUser = auth.currentUser;

        try {
          const userRef = doc(db, "users", selectedUserXP.id);
          
          // 1. Update Dokumen User & Tambahkan Log Pribadi
          await updateDoc(userRef, {
            points: increment(pointsToUpdate),
            attendanceLog: arrayUnion({
              timestamp: new Date().toISOString(),
              activity: xpReason,
              pointsEarned: pointsToUpdate,
              isSeen: false 
            })
          });

          // 2. Logging Audit Trail Global
          await addDoc(collection(db, "logs"), {
            action: "PENYESUAIAN XP",
            adminName: currentUser?.displayName || "PEMBINA",
            targetName: selectedUserXP.nama,
            targetId: selectedUserXP.id,
            reason: `${xpReason} (${pointsToUpdate > 0 ? '+' : ''}${pointsToUpdate} XP)`,
            timestamp: serverTimestamp(),
          });

          setSelectedUserXP(null);
          setXpValue("");
          setXpReason("");
          // Note: Konfirmasi berhasil sudah ditangani oleh penutupan modal otomatis
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
        
        {/* --- SECTION 1: HEADER --- */}
        <CommandHeader 
          pembinaData={pembinaData}
          unreadCount={unreadCount} 
          presentCount={presentUsers.length}
          alertsCount={alerts.sos}
        />

        {/* --- SECTION 2: NAVIGATION TABS --- */}
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

        {/* --- SECTION 3: DYNAMIC CONTENT --- */}
        <AnimatePresence mode="wait">
          {activeTab === "command" ? (
            <motion.div key="command" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-6 flex flex-col gap-6 mt-6">
              
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

              {/* NAVI INTEL ORB */}
              <NaviIntelOrb alerts={alerts} presentCount={presentUsers.length} />

              {/* SCANNER */}
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
                        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center font-black text-blue-400 text-xs border border-white/5 uppercase">{u.nama?.substring(0, 1)}</div>
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
                  <Link 
                    to="/pembina/export-presensi" 
                    className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl flex items-center justify-between hover:bg-blue-500/20 transition-all group"
                  >
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
                  <button 
                    onClick={() => navigate("/admin/validasi-poin")} 
                    className="bg-slate-900 border border-white/5 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-all"
                  >
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

              {/* CURRICULUM */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kurikulum</h2>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <Link to="/admin/master-sku" className="bg-slate-900 border border-white/5 p-4 rounded-xl"><p className="text-xs font-black text-slate-200 uppercase">Master SKU</p></Link>
                  <Link to="/admin/pengumuman" className="bg-slate-900 border border-white/5 p-4 rounded-xl"><p className="text-xs font-black text-slate-200 uppercase">Broadcast</p></Link>
                </div>
              </div>

              {/* Syarat Kecakapan Umum */}
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Syarat Kecakapan Umum (SKU)</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => navigate("/pembina/statistik-sku")} 
                    className="bg-slate-900 border border-white/5 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-all"
                  >
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

        {/* --- TERMINATION --- */}
        <div className="px-6 py-12 mt-auto">
          <button onClick={handleLogout} className="w-full text-slate-600 hover:text-red-500 transition-all py-3 border border-dashed border-white/10 rounded-xl uppercase font-black text-[9px] tracking-widest flex items-center justify-center gap-2">
            <HiOutlineLogout size={16} /> Logout Sesi Pembina
          </button>
        </div>

        {/* --- MODAL PENYESUAIAN XP (INTERNAL FORM) --- */}
        <AnimatePresence>
          {selectedUserXP && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 w-full max-w-xs rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden relative">
                
                <h3 className="text-lg font-black text-white mb-1 uppercase text-center tracking-tighter leading-none">{selectedUserXP.nama}</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black text-center mb-6 tracking-widest italic opacity-50">Intelligence Dossier: XP System</p>
                
                <div className="space-y-4">
                  {/* Toggle Mode */}
                  <div className="flex bg-black p-1 rounded-xl border border-white/5">
                    <button onClick={() => setXpType("addition")} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all ${xpType === 'addition' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-600'}`}>
                      <HiOutlineTrendingUp /> Hadiah
                    </button>
                    <button onClick={() => setXpType("reduction")} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all ${xpType === 'reduction' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-600'}`}>
                      <HiOutlineTrendingDown /> Sanksi
                    </button>
                  </div>

                  <input 
                    type="number" value={xpValue} onChange={(e) => setXpValue(e.target.value)}
                    placeholder="JUMLAH POIN" 
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-center text-xl font-black text-blue-400 focus:border-blue-500 outline-none uppercase"
                  />

                  <textarea 
                    value={xpReason} onChange={(e) => setXpReason(e.target.value)}
                    placeholder="ALASAN PENYESUAIAN..."
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-[10px] font-bold text-slate-300 focus:border-blue-500 outline-none h-20 resize-none uppercase tracking-tighter italic"
                  />

                  <div className="flex flex-col gap-2 pt-2">
                    <button 
                      onClick={handleUpdateXP} 
                      className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${xpType === 'addition' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                      Execute Command
                    </button>
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