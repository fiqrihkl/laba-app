import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineCamera, 
  HiOutlineIdentification, 
  HiOutlineShieldCheck,
  HiOutlineX
} from "react-icons/hi";

export default function LengkapiKTA({ userData, onClose }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    agama: userData?.agama || "",
    tempat_lahir: userData?.tempat_lahir || "",
    tanggal_lahir: userData?.tanggal_lahir || "",
    jabatan: userData?.jabatan || "Penggalang", 
    kwarran: userData?.kwarran || "Biau", 
    kwarcab: userData?.kwarcab || "Buol", 
    ktaPhotoURL: userData?.ktaPhotoURL || "",
    jenis_kelamin: userData?.jenis_kelamin || "",
  });

  // --- LOGIKA KOMPRESI PAS FOTO FORMAL (3:4) ---
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 400; // Rasio 3:4
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, MAX_WIDTH, MAX_HEIGHT);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setPreview(compressedBase64);
        setFormData({ ...formData, ktaPhotoURL: compressedBase64 });
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (
      !formData.ktaPhotoURL ||
      !formData.agama ||
      !formData.tempat_lahir ||
      !formData.tanggal_lahir ||
      !formData.jenis_kelamin
    ) {
      return alert("Mohon lengkapi seluruh data administrasi dan unggah Pas Foto formal!");
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        ...formData,
        ktaStatus: "verified",
        updatedAt: serverTimestamp()
      });

      alert("🎉 Selamat! Aktivasi KTA Digital Anda telah berhasil.");
      onClose();
    } catch (error) {
      console.error("Gagal aktivasi KTA:", error);
      alert("Gagal menyimpan data. Pastikan koneksi internet stabil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-[1000] flex items-center justify-center p-6 italic overflow-y-auto custom-scroll">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900/60 border border-white/10 w-full max-w-md rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden relative my-auto"
      >
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-slate-900 p-10 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/10 backdrop-blur-md">
                <HiOutlineIdentification size={28} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
              Identity Sync
            </h2>
            <p className="text-[9px] opacity-60 font-black uppercase mt-3 tracking-[0.3em]">
              Lengkapi KTA Digital Laskar Bahari
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* UPLOAD FOTO SECTION */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-36 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group transition-all hover:border-red-500/50">
              {preview || formData.ktaPhotoURL ? (
                <img
                  src={preview || formData.ktaPhotoURL}
                  className="w-full h-full object-cover"
                  alt="formal-profile"
                />
              ) : (
                <div className="text-center p-4">
                  <HiOutlineCamera size={24} className="mx-auto mb-2 text-slate-600 group-hover:text-red-500 transition-colors" />
                  <p className="text-[8px] font-black text-slate-500 uppercase leading-tight">
                    Formal <br/> Photo (3:4)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          <div className="space-y-5">
            {/* INPUT TTL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Tempat Lahir</label>
                <input
                  type="text" required
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  placeholder="KOTA"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-red-600 transition-all text-xs placeholder:text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Tgl Lahir</label>
                <input
                  type="date" required
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-red-600 transition-all text-xs"
                />
              </div>
            </div>

            {/* INPUT JENIS KELAMIN */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Unit Satuan (Gender)</label>
                <div className="flex gap-3">
                  {["Putra", "Putri"].map((gender) => (
                    <button
                      key={gender} type="button"
                      onClick={() => setFormData({ ...formData, jenis_kelamin: gender })}
                      className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
                        formData.jenis_kelamin === gender
                          ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                      }`}>
                      {gender}
                    </button>
                  ))}
                </div>
            </div>

            {/* INPUT AGAMA & JABATAN */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Agama</label>
                <select
                  required value={formData.agama}
                  onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-red-600 transition-all text-xs appearance-none">
                  <option className="bg-slate-900" value="">PILIH</option>
                  {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"].map(a => (
                    <option key={a} className="bg-slate-900" value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Jabatan</label>
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-red-600 transition-all text-xs"
                />
              </div>
            </div>

            {/* KWARRAN & KWARCAB */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Kwarran</label>
                <input
                  type="text"
                  value={formData.kwarran}
                  onChange={(e) => setFormData({ ...formData, kwarran: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-red-600 transition-all text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Kwarcab</label>
                <input
                  type="text"
                  value={formData.kwarcab}
                  onChange={(e) => setFormData({ ...formData, kwarcab: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-red-600 transition-all text-xs"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-black text-slate-600 uppercase text-[10px] tracking-widest hover:text-white transition-colors">
              Nanti Saja
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2.5] bg-white text-[#020617] font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? "Establishing Link..." : "Initialize KTA"}
            </button>
          </div>
        </form>
        
        {/* FOOTER INFO */}
        <div className="bg-black/20 py-6 text-center border-t border-white/5">
           <div className="flex items-center justify-center gap-2 mb-1">
              <HiOutlineShieldCheck className="text-emerald-500" />
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">
                Secure Encryption Active
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}