import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image"; 
import { db, storage } from "../../firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  HiOutlineDownload, 
  HiOutlineX, 
  HiOutlinePencilAlt, 
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineExclamationCircle
} from "react-icons/hi";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import EditKTA from "./EditKTA";

export default function KTAView({ userData, onClose }) {
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);
  
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); 
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...userData });
  const [isSaving, setIsSaving] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(userData?.ktaPhotoURL);

  // State untuk Premium Modal Alert
  const [alertConfig, setAlertConfig] = useState({ show: false, message: "", type: "warning" });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "kta_config"));
        if (snap.exists()) setConfig(snap.data());
      } catch (error) {
        console.error("Gagal mengambil konfigurasi KTA:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const triggerAlert = (msg, type = "warning") => {
    setAlertConfig({ show: true, message: msg, type });
  };

  const checkDataCompleteness = () => {
    const requiredFields = [
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'nta', label: 'NTA' },
      { key: 'tempat_lahir', label: 'Tempat Lahir' },
      { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
      { key: 'agama', label: 'Agama' },
      { key: 'jabatan', label: 'Jabatan' },
      { key: 'ktaPhotoURL', label: 'Pas Foto' }
    ];

    const missing = requiredFields.find(field => !userData[field.key] || userData[field.key] === "");
    return missing ? missing.label : null;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const downloadAction = async (side) => {
    const missingLabel = checkDataCompleteness();
    if (missingLabel) {
      triggerAlert(`Akses Ditolak! Data "${missingLabel}" belum lengkap. Mohon lengkapi identitas Anda.`, "warning");
      setShowDownloadMenu(false);
      return;
    }

    const targetRef = side === 'front' ? frontCardRef : backCardRef;
    if (!targetRef.current || isDownloading) return;

    setIsDownloading(true);
    setShowDownloadMenu(false);

    try {
      const dataUrl = await htmlToImage.toPng(targetRef.current, {
        canvasWidth: 1011,
        canvasHeight: 638,
        pixelRatio: 3,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `KTA_${side.toUpperCase()}_LASKAR_${userData?.nama?.split(" ")[0].toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      triggerAlert("Gagal memproses gambar. Pastikan browser mendukung ekspor data.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpdateData = async (e) => {
  e.preventDefault();
  if (isSaving) return;

  setIsSaving(true);
  try {
    const targetId = userData.docId || userData.id || userData.uid;
    if (!targetId) throw new Error("ID Dokumen tidak valid.");

    const userRef = doc(db, "users", targetId);
    
    // Siapkan data teks dari form (Tingkat, Kwarran, Kwarcab, dll)
    let updatedData = {
      nama: editForm.nama || "",
      tempat_lahir: editForm.tempat_lahir || "",
      tanggal_lahir: editForm.tanggal_lahir || "",
      agama: editForm.agama || "",
      jabatan: editForm.jabatan || "",
      tingkat: editForm.tingkat || "",
      kwarran: editForm.kwarran || "",
      kwarcab: editForm.kwarcab || "",
    };

    // LOGIKA BASE64 (Sama seperti di Profile.jsx)
    if (newPhotoFile) {
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(newPhotoFile);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Kita gunakan lebar 400px agar string Base64 tidak terlalu panjang (Hemat space Firestore)
            const MAX_WIDTH = 400; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Konversi ke Base64 string dengan kualitas 0.7
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error("Gagal memproses gambar."));
        };
        reader.onerror = (error) => reject(error);
      });

      // Simpan string Base64 ke field ktaPhotoURL di Firestore
      updatedData.ktaPhotoURL = base64String;
    }

    // Eksekusi update langsung ke Firestore Database
    await updateDoc(userRef, updatedData);
    
    setIsEditing(false);
    triggerAlert("Identitas & Foto Berhasil Diperbarui!", "success");
    
  } catch (error) {
    console.error("Error Detail:", error);
    triggerAlert("Gagal menyimpan: " + error.message, "error");
  } finally {
    // SANGAT PENTING: Mematikan status loading agar tidak stuck
    setIsSaving(false);
  }
};

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-2xl z-[999] flex flex-col items-center p-4 md:p-8 overflow-y-auto italic custom-scroll">
      
      {/* PREMIUM MODAL ALERT SYSTEM */}
      <AnimatePresence>
        {alertConfig.show && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAlertConfig({ ...alertConfig, show: false })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative z-10 text-center"
            >
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border shadow-2xl ${
                alertConfig.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
              }`}>
                <HiOutlineExclamationCircle size={40} className={alertConfig.type === 'success' ? '' : 'animate-pulse'} />
              </div>
              <h3 className="text-white font-black uppercase text-xl italic tracking-tighter mb-4">
                {alertConfig.type === 'success' ? 'Berhasil!' : 'Perhatian!'}
              </h3>
              <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest leading-relaxed mb-8">
                {alertConfig.message}
              </p>
              <button onClick={() => setAlertConfig({ ...alertConfig, show: false })} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-7xl flex flex-col gap-8 pb-32">
        
        {/* Header Section */}
        <div className="flex justify-between items-center text-white border-b border-white/10 pb-8 mt-4">
           <div className="leading-none italic">
              <div className="flex items-center gap-2 mb-2 text-red-500">
                <HiOutlineShieldCheck className="animate-pulse" />
                <span className="font-black uppercase text-[10px] tracking-[0.3em]">Credentials Hub</span>
              </div>
              <h2 className="font-black uppercase text-3xl tracking-tighter italic">KARTU <span className="text-slate-500">TANDA ANGGOTA</span></h2>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setIsEditing(!isEditing)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? 'bg-red-600 shadow-lg' : 'bg-white/5 hover:bg-white/10'} border border-white/10 text-white`}>
                <HiOutlinePencilAlt size={22} />
              </button>
              <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500 rounded-2xl flex items-center justify-center transition-all border border-white/10 text-white group">
                <HiOutlineX size={22} className="group-hover:rotate-90 transition-transform" />
              </button>
           </div>
        </div>

        <div className={`flex flex-col ${isEditing ? 'lg:flex-row' : 'items-center'} gap-12`}>
          
          <AnimatePresence>
            {isEditing && (
              <EditKTA 
                editForm={editForm} setEditForm={setEditForm}
                onPhotoChange={handlePhotoChange} photoPreview={photoPreview}
                isSaving={isSaving} onSubmit={handleUpdateData}
              />
            )}
          </AnimatePresence>

          <div className="flex-1 w-full flex flex-col items-center relative">
            <div className="perspective-container relative w-full flex items-center justify-center py-10 min-h-[400px] lg:min-h-[600px]">
              <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8, type: "spring", stiffness: 60 }} style={{ transformStyle: "preserve-3d" }} className="relative w-[1011px] h-[638px] shrink-0">
                
                {/* --- SISI DEPAN --- */}
                <div ref={frontCardRef} className="absolute inset-0 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm backface-hidden"
                  style={{ width: "1011px", height: "638px", backgroundImage: `url(${config?.templateURL})`, backgroundSize: "100% 100%", transform: "scale(var(--kta-scale, 0.4))", transformOrigin: "center center" }}>
                  <style>{`
                    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                    :root { --kta-scale: 0.3; }
                    @media (min-width: 500px) { :root { --kta-scale: 0.45; } }
                    @media (min-width: 1024px) { :root { --kta-scale: ${isEditing ? '0.62' : '0.8'}; } }
                    @media (min-width: 1280px) { :root { --kta-scale: ${isEditing ? '0.68' : '0.9'}; } }
                    .kta-text { font-family: 'Arial', sans-serif; font-weight: 600; font-style: normal; text-transform: uppercase; }
                  `}</style>

                  {config?.elements && Object.keys(config.elements).map((key) => {
                    const el = config.elements[key];
                    const isText = !["pasFoto", "qrcode"].includes(key);
                    const displayData = isEditing ? editForm : userData;
                    return (
                      <div key={key} className="absolute flex items-center leading-none kta-text"
                        style={{ left: `${el.x}%`, top: `${el.y}%`, fontSize: isText ? `${el.fontSize}px` : undefined, color: isText ? (el.color || "#000000") : "transparent", width: key === "pasFoto" ? `${el.width}px` : key === "qrcode" ? `${el.size}px` : "auto", height: key === "pasFoto" ? `${el.height}px` : key === "qrcode" ? `${el.size}px` : "auto", zIndex: 20 }}>
                        {isText ? (
                          <span>
                            {key === "nama" ? displayData?.nama :
                             key === "nta" ? (displayData?.nta || "10.491.XXX") :
                             key === "ttl" ? `${displayData?.tempat_lahir}, ${displayData?.tanggal_lahir}` :
                             key === "jenis_kelamin" ? displayData?.jenisKelamin :
                             key === "agama" ? displayData?.agama :
                             key === "jabatan" ? displayData?.jabatan :
                             key === "kwarran" ? displayData?.kwarran :
                             key === "kwarcab" ? displayData?.kwarcab : 
                             key === "tingkatan" ? (displayData?.tingkat || "PENGGALANG") : ""}
                          </span>
                        ) : key === "pasFoto" ? (
                          <div className="w-full h-full border-[2px] border-white shadow-md overflow-hidden bg-slate-100">
                             <img src={isEditing ? photoPreview : userData?.ktaPhotoURL} crossOrigin="anonymous" className="w-full h-full object-cover" alt="p" />
                          </div>
                        ) : (
                          <div className="bg-white p-1 rounded-sm shadow-md">
                            <QRCodeCanvas value={userData?.uid || "LASKAR"} size={el.size - 8} level="H" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* --- SISI BELAKANG --- */}
                <div ref={backCardRef} className="absolute inset-0 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm backface-hidden"
                  style={{ width: "1011px", height: "638px", backgroundImage: `url(${config?.backTemplateURL})`, backgroundSize: "100% 100%", transform: "scale(var(--kta-scale, 0.4)) rotateY(180deg)", transformOrigin: "center center" }}
                />
              </motion.div>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col items-center gap-6 mt-10 w-full max-w-xl relative z-[1001] italic">
              <button onClick={() => setIsFlipped(!isFlipped)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full text-white transition-all group active:scale-90 font-bold">
                <HiOutlineRefresh className={`text-red-500 transition-transform duration-700 ${isFlipped ? 'rotate-180' : ''}`} size={20} />
                <span className="text-[10px] uppercase tracking-[0.2em]">LIHAT SISI {isFlipped ? 'DEPAN' : 'BELAKANG'}</span>
              </button>

              <div className="relative w-full">
                <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} disabled={isDownloading} className="w-full bg-white text-[#020617] py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-3xl active:scale-95 transition-all">
                  <HiOutlineDownload size={24} /> 
                  {isDownloading ? "MEMPROSES..." : "UNDUH KARTU ANGGOTA"}
                </button>

                <AnimatePresence>
                  {showDownloadMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-4 w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden p-2 shadow-2xl z-[1010]">
                      <button onClick={() => downloadAction('front')} className="w-full p-4 hover:bg-white/5 rounded-2xl flex items-center justify-between text-white transition-all font-bold text-[10px] uppercase tracking-widest px-6">
                        <span>Sisi Depan (Identitas)</span> <HiOutlineDownload className="text-red-500" />
                      </button>
                      <div className="h-[1px] bg-white/5 mx-4" />
                      <button onClick={() => downloadAction('back')} className="w-full p-4 hover:bg-white/5 rounded-2xl flex items-center justify-between text-white transition-all font-bold text-[10px] uppercase tracking-widest px-6">
                        <span>Sisi Belakang (Aturan)</span> <HiOutlineDownload className="text-red-500" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 text-slate-500 mb-6 font-bold">
                <HiOutlineInformationCircle size={18} />
                <p className="text-[9px] uppercase tracking-[0.2em]">HD Member Card • High Quality PNG</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .perspective-container { perspective: 2000px; }
        .shadow-3xl { box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7); }
      `}</style>
    </div>
  );
}