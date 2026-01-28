import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function LaporInsiden() {
  const navigate = useNavigate();
  const [report, setReport] = useState({
    category: "Bullying",
    description: "",
    isAnonymous: false,
    attachment: null, // Poin 1: Untuk Bukti Foto
  });
  const [loading, setLoading] = useState(false);

  // Fungsi konversi gambar ke Base64 (Maks 1MB)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576) { 
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
    if (report.description.length < 10) return alert("Mohon berikan deskripsi yang lebih jelas.");

    setLoading(true);
    try {
      await addDoc(collection(db, "sfh_reports"), {
        reporterUid: auth.currentUser.uid,
        reporterName: auth.currentUser.displayName || "Anggota",
        category: report.category,
        description: report.description,
        isAnonymous: report.isAnonymous,
        attachment: report.attachment,
        status: "unread",
        adminReply: "", // Poin 3: Slot untuk tindak lanjut Admin
        createdAt: serverTimestamp(),
      });
      alert("Laporan Anda telah diterima dengan aman. Tim SFH akan menindaklanjuti segera.");
      navigate("/anggota"); // Kembali ke dashboard setelah sukses
    } catch (error) {
      alert("Gagal mengirim laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 italic font-medium">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-slate-100"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Safe From Harm</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ruang Lapor Aman & Rahasia</p>
          </div>
          <img src="https://cdn-icons-png.flaticon.com/128/10629/10629607.png" className="w-8 h-8 opacity-20" alt="sfh" />
        </div>

        <div className="space-y-4">
          {/* KATEGORI */}
          <div>
            <label className="text-[8px] font-black uppercase ml-2 text-slate-400 tracking-widest">Kategori Insiden</label>
            <select 
              value={report.category}
              onChange={(e) => setReport({...report, category: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none border-2 border-transparent focus:border-blue-900 transition-all cursor-pointer">
              <option value="Bullying">Perundungan (Bullying)</option>
              <option value="Harassment">Pelecehan</option>
              <option value="Physical">Kekerasan Fisik</option>
              <option value="Uncomfortable">Ketidaknyamanan Lingkungan</option>
              <option value="Other">Lainnya</option>
            </select>
          </div>

          {/* DESKRIPSI */}
          <div>
            <label className="text-[8px] font-black uppercase ml-2 text-slate-400 tracking-widest">Deskripsi Kejadian</label>
            <textarea 
              value={report.description}
              onChange={(e) => setReport({...report, description: e.target.value})}
              placeholder="Ceritakan secara kronologis..."
              className="w-full p-5 bg-slate-50 rounded-[2rem] font-bold text-xs outline-none border-2 border-transparent focus:border-blue-900 h-32 transition-all resize-none shadow-inner"
            />
          </div>

          {/* UPLOAD FOTO (Poin 1) */}
          <div>
            <label className="text-[8px] font-black uppercase ml-2 text-slate-400 tracking-widest">Lampiran Foto Bukti</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-[10px] text-slate-500 font-bold mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* ANONIM CHECKBOX */}
          <label className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all">
            <input 
              type="checkbox"
              checked={report.isAnonymous}
              onChange={(e) => setReport({...report, isAnonymous: e.target.checked})}
              className="w-4 h-4 rounded-full border-slate-300 text-blue-900 focus:ring-blue-900"
            />
            <span className="text-[10px] font-black text-blue-900 uppercase">Sembunyikan Nama Saya (Anonim)</span>
          </label>
        </div>

        {/* BUTTONS */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button 
            type="button" 
            onClick={() => navigate("/anggota")} 
            className="py-4 rounded-2xl text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-blue-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
          >
            {loading ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </div>
      </form>
    </div>
  );
}