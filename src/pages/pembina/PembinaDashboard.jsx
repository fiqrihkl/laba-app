import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

// IMPORT REACT ICONS
import { 
  HiQrcode, 
  HiOutlineUserGroup, 
  HiOutlineClipboardList, 
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineDatabase,
  HiOutlineChevronRight,
  HiOutlineStatusOnline,
  HiOutlineLogout,
  HiOutlineLightningBolt
} from "react-icons/hi";

export default function PembinaDashboard() {
  const [pembinaData, setPembinaData] = useState(null);
  const [presentUsers, setPresentUsers] = useState([]);
  const [stats, setStats] = useState({ totalAnggota: 0 });
  const [activeSOS, setActiveSOS] = useState(0); 
  const [unreadSFH, setUnreadSFH] = useState(0);
  const [pendingSKU, setPendingSKU] = useState(0); 
  const [pendingTingkat, setPendingTingkat] = useState(0); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // 1. Profil Pembina
      const qUser = query(collection(db, "users"), where("uid", "==", user.uid));
      const unsubscribeUser = onSnapshot(qUser, (snapshot) => {
        if (!snapshot.empty) setPembinaData(snapshot.docs[0].data());
        setLoading(false);
      });

      // 2. Statistik Anggota
      const qStats = query(collection(db, "users"), where("role", "==", "anggota"));
      const unsubStats = onSnapshot(qStats, (snap) => setStats({ totalAnggota: snap.size }));

      // 3. Presensi Hari Ini
      const qPresent = query(
        collection(db, "users"),
        where("tanggalPresensi", "==", today),
        orderBy("lastAttendance", "desc")
      );
      const unsubPresent = onSnapshot(qPresent, (snap) => {
        setPresentUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // 4. SOS Monitor
      const qSOS = query(collection(db, "emergency_calls"), where("status", "==", "active"));
      const unsubSOS = onSnapshot(qSOS, (snap) => setActiveSOS(snap.size));

      // 5. SFH Monitor
      const qSFH = query(collection(db, "sfh_reports"), where("status", "==", "unread"));
      const unsubSFH = onSnapshot(qSFH, (snap) => setUnreadSFH(snap.size));

      // 6. Monitor SKU
      const qSKU = query(collection(db, "sku_progress"), where("status", "==", "pending"));
      const unsubSKU = onSnapshot(qSKU, (snap) => setPendingSKU(snap.size));

      // 7. Monitor Tingkat
      const qTingkat = query(collection(db, "pengajuan_tingkat"), where("status", "==", "pending"));
      const unsubTingkat = onSnapshot(qTingkat, (snap) => setPendingTingkat(snap.size));

      return () => {
        unsubscribeUser();
        unsubStats();
        unsubPresent();
        unsubSOS();
        unsubSFH();
        unsubSKU();
        unsubTingkat();
      };
    }
  }, [today]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white italic font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-[0.4em]">
      Sinkronisasi Command Center...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-100">
        
        {/* HEADER AREA - BLUE GRADIENT (Matched with Member Dashboard) */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-8 pt-12 pb-24 relative shadow-lg">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-[1.8rem] shadow-2xl rotate-3 transition-transform hover:rotate-0 overflow-hidden">
                <div className="w-full h-full rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-blue-900 font-black text-2xl overflow-hidden shadow-inner uppercase">
                  {pembinaData?.photoURL ? <img src={pembinaData.photoURL} alt="P" className="w-full h-full object-cover" /> : pembinaData?.nama?.substring(0, 1)}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-none tracking-tighter uppercase drop-shadow-md">
                  {pembinaData?.nama?.split(" ")[0] || "Kapten"}
                </h1>
                <p className="text-[9px] text-blue-100 font-bold uppercase tracking-widest mt-2 flex items-center gap-1 opacity-80 leading-none">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span> 
                  Captain on Duty
                </p>
                <p className="text-[7px] text-blue-300 font-black uppercase mt-1 tracking-tighter italic opacity-60">Gudep 10.491-10.492</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-[1.8rem] flex flex-col items-center shadow-xl min-w-[80px]">
              <HiOutlineUserGroup className="text-blue-200 w-5 h-5 mb-1" />
              <span className="text-[7px] font-black text-blue-100 uppercase tracking-widest leading-none">Total Laskar</span>
              <span className="text-xl font-black text-white italic tracking-tighter leading-none mt-1">
                {stats.totalAnggota}
              </span>
            </div>
          </div>

          {/* ALERT SYSTEM (SOS & SFH) - FLOATING STYLE */}
          <div className="mt-8 flex gap-3 relative z-10">
            <Link to="/pembina/monitor-sos" className={`flex-1 p-4 rounded-2xl border backdrop-blur-md transition-all active:scale-95 flex items-center gap-3 ${activeSOS > 0 ? "bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse text-white" : "bg-white/5 border-white/10 text-white/50"}`}>
               <div className={`p-2 rounded-xl ${activeSOS > 0 ? "bg-white text-red-500" : "bg-white/10 text-blue-300"}`}>
                  <HiOutlineBell size={18} />
               </div>
               <div className="text-left leading-none">
                  <p className="text-[7px] font-black uppercase opacity-60 mb-1">SOS Signal</p>
                  <p className="text-xs font-black tracking-tight">{activeSOS} Active</p>
               </div>
            </Link>
            <Link to="/admin/investigasi-sfh" className={`flex-1 p-4 rounded-2xl border backdrop-blur-md transition-all active:scale-95 flex items-center gap-3 ${unreadSFH > 0 ? "bg-white border-white text-blue-900 shadow-xl" : "bg-white/5 border-white/10 text-white/50"}`}>
               <div className={`p-2 rounded-xl ${unreadSFH > 0 ? "bg-blue-900 text-white" : "bg-white/10 text-blue-300"}`}>
                  <HiOutlineShieldCheck size={18} />
               </div>
               <div className="text-left leading-none">
                  <p className="text-[7px] font-black uppercase opacity-60 mb-1">SFH Guard</p>
                  <p className="text-xs font-black tracking-tight">{unreadSFH} Reports</p>
               </div>
            </Link>
          </div>
        </div>

        {/* SECTION 2: FLOATING QUICK SCANNER */}
        <div className="px-6 -mt-8 relative z-20">
          <button 
            onClick={() => navigate("/pembina/scanner")}
            className="w-full bg-blue-600 text-white border-none rounded-[2.2rem] py-5 px-8 flex items-center justify-between shadow-2xl shadow-blue-900/40 active:scale-95 transition-all group overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform shadow-inner">
                <HiQrcode className="w-7 h-7" />
              </div>
              <div className="text-left leading-none">
                 <h3 className="text-xs font-black uppercase tracking-widest leading-none">Absensi Lapangan</h3>
                 <p className="text-[8px] font-bold text-blue-100 uppercase mt-1.5 italic leading-none opacity-80">Mulai Pemindaian KTA</p>
              </div>
            </div>
            <HiOutlineChevronRight className="text-blue-200 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        {/* SECTION 3: MANAGEMENT GRID */}
        <div className="px-6 mt-8">
          <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] mb-4 ml-2 italic">Operation Deck</h2>
          <div className="grid grid-cols-3 gap-4">
            
            <Link to="/pembina/verifikasi-sku" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group relative">
              {pendingSKU > 0 && <div className="absolute top-2 right-2 bg-red-600 w-6 h-6 rounded-full border-4 border-white text-white text-[9px] font-black flex items-center justify-center shadow-lg animate-bounce">{pendingSKU}</div>}
              <div className="w-12 h-12 bg-blue-50 rounded-[1.2rem] flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform"><HiOutlineAcademicCap size={24} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Verif SKU</span>
            </Link>

            <Link to="/admin/verifikasi-tingkat" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group relative text-center">
              {pendingTingkat > 0 && <div className="absolute top-2 right-2 bg-orange-600 w-6 h-6 rounded-full border-4 border-white text-white text-[9px] font-black flex items-center justify-center shadow-lg animate-bounce">{pendingTingkat}</div>}
              <div className="w-12 h-12 bg-indigo-50 rounded-[1.2rem] flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform"><HiOutlineChartBar size={24} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center">Promosi</span>
            </Link>

            <Link to="/kelola-pengguna" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group">
              <div className="w-12 h-12 bg-emerald-50 rounded-[1.2rem] flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-110 transition-transform"><HiOutlineUserGroup size={24} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Crew</span>
            </Link>

            <Link to="/pembina/riwayat" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group">
              <div className="w-12 h-12 bg-purple-50 rounded-[1.2rem] flex items-center justify-center text-purple-600 mb-2 group-hover:scale-110 transition-transform"><HiOutlineClipboardList size={24} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Logbook</span>
            </Link>

            <Link to="/admin/validasi-poin" className="aspect-square bg-white border border-slate-100 rounded-[2.2rem] flex flex-col items-center justify-center shadow-sm active:scale-90 transition-all group">
              <div className="w-12 h-12 bg-yellow-50 rounded-[1.2rem] flex items-center justify-center text-yellow-600 mb-2 group-hover:scale-110 transition-transform"><HiOutlineDocumentText size={24} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Valid XP</span>
            </Link>

            <Link to="/pembina/admin-hub" className="aspect-square bg-blue-900 rounded-[2.2rem] flex flex-col items-center justify-center text-white shadow-xl active:scale-90 transition-all">
              <div className="w-12 h-12 bg-white/10 rounded-[1.2rem] flex items-center justify-center text-blue-300 mb-2"><HiOutlineDatabase size={24} /></div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">System</span>
            </Link>
          </div>
        </div>

        {/* SECTION 4: LIVE MONITORING FEED */}
        <div className="px-6 mt-10 mb-10 flex-1">
          <div className="flex justify-between items-end mb-5 px-2">
            <h2 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] flex items-center gap-2">
                <HiOutlineStatusOnline className="text-green-500 animate-pulse" /> Live Presence
            </h2>
            <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
               <span className="text-blue-600 text-[8px] font-black uppercase tracking-tighter">{presentUsers.length} Siswa On-Board</span>
            </div>
          </div>

          <div className="bg-slate-100/50 rounded-[2.5rem] p-6 border border-slate-100 max-h-[400px] overflow-y-auto scrollbar-hide shadow-inner">
            {presentUsers.length === 0 ? (
              <div className="py-12 text-center opacity-30 italic">
                <HiOutlineUserGroup className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center leading-relaxed">Dermaga Masih Kosong.<br/>Belum ada anggota hadir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presentUsers.map((u) => (
                  <div key={u.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-50 hover:border-blue-200 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs uppercase shadow-inner border border-white group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        {u.nama ? u.nama.substring(0, 1) : "A"}
                      </div>
                      <div className="leading-tight text-left">
                        <p className="text-[11px] font-black uppercase text-slate-800 tracking-tight mb-1">{u.nama}</p>
                        <p className="text-[8px] font-bold uppercase text-blue-500/60 tracking-widest leading-none">{u.tingkat || "Laskar Muda"}</p>
                      </div>
                    </div>
                    <div className="text-right leading-tight">
                      <p className="text-[10px] font-black text-blue-600">+50 XP</p>
                      <div className="flex items-center gap-1 justify-end mt-1 opacity-30">
                        <HiOutlineStatusOnline size={8} className="text-green-500" />
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">
                          {u.lastAttendance ? new Date(u.lastAttendance).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LOGOUT COMMAND */}
        <div className="px-10 pb-8 mt-auto">
            <button 
                onClick={() => {
                    if (window.confirm("Akhiri sesi komando?")) {
                        signOut(auth);
                        navigate("/");
                    }
                }}
                className="w-full flex items-center justify-center gap-3 text-slate-300 hover:text-red-500 transition-all py-3 group border border-dashed border-slate-100 rounded-2xl hover:border-red-100"
            >
                <HiOutlineLogout size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Logout Command Panel</span>
            </button>
        </div>
      </div>
    </div>
  );
}