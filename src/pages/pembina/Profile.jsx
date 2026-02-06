import React, { useState, useEffect, useRef } from "react";
import { auth, db, storage } from "../../firebase"; 
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineUser, 
  HiOutlineBadgeCheck, 
  HiOutlineLightningBolt, 
  HiOutlineClock,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineIdentification,
  HiOutlinePencilAlt,
  HiOutlineCamera,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlinePhone,
  HiOutlineOfficeBuilding
} from "react-icons/hi";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nama: "",
    photoURL: "",
    nta: "",
    jabatan: "",
    pangkalan: "",
    noTelp: ""
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({ id: docSnap.id, ...data });
        setFormData({ 
          nama: data.nama || "", 
          photoURL: data.photoURL || "",
          nta: data.nta || "",
          jabatan: data.jabatan || "",
          pangkalan: data.pangkalan || "",
          noTelp: data.noTelp || ""
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- LOGIKA KOMPRESI & UPLOAD ANTI-ERROR ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diizinkan.");
      return;
    }

    setIsUploading(true);
    const user = auth.currentUser;

    try {
      // 1. Jalankan proses kompresi asinkron
      const compressedBlob = await compressImage(file);
      
      // 2. Buat referensi storage
      const storageRef = ref(storage, `avatars/${user.uid}`);
      
      // 3. Eksekusi upload
      const uploadResult = await uploadBytes(storageRef, compressedBlob);
      console.log("Upload success:", uploadResult);
      
      // 4. Dapatkan URL permanen
      const downloadURL = await getDownloadURL(storageRef);
      
      // 5. Update state lokal
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      
      alert("FOTO BERHASIL DIKOMPRES & DIUNGGAH.");
    } catch (error) {
      console.error("Upload error detail:", error);
      alert(`GAGAL UPLOAD: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset input file agar bisa pilih file yang sama lagi
      if (e.target) e.target.value = "";
    }
  };

  // Helper Kompresi (Menghasilkan Blob untuk Storage)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = (error) => reject(error);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onerror = (error) => reject(error);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; // Resolusi efisien untuk avatar
          const scaleSize = MAX_WIDTH / img.width;
          
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Gagal mengonversi gambar ke Blob."));
          }, "image/jpeg", 0.7); // Kualitas 70% JPEG
        };
      };
    });
  };

  const handleUpdateProfile = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { ...formData });
      setIsEditing(false);
      alert("DATA DOSSIER BERHASIL DISINKRONISASI.");
    } catch (error) {
      console.error("Update error:", error);
      alert("GAGAL MEMPERBARUI DATABASE.");
    }
  };

  const handleLogout = () => {
    if (window.confirm("AKHIRI SESI AKSES NAVIGASI?")) {
      signOut(auth).then(() => navigate("/"));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-500 font-sans uppercase text-[10px] tracking-widest italic font-black">
      <div className="w-8 h-8 border-2 border-slate-800 border-t-blue-600 rounded-full animate-spin mb-4" />
      Accessing Personal Dossier...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        <header className="p-8 pt-16 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6 group cursor-pointer" onClick={() => setIsEditing(true)}>
            <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-blue-500/30 p-1 shadow-2xl relative overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="User" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl text-blue-500">
                  <HiOutlineUser size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <HiOutlineCamera className="text-white" size={24} />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-[8px] font-black px-2 py-1 rounded border border-[#020617] uppercase shadow-lg tracking-widest">COMMANDER</div>
          </motion.div>

          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-white leading-none drop-shadow-md">{profile?.nama || "Identity Unknown"}</h1>
            <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-400"><HiOutlinePencilAlt size={18} /></button>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{profile?.jabatan || "JABATAN BELUM DISET"}</p>
        </header>

        <main className="px-6 space-y-6">
          {/* PEMBINA DOSSIER CARD */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <HiOutlineIdentification className="text-blue-500" size={20} />
               <div>
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">NTA / NIP</p>
                  <p className="text-xs font-bold text-slate-200">{profile?.nta || "BELUM TERDATA"}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <HiOutlineOfficeBuilding className="text-blue-500" size={20} />
               <div>
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Pangkalan</p>
                  <p className="text-xs font-bold text-slate-200 uppercase">{profile?.pangkalan || "BELUM TERDATA"}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <HiOutlinePhone className="text-blue-500" size={20} />
               <div>
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Kontak</p>
                  <p className="text-xs font-bold text-slate-200">{profile?.noTelp || "BELUM TERDATA"}</p>
               </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <HiOutlineClock className="text-blue-500" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence Dossier (Log Activity)</h2>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scroll">
              {profile?.attendanceLog && profile.attendanceLog.length > 0 ? (
                [...profile.attendanceLog].reverse().map((log, index) => (
                  <div key={index} className="bg-slate-900/40 border border-white/5 p-3 rounded-xl flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${log.pointsEarned > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {log.pointsEarned > 0 ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-200 uppercase leading-none mb-1">{log.activity}</p>
                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">{new Date(log.timestamp).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className={`text-[11px] font-black ${log.pointsEarned > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{log.pointsEarned > 0 ? `+${log.pointsEarned}` : log.pointsEarned} XP</div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl opacity-30">
                  <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">No Logs Recorded</p>
                </div>
              )}
            </div>
          </section>

          <div className="pt-4 space-y-3 pb-12">
            <button onClick={handleLogout} className="w-full border border-dashed border-red-900/30 p-4 rounded-2xl flex items-center justify-center gap-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group">
              <HiOutlineLogout size={20} className="group-hover:translate-x-1 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-widest">Logout Sesi Navigasi</p>
            </button>
          </div>
        </main>

        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto custom-scroll">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2"><HiOutlinePencilAlt className="text-blue-500" /> Update Dossier</h3>
                  <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white"><HiOutlineX size={20} /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase px-1">Identity Image</label>
                    <div onClick={() => !isUploading && fileInputRef.current.click()} className="w-full bg-black border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500/50 transition-all">
                      {isUploading ? <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /> : <><HiOutlineUpload className="text-blue-500" size={24} /><p className="text-[8px] font-black text-slate-500 uppercase">Change Photo</p></>}
                    </div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    {isUploading && <p className="text-[7px] text-blue-500 font-bold uppercase text-center animate-pulse">Encrypting Data...</p>}
                  </div>

                  <div className="space-y-4 pt-2">
                    {[
                      { label: "Commander Name", key: "nama", placeholder: "Input Name..." },
                      { label: "NTA / NIP", key: "nta", placeholder: "Input NTA..." },
                      { label: "Position / Jabatan", key: "jabatan", placeholder: "Ex: Pembina Pasukan" },
                      { label: "Gugus Depan / Pangkalan", key: "pangkalan", placeholder: "Ex: SMPN 1 Biau" },
                      { label: "Phone Number", key: "noTelp", placeholder: "Ex: 0822..." }
                    ].map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">{field.label}</label>
                        <input 
                          type="text" value={formData[field.key]}
                          onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                          placeholder={field.placeholder}
                          className="w-full bg-black border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <button onClick={handleUpdateProfile} disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all">
                      {isUploading ? "PROCESS DATA..." : "Save Dossier Changes"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-auto py-8 text-center opacity-30 mx-6 border-t border-white/5">
           <p className="text-[8px] font-bold uppercase tracking-[0.5em]">Identity Protocol v2.7 — NAVIGASI</p>
        </footer>
      </div>
    </div>
  );
}