import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image"; 
import { db, storage } from "../../firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { HiOutlineDownload, HiOutlineX, HiOutlinePencilAlt, HiOutlineCamera, HiOutlineInformationCircle } from "react-icons/hi";
import { QRCodeCanvas } from "qrcode.react";

export default function KTAView({ userData, onClose }) {
  const cardRef = useRef(null);
  const fileInputRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
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

  const downloadKTA = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        canvasWidth: 1011,
        canvasHeight: 638,
        pixelRatio: 4,
        cacheBust: true,
        quality: 1,
        style: { transform: 'scale(1)' }
      });
      const link = document.createElement("a");
      link.download = `KTA_LASKAR_${userData?.nama?.split(" ")[0].toUpperCase()}_FULL_HD.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Gagal download:", error);
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
      alert("Berhasil diperbarui!");
      onClose();
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[999] flex flex-col items-center p-4 md:p-8 overflow-y-auto italic">
      <div className="w-full max-w-7xl animate-in fade-in zoom-in duration-300 flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-center text-white border-b border-white/10 pb-6">
           <div className="leading-none">
              <h2 className="font-black uppercase text-2xl tracking-tighter italic">Digital ID Preview</h2>
              <div className="flex items-center gap-2 mt-2 text-blue-400">
                <HiOutlineInformationCircle className="animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Laskar Bahari System • High Definition Output</p>
              </div>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? 'bg-orange-500 shadow-orange-500/20' : 'bg-white/5 hover:bg-white/10'} border border-white/10`}
              >
                <HiOutlinePencilAlt size={24} />
              </button>
              <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500 rounded-2xl flex items-center justify-center transition-all border border-white/10">
                <HiOutlineX size={24} />
              </button>
           </div>
        </div>

        {/* Main Content Layout */}
        <div className={`flex flex-col ${isEditing ? 'lg:flex-row' : 'flex-col'} gap-8 items-start justify-center`}>
          
          {/* FORM EDIT SECTION */}
          {isEditing && (
            <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl animate-in slide-in-from-left duration-500 italic font-bold">
              <div className="flex items-center gap-3 mb-6 text-slate-800 border-b pb-4">
                <HiOutlinePencilAlt className="text-orange-500" size={20} />
                <h3 className="uppercase tracking-tighter text-lg">Modifikasi Data Anggota</h3>
              </div>
              
              <form onSubmit={handleUpdateData} className="space-y-4 text-[11px]">
                <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200 text-center hover:bg-slate-100 transition-all group">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-2 mx-auto text-blue-600">
                    <HiOutlineCamera size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black">UPLOAD PAS FOTO BARU</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 ml-2">NAMA LENGKAP</label>
                  <input type="text" className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 uppercase font-black" value={editForm.nama} onChange={(e) => setEditForm({...editForm, nama: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 ml-2">TEMPAT LAHIR</label>
                    <input type="text" className="w-full p-4 bg-slate-100 rounded-2xl border-none uppercase font-black" value={editForm.tempat_lahir} onChange={(e) => setEditForm({...editForm, tempat_lahir: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 ml-2">TGL LAHIR</label>
                    <input type="text" className="w-full p-4 bg-slate-100 rounded-2xl border-none font-black" value={editForm.tanggal_lahir} onChange={(e) => setEditForm({...editForm, tanggal_lahir: e.target.value})}/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 ml-2">AGAMA</label>
                    <input type="text" className="w-full p-4 bg-slate-100 rounded-2xl border-none uppercase font-black" value={editForm.agama} onChange={(e) => setEditForm({...editForm, agama: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 ml-2">JABATAN</label>
                    <input type="text" className="w-full p-4 bg-slate-100 rounded-2xl border-none uppercase font-black" value={editForm.jabatan} onChange={(e) => setEditForm({...editForm, jabatan: e.target.value})}/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">KWARRAN</label>
                    <input type="text" className="w-full p-3 bg-slate-100 rounded-xl border-none uppercase" value={editForm.kwarran} onChange={(e) => setEditForm({...editForm, kwarran: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">KWARCAB</label>
                    <input type="text" className="w-full p-3 bg-slate-100 rounded-xl border-none uppercase" value={editForm.kwarcab} onChange={(e) => setEditForm({...editForm, kwarcab: e.target.value})}/>
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="w-full bg-slate-950 text-white py-5 rounded-2xl mt-4 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all font-black uppercase tracking-widest">
                  {isSaving ? "Sinkronisasi..." : "Simpan Perubahan"}
                </button>
              </form>
            </div>
          )}

          {/* PREVIEW SECTION */}
          <div className="flex-1 w-full flex flex-col items-center">
            <div className="w-full bg-slate-900/50 rounded-[3rem] p-4 md:p-12 border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center min-h-[400px]">
              <div 
                ref={cardRef}
                className="relative bg-white shrink-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                style={{ 
                  width: "1011px",
                  height: "638px",
                  backgroundImage: `url(${config?.templateURL})`,
                  backgroundSize: "100% 100%",
                  transform: "scale(var(--preview-scale, 0.4))",
                  transformOrigin: "center center",
                }}
              >
                <style>{`
                  :root { --preview-scale: 0.28; }
                  @media (min-width: 500px) { :root { --preview-scale: 0.4; } }
                  @media (min-width: 640px) { :root { --preview-scale: 0.5; } }
                  @media (min-width: 1024px) { :root { --preview-scale: ${isEditing ? '0.55' : '0.85'}; } }
                  @media (min-width: 1280px) { :root { --preview-scale: ${isEditing ? '0.65' : '0.95'}; } }
                `}</style>

                {config?.elements && Object.keys(config.elements).map((key) => {
                  const el = config.elements[key];
                  if (!el) return null;
                  const isText = !["pasFoto", "qrcode"].includes(key);
                  const displayData = isEditing ? editForm : userData;

                  return (
                    <div key={key} className="absolute flex items-center leading-none font-bold italic"
                      style={{
                        left: `${el.x}%`, top: `${el.y}%`,
                        fontSize: isText ? `${el.fontSize}px` : undefined,
                        color: isText ? (el.color || "#000000") : "transparent",
                        width: key === "pasFoto" ? `${el.width}px` : key === "qrcode" ? `${el.size}px` : "auto", 
                        height: key === "pasFoto" ? `${el.height}px` : key === "qrcode" ? `${el.size}px` : "auto",
                        zIndex: isText ? 20 : 10,
                      }}
                    >
                      {isText ? (
                        <span>
                          {key === "nama" ? displayData?.nama?.toUpperCase() :
                           key === "nta" ? (displayData?.nta || "10.491.XXX.XXX") :
                           key === "ttl" ? `${displayData?.tempat_lahir}, ${displayData?.tanggal_lahir}` :
                           key === "jenis_kelamin" ? displayData?.jenis_kelamin?.toUpperCase() :
                           key === "agama" ? displayData?.agama?.toUpperCase() :
                           key === "jabatan" ? displayData?.jabatan?.toUpperCase() :
                           key === "kwarran" ? displayData?.kwarran?.toUpperCase() :
                           key === "kwarcab" ? displayData?.kwarcab?.toUpperCase() : ""}
                        </span>
                      ) : key === "pasFoto" ? (
                        <img src={isEditing ? photoPreview : userData?.ktaPhotoURL} crossOrigin="anonymous" className="w-full h-full object-cover rounded shadow-sm border-2 border-white" alt="profile" />
                      ) : (
                        <div className="bg-white p-1 rounded-lg flex items-center justify-center">
                          <QRCodeCanvas value={userData?.uid || "LASKARBAHARI"} size={el.size - 8} level="H" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DOWNLOAD BUTTON */}
            {!isEditing && (
              <div className="mt-8 w-full max-w-2xl px-4 animate-bounce-subtle">
                 <button 
                    onClick={downloadKTA}
                    disabled={isDownloading}
                    className={`w-full ${isDownloading ? 'bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'} text-white py-6 rounded-full font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all active:scale-95`}
                 >
                    <HiOutlineDownload size={24} /> 
                    {isDownloading ? "Generating HD Assets..." : "Export HD Member Card"}
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}