import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineChevronLeft, 
  HiOutlinePrinter,
  HiOutlineSearch,
  HiOutlineCalendar
} from "react-icons/hi";

export default function ExportPresensi() {
  const navigate = useNavigate();
  const [presensiData, setPresensiData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(""); // State Tanggal Mulai
  const [endDate, setEndDate] = useState("");     // State Tanggal Selesai
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mengambil data dari koleksi users yang memiliki field tanggalPresensi
    const q = query(collection(db, "users"), orderBy("lastAttendance", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        const user = doc.data();
        if (user.tanggalPresensi) {
          data.push({
            id: doc.id,
            nama: user.nama,
            tingkat: user.tingkat || "Belum Ada Tingkat",
            tanggal: user.tanggalPresensi, // Format YYYY-MM-DD
            jam: user.lastAttendance ? new Date(user.lastAttendance).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"
          });
        }
      });
      setPresensiData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // LOGIKA FILTER: Nama + Rentang Tanggal
  const filteredData = presensiData.filter(item => {
    const matchName = item.nama.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Logika Perbandingan Tanggal
    const itemDate = new Date(item.tanggal);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    let matchDate = true;
    if (start && end) {
      matchDate = itemDate >= start && itemDate <= end;
    } else if (start) {
      matchDate = itemDate >= start;
    } else if (end) {
      matchDate = itemDate <= end;
    }

    return matchName && matchDate;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-[10px] tracking-widest">
        Menyusun Laporan...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER - Sembunyikan saat print */}
      <div className="bg-slate-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl print:hidden">
        <div className="flex items-center gap-5 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
          >
            <HiOutlineChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black uppercase tracking-tighter">Rekap Presensi</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Laporan Kehadiran Anggota</p>
          </div>
          <button 
            onClick={handlePrint}
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <HiOutlinePrinter className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* FILTER PANEL - Sembunyikan saat print */}
      <div className="px-6 -mt-8 relative z-20 print:hidden space-y-3">
        {/* Search Nama */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-lg border border-slate-100 flex items-center gap-3">
          <HiOutlineSearch className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="text"
            placeholder="CARI NAMA ANGGOTA..."
            className="flex-1 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-[1.5rem] shadow-md border border-slate-100 flex flex-col">
            <label className="text-[7px] font-black text-slate-400 uppercase ml-2 mb-1">Mulai Tanggal</label>
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-[10px] font-bold text-blue-900 uppercase"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="bg-white p-3 rounded-[1.5rem] shadow-md border border-slate-100 flex flex-col">
            <label className="text-[7px] font-black text-slate-400 uppercase ml-2 mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-[10px] font-bold text-blue-900 uppercase"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* Reset Filter Button */}
        {(startDate || endDate || searchTerm) && (
          <button 
            onClick={() => {setStartDate(""); setEndDate(""); setSearchTerm("");}}
            className="w-full py-2 text-[8px] font-black uppercase text-red-400 hover:text-red-600 transition-all"
          >
            Bersihkan Semua Filter
          </button>
        )}
      </div>

      {/* TABEL DATA */}
      <div className="px-6 mt-8 print:mt-0 print:px-0">
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 print:shadow-none print:border-none print:rounded-none">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 print:bg-transparent">
            <div>
              <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Daftar Hadir Anggota</h2>
              {startDate && endDate && (
                <p className="text-[8px] font-bold text-blue-600 uppercase mt-1">Periode: {startDate} s/d {endDate}</p>
              )}
            </div>
            <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full print:hidden">
              {filteredData.length} Baris Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white print:text-black print:bg-slate-100">
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">Nama Anggota</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">Tingkat</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest border-b border-slate-800 text-center">Tanggal</th>
                  <th className="p-4 text-[9px] font-black uppercase tracking-widest border-b border-slate-800 text-right">Jam Masuk</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-bold uppercase text-slate-600">
                {filteredData.length > 0 ? (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-slate-800">{item.nama}</td>
                      <td className="p-4 text-blue-600">{item.tingkat}</td>
                      <td className="p-4 text-center text-slate-400 font-mono">{item.tanggal}</td>
                      <td className="p-4 text-right text-green-600 font-black">{item.jam}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center opacity-30 tracking-[0.2em]">Data Tidak Ditemukan Pada Periode Ini</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER KHUSUS PRINT */}
      <div className="hidden print:block mt-10 px-10 text-[10px] italic">
        <div className="flex justify-between">
          <div>
            <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
            <p>Sistem Informasi Laskar Bahari v3.0</p>
          </div>
          <div className="text-center w-40">
            <p>Pembina Pendamping,</p>
            <div className="h-20"></div>
            <p className="font-black border-t border-black pt-1">( ____________________ )</p>
          </div>
        </div>
      </div>
    </div>
  );
}