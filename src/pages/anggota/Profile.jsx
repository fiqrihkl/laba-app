import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // UNTUK TRANSISI HALUS
import { useModal } from "../../context/ModalContext"; // IMPORT MODAL PREMIUM

// IMPORT REACT ICONS
import { 
  MdChevronLeft, 
  MdPhotoCamera, 
  MdDelete, 
  MdEdit, 
  MdPlace, 
  MdEvent, 
  MdPublic, 
  MdPhone, 
  MdSchool, 
  MdVerified,
  MdEmojiEvents,
  MdStar,
  MdPerson,
  MdWc,
  MdClose
} from "react-icons/md";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal(); // Gunakan Modal Premium

  // State untuk Status Pengajuan
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [targetTingkat, setTargetTingkat] = useState("");
  const [sertifikatBase64, setSertifikatBase64] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);

  // State untuk form edit profil dasar
  const [formData, setFormData] = useState({
    nama: "",
    telepon: "",
    alamat: "",
    agama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
  });

  // Animasi Variabel
  const pageTransition = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.4, ease: "easeOut" }
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
            jenis_kelamin: data.jenis_kelamin || "",
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
        if (!snapshot.empty) {
          setPendingRequest(snapshot.docs[0].data());
        } else {
          setPendingRequest(null);
        }
      });

      return () => {
        unsubscribeUser();
        unsubscribePending();
      };
    }
  }, []);

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
    if (!targetTingkat || !sertifikatBase64) {
      return showModal("Data Tidak Lengkap", "Silakan pilih tingkatan dan unggah bukti sertifikat.", "danger");
    }
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
      showModal("Pengajuan Terkirim", "Data sedang diproses untuk verifikasi oleh Pembina Laskar.", "success");
      setShowApplyModal(false);
      setSertifikatBase64("");
      setTargetTingkat("");
    } catch (error) {
      showModal("Gagal Mengirim", "Terjadi gangguan koneksi pada sistem.", "danger");
    } finally {
      setUploading(false);
    }
  };

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
          showModal("Upload Gagal", "Gagal menyimpan foto ke server.", "danger");
        } finally {
          setUploading(false);
        }
      };
    };
  };

  const handleDeletePhoto = async () => {
    showModal(
      "Hapus Foto?", 
      "Kamu akan menghapus foto profil saat ini. Lanjutkan?", 
      "danger", 
      async () => {
        try {
          await updateDoc(doc(db, "users", userData.docId), { photoURL: deleteField() });
          showModal("Terhapus", "Foto profil telah dikosongkan.", "success");
        } catch (error) { console.error(error); }
      }
    );
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-blue-900 animate-pulse uppercase text-xs tracking-widest">
        Syncing Identity...
      </div>
    </div>
  );

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium"
    >
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-slate-100">
        
        {/* HEADER PROFILE */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 pt-12 pb-24 px-8 rounded-b-[4.5rem] relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="flex justify-between items-center relative z-10 mb-8">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
              <MdChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase opacity-70">Identity Hub</h1>
            <button onClick={() => setIsEditing(!isEditing)} className={`p-2.5 rounded-xl transition-all ${isEditing ? "bg-red-500 shadow-lg" : "bg-blue-600 shadow-lg shadow-blue-500/30"}`}>
              {isEditing ? <MdClose size={18} className="text-white" /> : <MdEdit size={18} className="text-white" />}
            </button>
          </div>

          <div className="flex flex-col items-center relative z-10">
            <div className="relative group">
              {userData?.photoURL && (
                <button onClick={handleDeletePhoto} className="absolute -top-1 -left-1 z-20 bg-red-500 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-transform">
                  <MdDelete size={14} className="text-white" />
                </button>
              )}
              <label className="cursor-pointer block relative z-10">
                <div className="w-28 h-28 bg-gradient-to-tr from-blue-700 to-indigo-400 rounded-[3rem] border-4 border-white shadow-2xl flex items-center justify-center text-4xl font-black uppercase overflow-hidden transform group-hover:rotate-3 transition-transform">
                  {userData?.photoURL ? <img src={userData.photoURL} alt="p" className="w-full h-full object-cover" /> : userData?.nama?.substring(0, 2) || "LB"}
                  {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-all">
                  <MdPhotoCamera size={18} className="text-white" />
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <h2 className="mt-6 text-2xl font-black uppercase tracking-tighter italic leading-none text-center">{userData?.nama || "Anggota"}</h2>
            <div className="mt-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
              <MdVerified size={14} className="text-blue-300" />
              <p className="text-white text-[9px] font-black uppercase tracking-widest leading-none italic">
                {userData?.role === 'admin' ? 'Administrator' : userData?.role === 'pembina' ? 'Pembina Laskar' : 'Anggota Aktif'}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="px-6 -mt-12 relative z-20 pb-10 flex-1">
          {isEditing ? (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdate} 
              className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">Nama Lengkap</label>
                  <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">Tempat Lahir</label>
                    <input type="text" value={formData.tempat_lahir} onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">Tgl Lahir</label>
                    <input type="date" value={formData.tanggal_lahir} onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">Agama</label>
                  <select value={formData.agama} onChange={(e) => setFormData({ ...formData, agama: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner">
                    <option value="">Pilih Agama</option>
                    <option value="Islam">Islam</option><option value="Kristen">Kristen</option><option value="Katolik">Katolik</option><option value="Hindu">Hindu</option><option value="Buddha">Buddha</option><option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">WhatsApp</label>
                  <input type="text" value={formData.telepon} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">Alamat Domisili</label>
                  <textarea value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} rows="2" className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-inner"></textarea>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] italic">Simpan Perubahan</button>
            </motion.form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Official Identity</h3>
                  {pendingRequest ? (
                    <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 animate-pulse uppercase tracking-widest">Wait Verif</span>
                  ) : (
                    <button onClick={() => setShowApplyModal(true)} className="text-[8px] font-black text-white bg-orange-500 px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/20 active:scale-90 transition-all uppercase tracking-widest">AJUKAN NAIK</button>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner"><MdSchool size={20} /></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase italic tracking-widest">Tingkatan SKU</p><p className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{userData?.tingkat || "Laskar Muda"}</p></div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner"><MdWc size={20} /></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase italic tracking-widest">Jenis Kelamin</p><p className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{userData?.jenis_kelamin || "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner"><MdEvent size={20} /></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase italic tracking-widest">Tempat, Tgl Lahir</p><p className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{userData?.tempat_lahir ? `${userData.tempat_lahir}, ${userData.tanggal_lahir}` : "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner"><MdPublic size={20} /></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase italic tracking-widest">Agama</p><p className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{userData?.agama || "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner"><MdPhone size={20} /></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase italic tracking-widest">WhatsApp</p><p className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{userData?.telepon || "-"}</p></div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner"><MdPlace size={20} /></div>
                    <div><p className="text-[8px] text-slate-400 font-black uppercase italic tracking-widest">Alamat</p><p className="text-xs font-black text-slate-800 uppercase italic leading-tight tracking-tight">{userData?.alamat || "-"}</p></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 italic relative z-10">Achievements</h3>
                <div className="grid grid-cols-4 gap-4 relative z-10">
                  <div className={`flex flex-col items-center gap-2 ${userData?.points >= 1000 ? "opacity-100" : "opacity-20 grayscale"}`}>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200 text-amber-600 shadow-inner"><MdEmojiEvents size={24} /></div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Elite</p>
                  </div>
                  <div className={`flex flex-col items-center gap-2 ${userData?.points >= 500 ? "opacity-100" : "opacity-20 grayscale"}`}>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-200 text-blue-600 shadow-inner"><MdStar size={24} /></div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Veteran</p>
                  </div>
                  <div className={`flex flex-col items-center gap-2 ${userData?.photoURL ? "opacity-100" : "opacity-20 grayscale"}`}>
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center border border-green-200 text-green-600 shadow-inner"><MdPerson size={24} /></div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Verified</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* MODAL PENGAJUAN NAIK TINGKAT */}
        <AnimatePresence>
          {showApplyModal && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 italic font-medium">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
              >
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-10 text-center text-white relative">
                  <MdSchool size={40} className="mx-auto mb-4 opacity-50 text-white" />
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Pengajuan SKU</h2>
                  <p className="text-[9px] opacity-70 font-bold uppercase mt-2 tracking-[0.2em]">Level Up Verification</p>
                </div>
                <form onSubmit={handleApplyRank} className="p-8 space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Target Tingkatan</label>
                    <select value={targetTingkat} onChange={(e) => setTargetTingkat(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-2 font-black outline-none italic tracking-tight" required>
                      <option value="">Pilih...</option>
                      <option value="RAMU">RAMU</option>
                      <option value="RAKIT">RAKIT</option>
                      <option value="TERAP">TERAP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Bukti Sertifikat</label>
                    <input type="file" accept="image/*" onChange={handleSertifikatChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-2 text-[9px] font-bold" required />
                  </div>
                  {sertifikatBase64 && <div className="w-full h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner"><img src={sertifikatBase64} className="w-full h-full object-cover" alt="prev" /></div>}
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 font-black text-slate-300 uppercase text-[10px] tracking-widest transition-colors hover:text-red-500">Cancel</button>
                    <button type="submit" disabled={uploading} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all tracking-[0.2em] italic">Submit Req</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FOOTER IDENTITAS DEVELOPER */}
        <div className="px-8 py-10 text-center border-t border-slate-50 mt-auto bg-white">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">
            Dikembangkan oleh <span className="text-blue-600 font-black">Fiqri Haikal</span> — LABA APP v1.0<br />
            Level Up Your Scout Adventure!<br />
            © 2026 — Laskar Bahari SMPN 1 Biau
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default Profile;