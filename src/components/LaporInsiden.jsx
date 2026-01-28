import React, { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function LaporInsiden({ onClose }) {
  const [report, setReport] = useState({
    category: "Bullying",
    description: "",
    isAnonymous: false,
    attachment: null, 
  });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { 
        alert("Ukuran foto terlalu besar. Maksimal 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReport({ ...report, attachment: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (report.description.length < 10) return alert("Deskripsi terlalu pendek.");

    setLoading(true);
    try {
      await addDoc(collection(db, "sfh_reports"), {
        reporterUid: auth.currentUser.uid,
        ...report,
        status: "unread",
        adminReply: "", 
        createdAt: serverTimestamp(),
      });
      alert("Laporan terkirim secara rahasia.");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim laporan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6 italic">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Lapor Insiden</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Safe From Harm System</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[8px] font-black uppercase ml-2 text-slate-400">Kategori</label>
            <select 
              value={report.category}
              onChange={(e) => setReport({...report, category: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none border-2 border-transparent focus:border-blue-900 transition-all">
              <option value="Bullying">Perundungan (Bullying)</option>
              <option value="Harassment">Pelecehan</option>
              <option value="Physical">Kekerasan Fisik</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase ml-2 text-slate-400">Deskripsi</label>
            <textarea 
              value={report.description}
              onChange={(e) => setReport({...report, description: e.target.value})}
              placeholder="Ceritakan kejadiannya..."
              className="w-full p-5 bg-slate-50 rounded-[2rem] font-bold text-xs outline-none border-2 border-transparent focus:border-blue-900 h-28 transition-all resize-none shadow-inner"
            />
          </div>

          <div>
            <label className="text-[8px] font-black uppercase ml-2 text-slate-400">Foto Bukti (Opsional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-[10px] mt-1" />
          </div>

          <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl cursor-pointer">
            <input 
              type="checkbox"
              checked={report.isAnonymous}
              onChange={(e) => setReport({...report, isAnonymous: e.target.checked})}
              className="w-4 h-4 rounded-full text-blue-900"
            />
            <span className="text-[10px] font-black text-blue-900 uppercase">Sembunyikan Identitas (Anonim)</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button type="button" onClick={onClose} className="py-4 rounded-2xl text-[9px] font-black uppercase text-slate-400">Batal</button>
          <button type="submit" disabled={loading} className="bg-blue-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-xl">
            {loading ? "..." : "Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}