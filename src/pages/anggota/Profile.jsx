import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import { QRCodeCanvas } from "qrcode.react";

// IMPORT REACT ICONS
import { 
  MdChevronLeft, 
  MdPhotoCamera, 
  MdEdit, 
  MdPlace, 
  MdEvent, 
  MdPublic, 
  MdPhone, 
  MdSchool, 
  MdVerified,
  MdWc,
  MdClose,
  MdOutlineFingerprint,
  MdQrCodeScanner,
  MdEmojiEvents,
  MdMilitaryTech
} from "react-icons/md";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [targetTingkat, setTargetTingkat] = useState("");
  const [sertifikatBase64, setSertifikatBase64] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);

  const [formData, setFormData] = useState({
    nama: "",
    telepon: "",
    alamat: "",
    agama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenisKelamin: "",
  });

  const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  const getDisplayTingkat = () => {
    const tingkat = userData?.tingkat?.toUpperCase();
    if (!tingkat || tingkat === "" || tingkat === "BELUM ADA TINGKATAN") return "Penggalang";
    if (tingkat === "RAMU") return "Penggalang Ramu";
    if (tingkat === "RAKIT") return "Penggalang Rakit";
    if (tingkat === "TERAP") return "Penggalang Terap";
    return "Penggalang";
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const qUser = query(collection(db, "users"), where("uid", "==", user.uid));
      const unsubscribeUser = onSnapshot(qUser, (snapshot) => {
        if (!snapshot.empty) {
          const docSnapshot = snapshot.docs[0];
          const data = docSnapshot.data();
          setUserData({ ...data, docId: docSnapshot.id });
          setFormData({
            nama: data.nama || "",
            telepon: data.telepon || "",
            alamat: data.alamat || "",
            agama: data.agama || "",
            tempat_lahir: data.tempat_lahir || "",
            tanggal_lahir: data.tanggal_lahir || "",
            jenisKelamin: data.jenisKelamin || "",
          });
        }
        setLoading(false);
      });

      const qPending = query(
        collection(db, "pengajuan_tingkat"),
        where("uid", "==", user.uid),
        where("status", "==", "pending")
      );

      const unsubscribePending = onSnapshot(qPending, (snapshot) => {
        setPendingRequest(!snapshot.empty ? snapshot.docs[0].data() : null);
      });

      return () => {
        unsubscribeUser();
        unsubscribePending();
      };
    }
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        try {
          await updateDoc(doc(db, "users", userData.docId), { photoURL: compressedBase64 });
          showModal("Update Berhasil", "Foto profil identitas kamu telah diperbarui.", "success");
        } catch (error) {
          showModal("Upload Gagal", "Gagal menyimpan foto.", "danger");
        } finally { setUploading(false); }
      };
    };
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", userData.docId), formData);
      showModal("Update Berhasil", "Data profil telah disinkronisasi ke pusat database.", "success");
      setIsEditing(false);
    } catch (error) { 
      showModal("Update Gagal", "Pastikan koneksi internet stabil.", "danger");
    }
  };

  const handleSertifikatChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setSertifikatBase64(canvas.toDataURL("image/jpeg", 0.7));
      };
    };
  };

  const handleApplyRank = async (e) => {
    e.preventDefault();
    if (!targetTingkat || !sertifikatBase64) return showModal("Gagal", "Lengkapi data.", "danger");
    setUploading(true);
    try {
      await addDoc(collection(db, "pengajuan_tingkat"), {
        uid: userData.uid,
        nama: userData.nama,
        tingkat_asal: userData.tingkat || "Belum ada tingkatan",
        tingkat_tujuan: targetTingkat,
        bukti_url: sertifikatBase64,
        status: "pending",
        isSeen: false, 
        createdAt: serverTimestamp(),
      });
      showModal("Terkirim", "Pengajuan sedang diverifikasi Pembina.", "success");
      setShowApplyModal(false);
    } catch (e) { showModal("Gagal", "Kesalahan sistem.", "danger"); }
    finally { setUploading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="text-center font-black text-red-600 animate-pulse uppercase text-xs tracking-widest">Syncing Identity...</div>
    </div>
  );

  return (
    <motion.div initial="initial" animate="animate" variants={pageTransition} className="min-h-screen bg-[#020617] flex justify-center pb-24 text-slate-100 font-sans selection:bg-red-800 italic">
      <div className="w-full max-w-md bg-[#020617] min-h-screen shadow-2xl flex flex-col relative overflow-x-hidden border-x border-white/5">
        
        {/* HEADER & AVATAR SECTION */}
        <div className="bg-gradient-to-br from-[#7f1d1d] via-[#450a0a] to-[#020617] pt-12 pb-24 px-8 rounded-b-[4rem] relative overflow-hidden shadow-3xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10 mb-10">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 active:scale-90 transition">
              <MdChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
                <MdOutlineFingerprint size={20} className="text-red-500 mb-1" />
                <h1 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-50">Profil Pribadi</h1>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className={`p-2.5 rounded-xl transition-all ${isEditing ? "bg-red-500 shadow-lg" : "bg-white/5 border border-white/10"}`}>
              {isEditing ? <MdClose size={18} /> : <MdEdit size={18} />}
            </button>
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="relative">
              <label className="cursor-pointer block relative z-10 group">
                <div className="w-32 h-32 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-[3.5rem] border-4 border-white/10 shadow-3xl flex items-center justify-center text-4xl font-black uppercase overflow-hidden transition-transform duration-500 group-hover:scale-105">
                  {userData?.photoURL ? <img src={userData.photoURL} alt="p" className="w-full h-full object-cover" /> : userData?.nama?.substring(0, 2) || "LB"}
                  {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"><div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-red-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#450a0a] group-hover:rotate-12 transition-all">
                  <MdPhotoCamera size={18} />
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <h2 className="mt-6 text-3xl font-black uppercase tracking-tighter italic leading-none text-center">{userData?.nama || "Anggota"}</h2>
            
            <p className="mt-2 text-red-500 text-[11px] font-black uppercase tracking-[0.2em] italic bg-red-500/10 px-4 py-1 rounded-full border border-red-500/20">
                {getDisplayTingkat()}
            </p>

            <div className="mt-4 bg-emerald-500/10 backdrop-blur-md px-5 py-2 rounded-full border border-emerald-500/20 flex items-center gap-2">
              <MdVerified size={16} className="text-emerald-500" />
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest leading-none italic">
                {userData?.role === 'admin' ? 'Administrator' : userData?.role === 'pembina' ? 'Pembina Laskar' : 'Anggota Aktif'}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="px-6 -mt-12 relative z-20 pb-10 flex-1">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onSubmit={handleUpdate} className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-3xl space-y-6">
                <div className="space-y-5 font-bold">
                  <div className="group">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em] group-focus-within:text-red-500 transition-colors">Nama Lengkap</label>
                    <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-1 font-bold text-white outline-none focus:border-red-600 transition-all uppercase" />
                  </div>
                  
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em] mb-2 block">Jenis Kelamin</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Putra", "Putri"].map((gender) => (
                        <button key={gender} type="button" onClick={() => setFormData({...formData, jenisKelamin: gender})} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.jenisKelamin === gender ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20" : "bg-white/5 border-white/5 text-slate-400"}`}>
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em]">Tempat Lahir</label>
                      <input type="text" value={formData.tempat_lahir} onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-1 font-bold text-white outline-none focus:border-red-600 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em]">Tgl Lahir</label>
                      <input type="date" value={formData.tanggal_lahir} onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-1 font-bold text-white outline-none focus:border-red-600 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em]">Agama</label>
                    <select value={formData.agama} onChange={(e) => setFormData({ ...formData, agama: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-1 font-bold text-white outline-none focus:border-red-600 transition-all">
                      <option className="bg-slate-900" value="">Pilih Agama</option>
                      {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"].map(a => <option key={a} className="bg-slate-900" value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-[0.2em]">WhatsApp</label>
                    <input type="text" value={formData.telepon} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-1 font-bold text-white outline-none focus:border-red-600 transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-900 text-white font-black py-5 rounded-2xl shadow-2xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] italic">Update Identity</button>
              </motion.form>
            ) : (
              <motion.div key="view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 font-bold">
                
                {/* DATA CARD */}
                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-3xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Official Data</h3>
                    {pendingRequest ? (
                      <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse uppercase">Sync Pending</span>
                    ) : (
                      <button onClick={() => setShowApplyModal(true)} className="text-[8px] font-black text-white bg-red-600 px-4 py-1.5 rounded-full shadow-lg shadow-red-600/20 active:scale-90 transition-all uppercase tracking-widest">Apply Rank</button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {[
                      { 
                        icon: <MdSchool />, 
                        label: "Tingkatan SKU", 
                        val: (!userData?.tingkat || userData.tingkat === "" || userData.tingkat === "BELUM ADA TINGKATAN") ? "Belum Ada Tingkatan" : userData.tingkat, 
                        color: "text-red-500" 
                      },
                      { icon: <MdWc />, label: "Jenis Kelamin", val: userData?.jenisKelamin || "-", color: "text-blue-400" },
                      { icon: <MdEvent />, label: "Tempat, Tgl Lahir", val: userData?.tempat_lahir ? `${userData.tempat_lahir}, ${userData.tanggal_lahir}` : "-", color: "text-slate-400" },
                      { icon: <MdPublic />, label: "Agama", val: userData?.agama || "-", color: "text-slate-400" },
                      { icon: <MdPhone />, label: "WhatsApp", val: userData?.telepon || "-", color: "text-slate-400" },
                      { icon: <MdPlace />, label: "Alamat", val: userData?.alamat || "-", color: "text-slate-400" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-5">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/5 shadow-inner">{item.icon}</div>
                        <div>
                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
                          <p className={`text-[11px] font-black uppercase italic tracking-tight ${item.color}`}>{item.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* QUICK ACCESS QR CODE */}
                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-3xl relative overflow-hidden flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Quick Access Radar</h3>
                    <MdQrCodeScanner className="text-red-600 animate-pulse" size={20} />
                  </div>
                  
                  <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-red-900/20 border-4 border-white/10">
                    <QRCodeCanvas 
                      value={userData?.uid || "LASKARBAHARI"} 
                      size={140} 
                      level="H" 
                      includeMargin={false}
                      imageSettings={{
                        src: "/logo/logo.png",
                        height: 30,
                        width: 30,
                        excavate: true,
                      }}
                    />
                  </div>
                  
                  <p className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">
                    Authorized <span className="text-red-600">Commander</span> Identity
                  </p>
                </div>

                {/* ACHIEVEMENT VAULT (KUMPULAN PIAGAM) */}
                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-3xl relative overflow-hidden mt-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Achievement Vault</h3>
                    <MdMilitaryTech className="text-amber-500" size={20} />
                  </div>

                  <div className="space-y-4">
                    {userData?.certificates && userData.certificates.length > 0 ? (
                      userData.certificates.map((cert, idx) => (
                        <motion.div 
                          key={cert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer"
                          onClick={() => navigate(`/cetak-piagam/${cert.id}`, { state: { cert, userData } })}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg">
                              <MdVerified size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase italic tracking-tighter">{cert.stageName}</p>
                              <p className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Lvl {cert.levelReached} • {new Date(cert.dateAwarded).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-lg active:scale-90">
                            <MdQrCodeScanner size={16} />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-30">
                        <MdEmojiEvents size={40} className="mx-auto mb-2 text-slate-700" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Belum ada piagam yang terbuka.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MODAL PENGAJUAN NAIK TINGKAT */}
        <AnimatePresence>
          {showApplyModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-6 italic font-medium">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 w-full max-w-sm rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/10">
                <div className="bg-gradient-to-br from-red-600 to-red-900 p-12 text-center text-white relative">
                  <MdSchool size={40} className="mx-auto mb-4 opacity-30" />
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Level Up</h2>
                  <p className="text-[10px] opacity-60 font-bold uppercase mt-2 tracking-[0.2em]">Pengajuan Verifikasi</p>
                </div>
                <form onSubmit={handleApplyRank} className="p-10 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Target Tingkat</label>
                    <select value={targetTingkat} onChange={(e) => setTargetTingkat(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 font-black outline-none text-white italic" required>
                      <option className="bg-slate-900" value="">Pilih...</option>
                      <option className="bg-slate-900" value="RAMU">RAMU</option>
                      <option className="bg-slate-900" value="RAKIT">RAKIT</option>
                      <option className="bg-slate-900" value="TERAP">TERAP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Bukti Sertifikat</label>
                    <input type="file" accept="image/*" onChange={handleSertifikatChange} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] font-bold text-slate-400" required />
                  </div>
                  {sertifikatBase64 && <div className="w-full h-32 rounded-3xl overflow-hidden border-2 border-white/10 shadow-inner"><img src={sertifikatBase64} className="w-full h-full object-cover" alt="prev" /></div>}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 font-black text-slate-500 uppercase text-[10px] tracking-widest transition-colors hover:text-white">Cancel</button>
                    <button type="submit" disabled={uploading} className="flex-[2] bg-white text-[#020617] font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all tracking-[0.2em]">Submit Req</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="px-8 py-12 text-center border-t border-white/5 mt-auto bg-slate-950/50">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-loose italic">
            Developed by <span className="text-red-600 font-black">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>
      <style jsx>{`.shadow-3xl { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); } .scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </motion.div>
  );
}

export default Profile;