import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// --- KOMPONEN LENGKAPI KTA ---
// Muncul jika data administrasi anggota belum lengkap di Firestore
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

        // Kompresi ke format JPEG dengan kualitas 0.7
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setPreview(compressedBase64);
        setFormData({ ...formData, ktaPhotoURL: compressedBase64 });
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi Kelengkapan Data
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
      
      // Update data user ke Firestore
      await updateDoc(userRef, {
        ...formData,
        ktaStatus: "verified", // Penanda bahwa data sudah lengkap
        updatedAt: serverTimestamp()
      });

      alert("🎉 Selamat! Aktivasi KTA Digital Anda telah berhasil.");
      onClose(); // Menutup modal agar dashboard bisa mendeteksi perubahan data
    } catch (error) {
      console.error("Gagal aktivasi KTA:", error);
      alert("Gagal menyimpan data. Pastikan koneksi internet Anda stabil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[999] flex items-center justify-center p-4 italic overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-auto">
        
        {/* HEADER AREA */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <h2 className="text-2xl font-black uppercase italic leading-none relative z-10">
            Aktivasi KTA
          </h2>
          <p className="text-[10px] opacity-70 font-bold uppercase mt-3 tracking-[0.3em] relative z-10 leading-relaxed">
            Lengkapi Administrasi <br/> Pasukan Laskar Bahari
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* UPLOAD FOTO SECTION */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-36 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-inner transition-all hover:border-blue-300">
              {preview || formData.ktaPhotoURL ? (
                <img
                  src={preview || formData.ktaPhotoURL}
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                  alt="formal-profile"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <img
                        src="https://cdn-icons-png.flaticon.com/128/685/685655.png"
                        className="w-5 h-5 opacity-20"
                        alt="cam"
                    />
                  </div>
                  <p className="text-[8px] font-black text-slate-300 uppercase leading-tight">
                    Unggah <br/> Pas Foto
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">
              Format Formal 3:4
            </label>
          </div>

          <div className="space-y-4">
            {/* INPUT TTL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempat Lahir</label>
                <input
                  type="text"
                  required
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  placeholder="Nama Kota"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 focus:bg-white transition-all text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tgl Lahir</label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* INPUT JENIS KELAMIN */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin</label>
                <div className="flex gap-4">
                  {["Putra", "Putri"].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setFormData({ ...formData, jenis_kelamin: gender })}
                      className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 ${
                        formData.jenis_kelamin === gender
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                          : "bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-200"
                      }`}>
                      {gender}
                    </button>
                  ))}
                </div>
            </div>

            {/* INPUT AGAMA & JABATAN */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Agama</label>
                <select
                  required
                  value={formData.agama}
                  onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 focus:bg-white transition-all text-xs appearance-none">
                  <option value="">Pilih</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Khonghucu">Khonghucu</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan/Gol</label>
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Contoh: Penggalang"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* KWARRAN & KWARCAB */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kwarran</label>
                <input
                  type="text"
                  value={formData.kwarran}
                  onChange={(e) => setFormData({ ...formData, kwarran: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 focus:bg-white transition-all text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kwarcab</label>
                <input
                  type="text"
                  value={formData.kwarcab}
                  onChange={(e) => setFormData({ ...formData, kwarcab: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-900 focus:bg-white transition-all text-xs"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-black text-slate-300 uppercase text-[10px] tracking-widest hover:text-slate-500 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2.5] bg-blue-900 text-white font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              {loading ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  Syncing...
                </span>
              ) : (
                "Aktifkan KTA"
              )}
            </button>
          </div>
        </form>
        
        {/* FOOTER INFO */}
        <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
           <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">
              Security Encryption Active • Laskar Bahari v4.0
           </p>
        </div>
      </div>
    </div>
  );
}