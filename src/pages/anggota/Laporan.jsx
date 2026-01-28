import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

function Laporan() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
        <div className="text-center font-black text-blue-900 animate-pulse uppercase text-xs tracking-widest">
          Menyusun Laporan...
        </div>
      </div>
    );

  // Fungsi untuk memformat tanggal estetik
  const formatTanggal = (isoString) => {
    if (!isoString) return "Baru Saja";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        {/* SECTION: PREMIUM HEADER */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 pt-10 pb-20 px-8 rounded-b-[4rem] relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10 mb-10">
            <Link
              to="/anggota"
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
              <img
                src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
                className="w-4 h-4 brightness-0 invert"
                alt="back"
              />
            </Link>
            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-70">
              Activity Report
            </h1>
            <div className="w-10"></div>
          </div>

          <div className="flex flex-col items-center relative z-10">
            <p className="text-blue-300 text-[9px] font-black uppercase tracking-[0.4em] mb-3 leading-none">
              Total Akumulasi
            </p>
            <h2 className="text-5xl font-black italic tracking-tighter leading-none">
              {userData?.points || 0}
              <span className="text-sm font-black text-yellow-400 ml-2 uppercase tracking-normal">
                XP
              </span>
            </h2>
          </div>
        </div>

        {/* SECTION: WEEKLY SUMMARY CHART */}
        <div className="px-6 -mt-12 relative z-20">
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-50 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <img
                  src="https://cdn-icons-png.flaticon.com/128/3557/3557655.png"
                  className="w-5 h-5"
                  alt="chart"
                />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Aktivitas Mingguan
                </h3>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <span className="text-[8px] text-blue-600 font-black uppercase italic">
                  Current Week
                </span>
              </div>
            </div>

            {/* Grafik Batang Estetik */}
            <div className="flex items-end justify-between h-28 gap-3 px-1 relative z-10">
              {[30, 60, 45, 90, 40, 70, 50].map((height, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 flex-1 group">
                  <div className="relative w-full flex justify-center">
                    <div
                      className={`w-full rounded-2xl transition-all duration-1000 ease-out ${
                        i === 3
                          ? "bg-blue-900 shadow-[0_10px_15px_-3px_rgba(30,58,138,0.3)]"
                          : "bg-slate-100 group-hover:bg-blue-200"
                      }`}
                      style={{ height: `${height}%` }}></div>
                  </div>
                  <span className="text-[8px] font-black text-slate-300 uppercase">
                    {["S", "S", "R", "K", "J", "S", "M"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION: RIWAYAT AKTIVITAS DINAMIS */}
        <div className="flex-1 px-8 mt-12 mb-8">
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Log Aktivitas
              </h2>
            </div>
            <img
              src="https://cdn-icons-png.flaticon.com/128/1063/1063376.png"
              className="w-4 h-4 opacity-20"
              alt="filter"
            />
          </div>

          <div className="space-y-5">
            {/* LOG DINAMIS DARI ATTENDANCE LOG */}
            {userData?.attendanceLog?.length > 0 ? (
              [...userData.attendanceLog]
                .reverse()
                .slice(0, 5)
                .map((log, index) => (
                  <div
                    key={index}
                    className="flex gap-5 items-center p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:border-blue-900/10 transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-900 transition-all duration-500">
                      <img
                        src={
                          log.activity.includes("Scan") ||
                          log.activity.includes("Presensi")
                            ? "https://cdn-icons-png.flaticon.com/128/3126/3126504.png"
                            : "https://cdn-icons-png.flaticon.com/128/1162/1162456.png"
                        }
                        className="w-7 h-7 group-hover:brightness-0 group-hover:invert transition-all"
                        alt="icon"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-blue-900 transition-colors">
                        {log.activity}
                      </p>
                      <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase tracking-tighter italic">
                        {formatTanggal(log.timestamp)}
                      </p>
                    </div>
                    <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 shadow-sm">
                      <span className="text-[10px] font-black text-green-600">
                        +{log.pointsEarned} XP
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              /* State Kosong */
              <div className="p-14 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 text-center animate-in fade-in">
                <img
                  src="https://cdn-icons-png.flaticon.com/128/7486/7486744.png"
                  className="w-12 h-12 mx-auto mb-5 opacity-20"
                  alt="empty"
                />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Belum ada aktivitas <br /> yang tercatat
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: FOOTER & ACTIONS */}
        <div className="p-8 bg-slate-50 text-center border-t border-slate-100 mt-auto">
          {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
          <button
            onClick={() => window.print()}
            className="w-full bg-slate-900 text-white text-[10px] font-black py-6 rounded-[2rem] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all flex items-center justify-center gap-4 italic">
            <img
              src="https://cdn-icons-png.flaticon.com/128/2874/2874821.png"
              className="w-5 h-5 brightness-0 invert"
              alt="pdf"
            />
            Export Document PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default Laporan;
