import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function RekapitulasiSKU() {
  const [users, setUsers] = useState([]);
  const [skuData, setSkuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Standar jumlah poin per tingkat
  const totalPoin = {
    Ramu: 30,
    Rakit: 20,
    Terap: 10,
  };

  useEffect(() => {
    // 1. Ambil semua anggota
    const qUsers = query(
      collection(db, "users"),
      where("role", "==", "anggota"),
    );
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const u = [];
      snap.forEach((doc) => u.push({ id: doc.id, ...doc.data() }));
      setUsers(u);
    });

    // 2. Ambil semua progress yang sudah verified
    const qSku = query(
      collection(db, "sku_progress"),
      where("status", "==", "verified"),
    );
    const unsubSku = onSnapshot(qSku, (snap) => {
      const s = [];
      snap.forEach((doc) => s.push(doc.data()));
      setSkuData(s);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubSku();
    };
  }, []);

  // Fungsi hitung persen progres
  const getProgress = (uid, tingkat) => {
    const count = skuData.filter(
      (s) => s.uid === uid && s.tingkat === tingkat,
    ).length;
    const total = totalPoin[tingkat] || 30;
    return Math.round((count / total) * 100);
  };

  const filteredUsers = users.filter((u) =>
    u.nama?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-blue-900 animate-pulse text-xs italic uppercase">
        Analytic Engine Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 pt-12 pb-20 px-8 rounded-b-[4rem] text-white shadow-2xl">
        <Link
          to="/pembina"
          className="absolute top-10 left-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
          <img
            src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
            className="w-4 h-4 invert"
            alt="back"
          />
        </Link>
        <div className="text-center mt-4">
          <h1 className="text-xl font-black uppercase tracking-tighter">
            Rekapitulasi SKU
          </h1>
          <p className="text-blue-300 text-[9px] font-bold uppercase tracking-[0.2em] mt-1 italic">
            Monitoring Capaian Anggota
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="px-6 -mt-10 mb-8">
        <div className="bg-white rounded-[2rem] p-2 shadow-xl border border-slate-100 flex items-center transition-all focus-within:ring-4 focus-within:ring-blue-900/5">
          <input
            type="text"
            placeholder="Cari nama anggota..."
            className="w-full bg-transparent p-4 text-xs font-bold outline-none italic"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="px-6 space-y-4">
        {filteredUsers.map((user) => {
          const progress = getProgress(user.uid, user.tingkat || "Ramu");

          return (
            <div
              key={user.id}
              className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col gap-4 group hover:shadow-2xl transition-all duration-500">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-blue-900 border border-slate-100 shadow-inner group-hover:bg-blue-900 group-hover:text-white transition-all">
                    {user.nama?.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800">
                      {user.nama}
                    </h3>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {user.jabatan || "Anggota"} • {user.tingkat || "Ramu"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-900 leading-none">
                    {progress}%
                  </span>
                  <p className="text-[7px] text-slate-300 font-bold uppercase">
                    Selesai
                  </p>
                </div>
              </div>

              {/* PROGRESS BAR 

[Image of X]
 tag would be here if it were a complex chart, but Tailwind is enough */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${progress === 100 ? "bg-green-500" : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}
                  style={{ width: `${progress}%` }}></div>
              </div>

              <div className="flex justify-between items-center px-2">
                <p className="text-[8px] font-black text-slate-400 uppercase italic">
                  Target: {user.tingkat || "Ramu"}
                </p>
                {progress === 100 && (
                  <div className="flex items-center gap-1">
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/10629/10629607.png"
                      className="w-3 h-3"
                      alt="done"
                    />
                    <span className="text-[8px] font-black text-green-600 uppercase italic">
                      Siap Naik Tingkat!
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-20 py-10 text-center opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] italic">
          Laskar Bahari Management Analytic v1.0
        </p>
      </footer>
    </div>
  );
}
