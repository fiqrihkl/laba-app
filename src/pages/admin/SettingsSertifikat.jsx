import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhotograph, 
  HiOutlineArrowsExpand, 
  HiOutlineSave, 
  HiOutlineCloudUpload,
  HiOutlineEye,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineQrcode,
  HiOutlineCalendar,
  HiOutlineHashtag,
  HiOutlineAdjustments
} from "react-icons/hi";

export default function SettingSertifikat() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTingkat, setActiveTingkat] = useState("RAMU");
  const [selectedElement, setSelectedElement] = useState("nama");
  const [modal, setModal] = useState({ show: false, success: true, message: "" });
  const containerRef = useRef(null);

  const elementKeys = ["nama", "nomor", "tanggal", "qrcode"];
  const fontOptions = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact"];

  const defaultFields = {
    nama: { x: 50, y: 50, fontSize: 32, color: "#000000", fontFamily: "Arial", fontWeight: "bold", fontStyle: "normal", textDecoration: "none" },
    nomor: { x: 50, y: 40, fontSize: 18, color: "#000000", fontFamily: "Arial", fontWeight: "bold", fontStyle: "normal", textDecoration: "none" },
    tanggal: { x: 50, y: 60, fontSize: 18, color: "#000000", fontFamily: "Arial", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", customDate: "" },
    qrcode: { x: 85, y: 85, fontSize: 80, color: "#000000" },
  };

  const initialSetup = {
    pattern: "{SURAT}.{NO}/GD-SMPN1BIAU/{TINGKAT}/{ROMAN_MONTH}/{YEAR}/MABIGUS",
    lastSuratNumber: "045", 
    lastNumber: 0, 
    templates: {
      RAMU: { url: "", fields: defaultFields },
      RAKIT: { url: "", fields: defaultFields },
      TERAP: { url: "", fields: defaultFields },
    }
  };

  useEffect(() => {
    const docRef = doc(db, "settings", "certificate_config");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.templates) data.templates = initialSetup.templates;
        setConfig(data);
      } else {
        setDoc(docRef, initialSetup);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const currentData = config?.templates?.[activeTingkat] || initialSetup.templates[activeTingkat];

  const getPreviewNomor = () => {
    if (!config) return "";
    const pattern = config.pattern || initialSetup.pattern;
    const suratNum = config.lastSuratNumber || "000";
    const lastNum = config.lastNumber || 0;
    const now = new Date();
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const nextFormatted = (lastNum + 1).toString().padStart(3, '0');
    
    return pattern
      .replace(/{SURAT}/g, suratNum)
      .replace(/{NO}/g, nextFormatted)
      .replace(/{TINGKAT}/g, activeTingkat)
      .replace(/{ROMAN_MONTH}/g, romanMonths[now.getMonth()])
      .replace(/{YEAR}/g, now.getFullYear());
  };

  const formatSelectedDate = (dateString) => {
    if (!dateString) return "08 FEBRUARI 2026";
    const d = new Date(dateString);
    return d.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  const handleDrag = (e, key) => {
    if (!containerRef.current || e.clientX === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    updateLocalFields(key, { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
  };

  const updateLocalFields = (key, newData) => {
    setConfig(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [activeTingkat]: {
          ...currentData,
          fields: { 
            ...currentData.fields, 
            [key]: { ...defaultFields[key], ...currentData.fields[key], ...newData } 
          }
        }
      }
    }));
  };

  const handleSuratChange = (val) => {
    setConfig(prev => ({
      ...prev,
      lastSuratNumber: val,
      lastNumber: val !== prev.lastSuratNumber ? 0 : prev.lastNumber
    }));
  };

  const resetCounterManual = () => {
    if (window.confirm("Reset nomor urut anggota kembali ke 1?")) {
      setConfig(prev => ({ ...prev, lastNumber: 0 }));
      showModal(true, "Nomor urut berhasil direset.");
    }
  };

  const handleUploadTemplate = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxWidth = 1920;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        if (compressedBase64.length * 0.75 > 950000) {
          showModal(false, "Gambar terlalu berat (Maks 1MB).");
          setUploading(false);
          return;
        }
        setConfig(prev => ({
          ...prev,
          templates: { ...prev.templates, [activeTingkat]: { ...currentData, url: compressedBase64 } }
        }));
        setUploading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "settings", "certificate_config"), config);
      showModal(true, `Konfigurasi ${activeTingkat} disimpan.`);
    } catch (e) {
      showModal(false, "Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FUNGSI RESET TOTAL (POSISI + GAMBAR) ---
  const handleResetLayout = () => {
    if (window.confirm(`PERINGATAN: Ini akan menghapus gambar template ${activeTingkat} dan mereset seluruh posisi elemen ke awal. Lanjutkan?`)) {
      setConfig(prev => ({
        ...prev,
        templates: { 
          ...prev.templates, 
          [activeTingkat]: { 
            url: "", // Menghapus gambar template
            fields: defaultFields // Mereset posisi ke default
          } 
        }
      }));
      showModal(true, `Konfigurasi ${activeTingkat} dikosongkan.`);
    }
  };

  const showModal = (success, message) => {
    setModal({ show: true, success, message });
    setTimeout(() => setModal(prev => ({ ...prev, show: false })), 3000);
  };

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-amber-500 font-black animate-pulse uppercase text-xs tracking-widest italic">Sinkronisasi Data Otoritas...</div>;

  return (
    <div className="min-h-screen bg-[#020617] p-6 italic font-sans text-slate-100 selection:bg-amber-600">
      <AnimatePresence>
        {modal.show && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-2xl flex items-center gap-3 shadow-2xl border ${modal.success ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 'bg-red-950/80 border-red-500 text-red-400'} backdrop-blur-md`}>
            {modal.success ? <HiOutlineCheckCircle size={24} /> : <HiOutlineXCircle size={24} />}
            <span className="text-xs font-black uppercase tracking-widest">{modal.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/pembina/admin-hub" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <HiOutlinePhotograph className="rotate-180 text-amber-500" />
          </Link>
          <div>
            <h2 className="text-2xl font-black uppercase text-amber-500 tracking-tighter leading-none italic">Otoritas Sertifikat</h2>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Gugus Depan SMP Negeri 1 Biau</p>
          </div>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {["RAMU", "RAKIT", "TERAP"].map((tkt) => (
            <button key={tkt} onClick={() => setActiveTingkat(tkt)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTingkat === tkt ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>
              {tkt}
            </button>
          ))}
        </div>
      </div>

      {/* NOMOR & COUNTER AREA */}
      <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 mb-8 backdrop-blur-md shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
              <HiOutlineAdjustments className="text-amber-500" /> Format Penomoran
            </label>
            <input type="text" value={config?.pattern || ""} 
              onChange={(e) => setConfig(prev => ({ ...prev, pattern: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-[10px] font-mono font-bold text-amber-400 outline-none focus:border-amber-500 shadow-inner" 
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
              <HiOutlineDocumentText className="text-amber-500" /> No. Induk Surat
            </label>
            <input type="text" value={config?.lastSuratNumber || ""} onChange={(e) => handleSuratChange(e.target.value)}
              placeholder="Contoh: 123" className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-amber-500 shadow-inner" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 block ml-2 flex items-center gap-2">
              <HiOutlineHashtag className="text-amber-500" /> No. Urut Anggota
            </label>
            <div className="relative group">
              <input type="number" value={config?.lastNumber || 0} onChange={(e) => setConfig(prev => ({ ...prev, lastNumber: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none text-center shadow-inner focus:border-amber-500" />
              <button onClick={resetCounterManual} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-500 transition-colors" title="Reset urutan">
                <HiOutlineRefresh size={18} />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 block ml-2 flex items-center gap-2">
              <HiOutlineEye className="text-amber-500" /> Preview Format
            </label>
            <div className="bg-amber-600/10 border border-amber-600/20 p-4 rounded-2xl flex items-center gap-3">
              <HiOutlineCheckCircle className="text-amber-500 shrink-0" />
              <p className="text-[10px] font-mono font-bold text-amber-500 truncate italic tracking-tight">{getPreviewNomor()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CANVAS AREA */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10 shadow-inner">
            <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2 ml-2">
              <HiOutlineArrowsExpand className="animate-pulse" /> Atur Tata Letak Visual
            </span>
            <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 border border-white/10 transition-all">
              <HiOutlineCloudUpload size={16} className="text-amber-500" /> 
              {uploading ? "Sinking..." : "Upload Template HD"}
              <input type="file" className="hidden" onChange={handleUploadTemplate} accept="image/*" />
            </label>
          </div>

          <div ref={containerRef} onDragOver={(e) => e.preventDefault()}
            className="relative w-full aspect-[1.41/1] bg-black rounded-[2rem] overflow-hidden border-4 border-white/5 shadow-2xl group">
            {currentData.url ? (
              <>
                <img src={currentData.url} className="w-full h-full object-contain pointer-events-none opacity-90" alt="Template" />
                {elementKeys.map((key) => {
                  const field = currentData.fields[key] || defaultFields[key];
                  return (
                    <div key={key} draggable onDragEnd={(e) => handleDrag(e, key)} onClick={() => setSelectedElement(key)}
                      className={`absolute cursor-move select-none px-4 py-2 font-bold whitespace-nowrap transition-all border-2 ${selectedElement === key ? "border-amber-500 bg-amber-500/30 z-20 shadow-lg scale-105" : "border-dashed border-white/20 bg-black/40 z-10 opacity-70"}`}
                      style={{ 
                        left: `${field.x}%`, top: `${field.y}%`, transform: 'translate(-50%, -50%)', 
                        fontSize: `${field.fontSize}px`, color: field.color || "#000000", fontFamily: field.fontFamily || "Arial",
                        fontWeight: field.fontWeight || "bold", fontStyle: field.fontStyle || "normal",
                        textDecoration: field.textDecoration || "none", borderRadius: '4px',
                        ...(key === "qrcode" && { width: `${field.fontSize}px`, height: `${field.fontSize}px`, background: "white", display: "flex", alignItems: "center", justifyContent: "center" })
                      }}>
                      {key === "nama" ? "NAMA LENGKAP ANGGOTA" : key === "nomor" ? getPreviewNomor() : key === "tanggal" ? formatSelectedDate(field.customDate) : <HiOutlineQrcode size={field.fontSize * 0.7} />}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <HiOutlinePhotograph size={80} />
                <p className="text-[10px] font-black tracking-[0.5em] mt-4 uppercase">Canvas Kosong</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6 text-left">
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl backdrop-blur-sm border-b-4 border-b-amber-600/30">
            <h3 className="text-[10px] font-black uppercase text-amber-500 border-b border-white/5 pb-4 italic tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Properti: {selectedElement}
            </h3>

            <div className="space-y-4">
              {selectedElement === "tanggal" && (
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-slate-500 ml-2 flex items-center gap-2"><HiOutlineCalendar className="text-amber-500" /> Tanggal Pelantikan</label>
                  <input type="date" value={currentData.fields.tanggal.customDate || ""} 
                    onChange={(e) => updateLocalFields("tanggal", { customDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold text-amber-500 outline-none shadow-inner" />
                </div>
              )}

              {selectedElement !== "qrcode" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-slate-500 ml-2">Font Family</label>
                    <select value={currentData.fields[selectedElement]?.fontFamily || "Arial"} onChange={(e) => updateLocalFields(selectedElement, { fontFamily: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-[10px] font-bold text-white outline-none cursor-pointer">
                      {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-slate-500 ml-2 italic">Gaya Teks</label>
                    <div className="flex gap-2">
                      {[
                        { label: 'B', key: 'fontWeight', active: 'bold', normal: 'normal' },
                        { label: 'I', key: 'fontStyle', active: 'italic', normal: 'normal' },
                        { label: 'U', key: 'textDecoration', active: 'underline', normal: 'none' }
                      ].map((style) => (
                        <button key={style.label} onClick={() => updateLocalFields(selectedElement, { [style.key]: currentData.fields[selectedElement][style.key] === style.active ? style.normal : style.active })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${currentData.fields[selectedElement][style.key] === style.active ? "bg-amber-500 border-amber-500 text-black shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}>
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-500 block mb-1 ml-2">Sumbu X (%)</label>
                  <input type="number" step="0.1" value={currentData.fields[selectedElement].x} onChange={(e) => updateLocalFields(selectedElement, { x: parseFloat(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-black text-amber-500 outline-none" />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase text-slate-500 block mb-1 ml-2">Sumbu Y (%)</label>
                  <input type="number" step="0.1" value={currentData.fields[selectedElement].y} onChange={(e) => updateLocalFields(selectedElement, { y: parseFloat(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-black text-amber-500 outline-none" />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 ml-2">
                    <label>{selectedElement === "qrcode" ? "Dimensi QR" : "Ukuran Font"}</label>
                    <span className="text-amber-500">{currentData.fields[selectedElement].fontSize}px</span>
                  </div>
                  <input type="range" min="8" max="250" value={currentData.fields[selectedElement].fontSize} onChange={(e) => updateLocalFields(selectedElement, { fontSize: parseInt(e.target.value) })} className="w-full accent-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-slate-500 block ml-2 italic">Warna Output</label>
                  <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/10 shadow-inner">
                    <input type="color" value={currentData.fields[selectedElement].color} onChange={(e) => updateLocalFields(selectedElement, { color: e.target.value })} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{currentData.fields[selectedElement].color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={handleSave} disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-amber-900/40 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 border-b-4 border-amber-800">
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineSave size={18} />}
              {isSaving ? "MENYELARASKAN..." : "SIMPAN KONFIGURASI"}
            </button>
            <button onClick={handleResetLayout} className="w-full bg-white/5 hover:bg-red-950/20 text-slate-500 hover:text-red-500 py-4 rounded-[2rem] font-black uppercase text-[9px] tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2 active:scale-95">
              <HiOutlineRefresh size={16} /> RESET TOTAL (GAMBAR & POSISI)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}