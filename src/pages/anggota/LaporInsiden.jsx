import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineShieldCheck, 
  HiOutlineCamera, 
  HiOutlineChevronLeft,
  HiOutlineExclamationCircle,
  HiOutlineEyeOff
} from "react-icons/hi";

export default function LaporInsiden() {
  const navigate = useNavigate();
  const [report, setReport] = useState({
    category: "Bullying",
    description: "",
    isAnonymous: false,
    attachment: null,
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
    if (report.description.length < 10) return alert("Mohon berikan deskripsi yang lebih jelas (Minimal 10 karakter).");

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
        adminReply: "",
        createdAt: serverTimestamp(),
      });
      alert("Laporan Anda telah diterima dengan aman. Tim SFH akan menindaklanjuti segera.");
      navigate("/anggota");
    } catch (error) {
      alert("Gagal mengirim laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-32 font-sans overflow-x-hidden selection:bg-red-800">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-white/5">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-red-900 via-[#450a0a] to-[#020617] px-6 pt-12 pb-24 relative overflow-hidden rounded-b-[4rem] shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />
          </div>

          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition z-50 mb-8"
          >
            <HiOutlineChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div className="relative z-10">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">
              SAFE FROM <br /> <span className="text-red-500 tracking-widest text-2xl">HARM (SFH)</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-red-600 rounded-full" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                Secure & Anonymous Report
              </p>
            </div>
          </div>
          
          <HiOutlineShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.05] rotate-12" />
        </div>

        {/* FORM AREA */}
        <div className="px-6 -mt-12 relative z-20">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-3xl space-y-6"
          >
            {/* KATEGORI */}
            <div>
              <label className="text-[10px] font-black uppercase ml-2 text-slate-500 tracking-[0.2em] flex items-center gap-2 mb-3">
                <HiOutlineExclamationCircle className="text-red-500" /> Kategori Insiden
              </label>
              <select 
                value={report.category}
                onChange={(e) => setReport({...report, category: e.target.value})}
                className="w-full p-4 bg-white/5 rounded-2xl font-bold text-xs outline-none border border-white/5 focus:border-red-600 transition-all text-white appearance-none cursor-pointer">
                <option className="bg-slate-900" value="Bullying">Perundungan (Bullying)</option>
                <option className="bg-slate-900" value="Harassment">Pelecehan</option>
                <option className="bg-slate-900" value="Physical">Kekerasan Fisik</option>
                <option className="bg-slate-900" value="Uncomfortable">Ketidaknyamanan Lingkungan</option>
                <option className="bg-slate-900" value="Other">Lainnya</option>
              </select>
            </div>

            {/* DESKRIPSI */}
            <div>
              <label className="text-[10px] font-black uppercase ml-2 text-slate-500 tracking-[0.2em] mb-3 block">Deskripsi Kejadian</label>
              <textarea 
                value={report.description}
                onChange={(e) => setReport({...report, description: e.target.value})}
                placeholder="Ceritakan secara kronologis untuk memudahkan investigasi..."
                className="w-full p-5 bg-white/5 rounded-[2rem] font-bold text-xs outline-none border border-white/5 focus:border-red-600 h-40 transition-all resize-none shadow-inner text-white placeholder:text-slate-600"
              />
            </div>

            {/* UPLOAD FOTO */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-500 tracking-[0.2em] mb-3 flex items-center gap-2">
                <HiOutlineCamera /> Lampiran Bukti (Opsional)
              </label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full p-4 bg-white/5 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${report.attachment ? 'border-red-600 bg-red-600/5' : 'border-white/10 group-hover:border-white/20'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {report.attachment ? "Foto Berhasil Terlampir ✅" : "Pilih File atau Ambil Foto"}
                  </span>
                </div>
              </div>
              <p className="text-[8px] text-slate-600 mt-2 ml-2 italic">*Maksimal ukuran file 1MB</p>
            </div>

            {/* ANONIM TOGGLE */}
            <label className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${report.isAnonymous ? 'bg-red-600/10 border-red-600/30' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center gap-3">
                <HiOutlineEyeOff className={report.isAnonymous ? "text-red-500" : "text-slate-500"} />
                <span className={`text-[10px] font-black uppercase tracking-tighter ${report.isAnonymous ? 'text-white' : 'text-slate-500'}`}>
                  Sembunyikan Identitas (Anonim)
                </span>
              </div>
              <input 
                type="checkbox"
                checked={report.isAnonymous}
                onChange={(e) => setReport({...report, isAnonymous: e.target.checked})}
                className="w-5 h-5 rounded-full accent-red-600"
              />
            </label>

            {/* ACTION BUTTON */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-red-600 to-red-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Enkripsi Laporan..." : "Kirim Laporan Rahasia"}
            </button>
          </motion.form>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-16 text-center border-t border-white/5 mt-auto">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose italic">
            Safe From Harm — Laskar Bahari Security <br />
            Privasi Anda adalah Prioritas Kami <br />
            © 2026 — SMPN 1 Biau
          </p>
        </div>
      </div>
    </div>
  );
}