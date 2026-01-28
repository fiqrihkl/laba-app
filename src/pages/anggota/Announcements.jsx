import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInfo, setSelectedInfo] = useState(null); // State untuk Modal
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubUser = onSnapshot(userRef, (d) => {
        if (d.exists()) setUserData(d.data());
      });

      const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
      );
      const unsubAnnounce = onSnapshot(q, (snap) => {
        setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => {
        unsubUser();
        unsubAnnounce();
      };
    }
  }, []);

  const handleOpenDetail = (info) => {
    setSelectedInfo(info);
    handleClaimXP(info.id, info.title);
  };

  const handleClaimXP = async (id, title) => {
    const user = auth.currentUser;
    if (!user || !userData) return;

    if (!userData.claimedXP?.includes(id)) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          points: increment(50),
          claimedXP: arrayUnion(id),
          attendanceLog: arrayUnion({
            timestamp: new Date().toISOString(),
            activity: `Membaca: ${title}`,
            pointsEarned: 50,
          }),
        });
      } catch (err) {
        console.error("Gagal klaim:", err);
      }
    }
  };

  const filteredData = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
        <p className="font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-[0.3em]">
          Mengakses Data Pusat...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 pt-12 pb-20 px-8 rounded-b-[4rem] relative overflow-hidden text-white shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex items-center justify-between relative z-10 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
              <img
                src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
                className="w-4 h-4 brightness-0 invert"
                alt="back"
              />
            </button>
            <h1 className="text-[10px] font-black tracking-[0.5em] uppercase opacity-60">
              Archive Center
            </h1>
            <div className="w-10"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight italic">
              Timeline Informasi
            </h2>
            <p className="text-blue-300 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">
              Gudep 10.491-10.492 SMPN 1 Biau
            </p>
          </div>
        </div>

        {/* SEARCH BOX */}
        <div className="px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-3xl p-2 shadow-2xl border border-slate-100 flex items-center group">
            <div className="w-10 h-10 flex items-center justify-center opacity-30">
              <img
                src="https://cdn-icons-png.flaticon.com/128/622/622669.png"
                className="w-4 h-4"
                alt="search"
              />
            </div>
            <input
              type="text"
              placeholder="Cari arsip pengumuman..."
              className="flex-1 bg-transparent border-none p-3 text-xs font-bold outline-none italic placeholder:text-slate-300"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* CONTENT LIST */}
        <div className="px-6 mt-8 space-y-5 pb-10 flex-1">
          {filteredData.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <img
                src="https://cdn-icons-png.flaticon.com/128/7486/7486744.png"
                className="w-16 h-16 mx-auto mb-4 grayscale"
                alt="empty"
              />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Informasi tidak ditemukan
              </p>
            </div>
          ) : (
            filteredData.map((info) => (
              <div
                key={info.id}
                onClick={() => handleOpenDetail(info)}
                className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 group active:scale-95 cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[7px] bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-400 uppercase tracking-widest">
                    {info.date}
                  </span>
                  {userData?.claimedXP?.includes(info.id) ? (
                    <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/10629/10629607.png"
                        className="w-2.5 h-2.5"
                        alt="done"
                      />
                      <span className="text-[7px] font-black text-green-600 uppercase">
                        Read
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-yellow-400 rounded-md px-2 py-0.5 animate-pulse">
                      <span className="text-[7px] font-black text-blue-900 uppercase">
                        +50 XP
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight italic group-hover:text-blue-900 transition-colors">
                  {info.title}
                </h3>

                {/* TRUNCATED TEXT (Baca Selengkapnya Trigger) */}
                <p className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                  {info.content}
                </p>

                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    Baca Selengkapnya
                  </span>
                  <div className="w-4 h-[1px] bg-blue-600/30"></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL DETAIL (MODERN EXPANSION) */}
        {selectedInfo && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 animate-in fade-in duration-300">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedInfo(null)}></div>

            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-[110] animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
              <div className="bg-slate-50 p-8 border-b border-slate-100 relative">
                <button
                  onClick={() => setSelectedInfo(null)}
                  className="absolute top-6 right-6 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center active:scale-90 transition">
                  <span className="text-slate-500 text-xs font-black">✕</span>
                </button>
                <span className="text-[8px] bg-blue-900 text-white px-3 py-1 rounded-lg font-black uppercase tracking-[0.2em]">
                  Detail Informasi
                </span>
                <h3 className="mt-4 text-xl font-black text-slate-800 uppercase tracking-tighter italic leading-tight">
                  {selectedInfo.title}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                  Dipublikasikan: {selectedInfo.date}
                </p>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p className="text-xs text-slate-600 font-medium leading-[1.8] italic whitespace-pre-wrap">
                  {selectedInfo.content}
                </p>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setSelectedInfo(null)}
                  className="w-full bg-blue-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all italic">
                  Saya Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
