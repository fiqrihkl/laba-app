import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image"; 
import { db, storage } from "../../firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  HiOutlineDownload, 
  HiOutlineX, 
  HiOutlinePencilAlt, 
  HiOutlineCamera, 
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineRefresh
} from "react-icons/hi";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

export default function KTAView({ userData, onClose }) {
  const frontCardRef = useRef(null);
  const backCardRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // State Animasi Balik
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // State Fitur Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...userData });
  const [isSaving, setIsSaving] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(userData?.ktaPhotoURL);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "kta_config"));
        if (snap.exists()) {
          setConfig(snap.data());
        }
      } catch (error) {
        console.error("Gagal mengambil konfigurasi KTA:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPhotoPreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const downloadAction = async (side) => {
    const targetRef = side === 'front' ? frontCardRef : backCardRef;
    if (!targetRef.current || isDownloading) return;
    
    setIsDownloading(true);
    setShowDownloadMenu(false);
    
    try {
      const dataUrl = await htmlToImage.toPng(targetRef.current, {
        canvasWidth: 1011,
        canvasHeight: 638,
        pixelRatio: 4,
        cacheBust: true,
        quality: 1,
      });
      const link = document.createElement("a");
      link.download = `KTA_${side.toUpperCase()}_LASKAR_${userData?.nama?.split(" ")[0].toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      alert("Gagal mengunduh gambar.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpdateData = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", userData.uid);
      let updatedData = { ...editForm };
      if (newPhotoFile) {
        const photoRef = ref(storage, `kta_photos/${userData.uid}`);
        await uploadBytes(photoRef, newPhotoFile);
        updatedData.ktaPhotoURL = await getDownloadURL(photoRef);
      }
      await updateDoc(userRef, updatedData);
      alert("Data Identitas Berhasil Diperbarui!");
      onClose();
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-2xl z-[999] flex flex-col items-center p-4 md:p-8 overflow-y-auto italic custom-scroll pb-40">
      <div className="w-full max-w-7xl flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center text-white border-b border-white/10 pb-8 mt-4">
           <div className="leading-none">
              <div className="flex items-center gap-2 mb-2 text-red-500">
                <HiOutlineShieldCheck className="animate-pulse" />
                <span className="font-black uppercase text-[10px] tracking-[0.3em]">Credentials Hub</span>
              </div>
              <h2 className="font-black uppercase text-3xl tracking-tighter italic">KARTU <span className="text-slate-500">TANDA ANGGOTA</span></h2>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? 'bg-red-600 shadow-lg' : 'bg-white/5 hover:bg-white/10'} border border-white/10 text-white`}
              >
                <HiOutlinePencilAlt size={22} />
              </button>
              <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500 rounded-2xl flex items-center justify-center transition-all border border-white/10 text-white group">
                <HiOutlineX size={22} className="group-hover:rotate-90 transition-transform" />
              </button>
           </div>
        </div>

        {/* Main Layout */}
        <div className={`flex flex-col ${isEditing ? 'lg:flex-row' : 'items-center'} gap-12`}>
          
          {/* FORM EDIT PANEL */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full lg:w-[450px] shrink-0 bg-slate-900/60 border border-white/10 rounded-[3rem] p-8 shadow-3xl backdrop-blur-3xl"
              >
                <form onSubmit={handleUpdateData} className="space-y-5 text-[11px] font-black">
                  <div className="bg-white/5 p-6 rounded-3xl border-2 border-dashed border-white/10 text-center hover:border-red-500/40 transition-all group">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-2 mx-auto text-red-500">
                      <HiOutlineCamera size={36} className="group-hover:scale-110 transition-transform" />
                      <span className="tracking-widest uppercase">UPDATE PAS FOTO</span>
                    </button>
                  </div>
                  {/* Inputs */}
                  <div className="space-y-2">
                    <label className="text-slate-500 ml-2 uppercase tracking-widest">Nama Lengkap</label>
                    <input type="text" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 transition-all uppercase" value={editForm.nama} onChange={(e) => setEditForm({...editForm, nama: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-500 ml-2 uppercase tracking-widest">Kota Lahir</label>
                      <input type="text" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600" value={editForm.tempat_lahir} onChange={(e) => setEditForm({...editForm, tempat_lahir: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-500 ml-2 uppercase tracking-widest">Tgl Lahir</label>
                      <input type="text" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600" value={editForm.tanggal_lahir} onChange={(e) => setEditForm({...editForm, tanggal_lahir: e.target.value})}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-500 ml-2 uppercase tracking-widest">Agama</label>
                      <input type="text" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600" value={editForm.agama} onChange={(e) => setEditForm({...editForm, agama: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-500 ml-2 uppercase tracking-widest">Gender</label>
                      <select className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-white outline-none focus:border-red-600" value={editForm.jenis_kelamin} onChange={(e) => setEditForm({...editForm, jenis_kelamin: e.target.value})}>
                        <option value="Laki-laki">LAKI-LAKI</option>
                        <option value="Perempuan">PEREMPUAN</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 ml-2 uppercase tracking-widest">Jabatan</label>
                    <input type="text" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600" value={editForm.jabatan} onChange={(e) => setEditForm({...editForm, jabatan: e.target.value})}/>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-5 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all font-black uppercase tracking-widest">
                    {isSaving ? "Sinkronisasi..." : "SIMPAN PERUBAHAN"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D INTERACTIVE CARD SECTION */}
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="perspective-container relative w-full flex items-center justify-center py-20 min-h-[500px]">
              
              <motion.div 
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-[1011px] h-[638px] shrink-0"
              >
                {/* --- SISI DEPAN --- */}
                <div 
                  ref={frontCardRef}
                  className="absolute inset-0 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm backface-hidden"
                  style={{ 
                    width: "1011px", height: "638px",
                    backgroundImage: `url(${config?.templateURL})`,
                    backgroundSize: "100% 100%",
                    transform: "scale(var(--kta-scale, 0.4))",
                    transformOrigin: "center center",
                  }}
                >
                  <style>{`
                    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                    :root { --kta-scale: 0.3; }
                    @media (min-width: 500px) { :root { --kta-scale: 0.45; } }
                    @media (min-width: 1024px) { :root { --kta-scale: ${isEditing ? '0.62' : '0.8'}; } }
                    @media (min-width: 1280px) { :root { --kta-scale: ${isEditing ? '0.68' : '0.9'}; } }
                  `}</style>

                  {config?.elements && Object.keys(config.elements).map((key) => {
                    const el = config.elements[key];
                    const isText = !["pasFoto", "qrcode"].includes(key);
                    const displayData = isEditing ? editForm : userData;
                    return (
                      <div key={key} className="absolute flex items-center leading-none font-black italic tracking-tighter uppercase"
                        style={{ left: `${el.x}%`, top: `${el.y}%`, fontSize: isText ? `${el.fontSize}px` : undefined, color: isText ? (el.color || "#000000") : "transparent", width: key === "pasFoto" ? `${el.width}px` : key === "qrcode" ? `${el.size}px` : "auto", height: key === "pasFoto" ? `${el.height}px` : key === "qrcode" ? `${el.size}px` : "auto", zIndex: 20 }}>
                        {isText ? (
                          <span>
                            {key === "nama" ? displayData?.nama :
                             key === "nta" ? (displayData?.nta || "10.491.XXX") :
                             key === "ttl" ? `${displayData?.tempat_lahir}, ${displayData?.tanggal_lahir}` :
                             key === "jenis_kelamin" ? displayData?.jenis_kelamin :
                             key === "agama" ? displayData?.agama :
                             key === "jabatan" ? displayData?.jabatan :
                             key === "kwarran" ? displayData?.kwarran :
                             key === "kwarcab" ? displayData?.kwarcab : 
                             key === "tingkatan" ? displayData?.tingkat : ""}
                          </span>
                        ) : key === "pasFoto" ? (
                          <div className="w-full h-full border-[3px] border-white shadow-lg overflow-hidden bg-slate-100">
                             <img src={isEditing ? photoPreview : userData?.ktaPhotoURL} crossOrigin="anonymous" className="w-full h-full object-cover" alt="p" />
                          </div>
                        ) : (
                          <div className="bg-white p-1 rounded-xl shadow-lg border border-black/5">
                            <QRCodeCanvas value={userData?.uid || "LASKAR"} size={el.size - 8} level="H" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* --- SISI BELAKANG --- */}
                <div 
                  ref={backCardRef}
                  className="absolute inset-0 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm backface-hidden"
                  style={{ 
                    width: "1011px", height: "638px",
                    backgroundImage: `url(${config?.backTemplateURL})`,
                    backgroundSize: "100% 100%",
                    transform: "scale(var(--kta-scale, 0.4)) rotateY(180deg)",
                    transformOrigin: "center center",
                  }}
                >
                  {/* Bagian belakang statis hanya gambar template */}
                </div>
              </motion.div>
            </div>

            {/* BUTTON CONTROLS */}
            <div className="flex flex-col items-center gap-8 mt-10 w-full max-w-xl">
              
              {/* Balik Kartu Button */}
              <button 
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full text-white transition-all group"
              >
                <HiOutlineRefresh className={`text-red-500 transition-transform duration-700 ${isFlipped ? 'rotate-180' : ''}`} size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">LIHAT SISI {isFlipped ? 'DEPAN' : 'BELAKANG'}</span>
              </button>

              {/* Download Menu */}
              <div className="relative w-full">
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isDownloading}
                  className="w-full bg-white text-[#020617] py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 shadow-3xl active:scale-95 transition-all"
                >
                  <HiOutlineDownload size={24} /> 
                  {isDownloading ? "EXTRACTING..." : "EXPORT HD MEMBER CARD"}
                </button>

                <AnimatePresence>
                  {showDownloadMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-4 w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden p-2 shadow-2xl z-[1002]"
                    >
                      <button onClick={() => downloadAction('front')} className="w-full p-4 hover:bg-white/5 rounded-2xl flex items-center justify-between text-white transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest ml-4">Sisi Depan (Identitas)</span>
                        <HiOutlineDownload className="text-red-500" />
                      </button>
                      <div className="h-[1px] bg-white/5 mx-4" />
                      <button onClick={() => downloadAction('back')} className="w-full p-4 hover:bg-white/5 rounded-2xl flex items-center justify-between text-white transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest ml-4">Sisi Belakang (Aturan)</span>
                        <HiOutlineDownload className="text-red-500" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 text-slate-500">
                <HiOutlineInformationCircle size={18} />
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">High Resolution 4044x2552px • 300DPI</p>
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