import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function RiwayatPresensi() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    // Ambil data user dengan role anggota
    const q = query(collection(db, "users"), where("role", "==", "anggota"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const allLogs = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.attendanceLog) {
          data.attendanceLog.forEach((log) => {
            // Filter Berdasarkan Tanggal
            if (log.timestamp.startsWith(filterDate)) {
              allLogs.push({
                docId: doc.id,
                nama: data.nama,
                nta: data.nta || "-",
                tingkat: data.tingkat || "Anggota",
                ...log,
              });
            }
          });
        }
      });
      // Urutkan Waktu Terbaru
      setHistory(
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterDate]);

  // --- FUNGSI PENCARIAN (CLIENT-SIDE) ---
  const filteredHistory = history.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nta.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- FUNGSI EXPORT KE EXCEL (CSV FORMAT) ---
  const handleExportCSV = () => {
    if (filteredHistory.length === 0)
      return alert("Tidak ada data untuk di-export.");

    const headers = ["Nama", "NTA", "Tingkat", "Aktivitas", "Poin", "Waktu"];
    const rows = filteredHistory.map((log) => [
      log.nama,
      log.nta,
      log.tingkat,
      log.activity,
      log.pointsEarned,
      new Date(log.timestamp).toLocaleTimeString(),
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Presensi_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 pt-10 pb-20 px-8 rounded-b-[4rem] relative text-white">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <Link
                to="/pembina"
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
                <img
                  src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
                  className="w-4 h-4 invert"
                  alt="back"
                />
              </Link>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tighter">
                  Logbook Archive
                </h1>
                <p className="text-blue-300 text-[9px] font-black uppercase tracking-widest mt-1">
                  Laskar Bahari Database
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center border border-green-400 shadow-lg active:scale-90 transition">
              <img
                src="https://cdn-icons-png.flaticon.com/128/2521/2521845.png"
                className="w-5 h-5 invert"
                alt="export"
              />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BOX */}
        <div className="px-8 -mt-10 relative z-20 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="relative mb-4">
              <img
                src="https://cdn-icons-png.flaticon.com/128/622/622669.png"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30"
                alt="s"
              />
              <input
                type="text"
                placeholder="Cari Nama Anggota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 pl-10 pr-4 text-[11px] font-bold outline-none focus:border-blue-900 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[7px] font-black text-slate-400 uppercase ml-2 mb-1 block">
                  Pilih Tanggal
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-[11px] font-black text-blue-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESULT LIST */}
        <div className="flex-1 px-8 mt-10">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">
              Data Ditemukan
            </h2>
            <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full">
              {filteredHistory.length} Baris
            </span>
          </div>

          <div className="space-y-4 pb-12">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-[10px] font-black uppercase text-slate-300">
                Syncing...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                  Data tidak tersedia
                  <br />
                  pada kriteria ini
                </p>
              </div>
            ) : (
              filteredHistory.map((log, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-100 p-5 rounded-[2rem] flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-black text-[10px] text-blue-900 border border-blue-100 shadow-inner uppercase italic">
                      {log.nama.substring(0, 1)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-800 leading-tight">
                        {log.nama}
                      </p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                        NTA: {log.nta}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-green-600 uppercase">
                      +{log.pointsEarned} XP
                    </p>
                    <p className="text-[8px] text-slate-300 font-black uppercase mt-1 tracking-tighter">
                      {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="mt-auto py-10 text-center bg-slate-50 border-t border-slate-100">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">
            Laskar Bahari Ledger v3.5
          </p>
        </footer>
      </div>
    </div>
  );
}
