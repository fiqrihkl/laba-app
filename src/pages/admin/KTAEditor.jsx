import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function KTAEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedElement, setSelectedElement] = useState("nama");
  const containerRef = useRef(null);

  const elementKeys = [
    "nama",
    "nta",
    "ttl",
    "jenis_kelamin",
    "agama",
    "jabatan",
    "tingkatan", // PENAMBAHAN DATA TINGKATAN
    "kwarran",
    "kwarcab",
    "pasFoto",
    "qrcode",
  ];

  const defaultConfig = {
    templateURL: "",
    backTemplateURL: "", // PENAMBAHAN TEMPLATE BELAKANG
    elements: {
      nama: { x: 30, y: 25, fontSize: 16, color: "#000000" },
      nta: { x: 30, y: 32, fontSize: 14, color: "#000000" },
      ttl: { x: 30, y: 39, fontSize: 12, color: "#000000" },
      jenis_kelamin: { x: 30, y: 43, fontSize: 12, color: "#000000" },
      agama: { x: 30, y: 46, fontSize: 12, color: "#000000" },
      jabatan: { x: 30, y: 53, fontSize: 12, color: "#000000" },
      tingkatan: { x: 30, y: 57, fontSize: 12, color: "#000000" }, // POSISI DEFAULT TINGKATAN
      kwarran: { x: 30, y: 60, fontSize: 12, color: "#000000" },
      kwarcab: { x: 30, y: 67, fontSize: 12, color: "#000000" },
      pasFoto: { x: 10, y: 20, width: 80, height: 110 },
      qrcode: { x: 10, y: 65, size: 70 },
    },
  };

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "kta_config"),
      (snap) => {
        if (snap.exists() && snap.data().elements) {
          setConfig(snap.data());
        } else {
          setDoc(doc(db, "settings", "kta_config"), defaultConfig);
          setConfig(defaultConfig);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleDrag = (e, key) => {
    if (!containerRef.current || e.clientX === 0 || !config) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    updateConfig(key, {
      x: parseFloat(x.toFixed(1)),
      y: parseFloat(y.toFixed(1)),
    });
  };

  const updateConfig = (key, newData) => {
    if (!config) return;
    setConfig((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [key]: { ...prev.elements[key], ...newData },
      },
    }));
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      await updateDoc(doc(db, "settings", "kta_config"), config);
      alert("🎉 Layout KTA Berhasil Disimpan!");
    } catch (error) {
      alert("Gagal menyimpan layout.");
    }
  };

  const handleReset = async () => {
    if (window.confirm("⚠️ Apakah Anda yakin ingin reset layout?")) {
      try {
        await updateDoc(doc(db, "settings", "kta_config"), defaultConfig);
        setConfig(defaultConfig);
        alert("Layout Berhasil Di-reset!");
      } catch (error) {
        alert("Gagal melakukan reset.");
      }
    }
  };

  const handleTemplateUpload = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (side === "front") {
        setConfig((prev) => ({ ...prev, templateURL: reader.result }));
      } else {
        setConfig((prev) => ({ ...prev, backTemplateURL: reader.result }));
      }
      setUploading(false);
    };
  };

  if (loading || !config || !config.elements) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 italic font-black text-blue-900 animate-pulse text-xs uppercase tracking-widest">
        Menghubungkan ke Database KTA...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row italic overflow-hidden">
      <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center overflow-y-auto">
        <div className="mb-6 flex justify-between w-full max-w-4xl items-center px-4">
          <Link to="/admin" className="text-[10px] font-black uppercase bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
            Kembali
          </Link>
          <h1 className="font-black uppercase tracking-[0.2em] text-blue-900 text-sm text-center">
            KTA Designer Hub
          </h1>
          <button onClick={handleReset} className="text-[10px] font-black uppercase bg-red-50 text-red-500 px-5 py-3 rounded-2xl shadow-sm border border-red-100 active:scale-95 transition-all">
            Reset
          </button>
        </div>

        {/* --- PREVIEW BAGIAN DEPAN --- */}
        <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">Preview Bagian Depan (Draggable)</p>
        <div className="w-full flex justify-center items-center py-10 bg-slate-200/50 rounded-[3rem] shadow-inner overflow-hidden mb-10">
          <div
            ref={containerRef}
            onDragOver={(e) => e.preventDefault()}
            className="relative bg-white shadow-2xl shrink-0"
            style={{
              width: "1011px",
              height: "638px",
              backgroundImage: `url(${config.templateURL || "https://via.placeholder.com/1011x638?text=Upload+Depan+KTA"})`,
              backgroundSize: "100% 100%",
              transform: "scale(var(--editor-scale, 0.5))",
              transformOrigin: "center center",
            }}
          >
            <style>{`
              :root { --editor-scale: 0.35; }
              @media (min-width: 768px) { --editor-scale: 0.45; }
              @media (min-width: 1280px) { --editor-scale: 0.55; }
            `}</style>

            {elementKeys.map((key) => {
              const el = config.elements[key];
              if (!el) return null;

              const isText = !["pasFoto", "qrcode"].includes(key);

              return (
                <div
                  key={key}
                  draggable
                  onDragEnd={(e) => handleDrag(e, key)}
                  onClick={() => setSelectedElement(key)}
                  className={`absolute cursor-move select-none flex items-center justify-start leading-none font-bold italic transition-all ${
                    selectedElement === key ? "ring-2 ring-blue-500 z-50 bg-blue-50/30" : "z-10"
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    fontSize: isText ? `${el.fontSize}px` : undefined,
                    color: isText ? el.color : "#64748b",
                    width: key === "pasFoto" ? `${el.width}px` : key === "qrcode" ? `${el.size}px` : "auto",
                    height: key === "pasFoto" ? `${el.height}px` : key === "qrcode" ? `${el.size}px` : "auto",
                    backgroundColor: isText ? "transparent" : "rgba(241, 245, 249, 0.6)",
                    border: !isText ? "1px dashed #cbd5e1" : (selectedElement === key ? "1px solid #3b82f6" : "none"),
                    whiteSpace: "nowrap",
                  }}
                >
                  {isText ? (
                    key === "nama" ? "MUHAMMAD FIKRI..." : 
                    key === "jenis_kelamin" ? "LAKI-LAKI" : 
                    key === "tingkatan" ? "PENGGALANG RAMU" :
                    key.toUpperCase()
                  ) : (
                    <div className="text-[8px] font-black w-full text-center uppercase">
                      {key === "pasFoto" ? "FOTO" : "QR"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- PREVIEW BAGIAN BELAKANG (STATIS) --- */}
        <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">Preview Bagian Belakang (Statis)</p>
        <div className="w-full flex justify-center items-center py-10 bg-slate-200/50 rounded-[3rem] shadow-inner overflow-hidden">
             <div 
                className="bg-white shadow-2xl shrink-0"
                style={{
                    width: "1011px",
                    height: "638px",
                    backgroundImage: `url(${config.backTemplateURL || "https://via.placeholder.com/1011x638?text=Upload+Belakang+KTA"})`,
                    backgroundSize: "100% 100%",
                    transform: "scale(var(--editor-scale, 0.5))",
                    transformOrigin: "center center",
                }}
             />
        </div>
      </div>

      {/* SIDEBAR CONTROL PANEL */}
      <div className="w-full md:w-96 bg-white shadow-2xl p-10 border-l border-slate-100 overflow-y-auto max-h-screen shrink-0">
        <h2 className="font-black text-xs uppercase tracking-[0.3em] mb-10 text-slate-400 italic border-b pb-4">
          Control Panel
        </h2>

        {/* UPLOAD TEMPLATE DEPAN */}
        <div className="mb-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner text-center">
          <label className="text-[10px] font-black uppercase text-blue-900 block mb-4 tracking-widest">
            Template Depan (1011x638)
          </label>
          <input
            type="file"
            onChange={(e) => handleTemplateUpload(e, "front")}
            className="text-[10px] w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-900 file:text-white"
            accept="image/*"
          />
        </div>

        {/* UPLOAD TEMPLATE BELAKANG */}
        <div className="mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner text-center">
          <label className="text-[10px] font-black uppercase text-red-900 block mb-4 tracking-widest">
            Template Belakang (1011x638)
          </label>
          <input
            type="file"
            onChange={(e) => handleTemplateUpload(e, "back")}
            className="text-[10px] w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-red-900 file:text-white"
            accept="image/*"
          />
        </div>

        {config.elements[selectedElement] && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <label className="text-[10px] font-black uppercase text-blue-900 tracking-widest bg-blue-50 px-4 py-2 rounded-full">
              Editing: {selectedElement.toUpperCase()}
            </label>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">X Pos (%)</label>
                <input
                  type="number" step="0.1"
                  value={config.elements[selectedElement].x}
                  onChange={(e) => updateConfig(selectedElement, { x: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border-2 p-4 rounded-2xl text-xs font-black outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Y Pos (%)</label>
                <input
                  type="number" step="0.1"
                  value={config.elements[selectedElement].y}
                  onChange={(e) => updateConfig(selectedElement, { y: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border-2 p-4 rounded-2xl text-xs font-black outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {!["pasFoto", "qrcode"].includes(selectedElement) && (
              <>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Font Size (px)</label>
                  <input
                    type="number"
                    value={config.elements[selectedElement].fontSize}
                    onChange={(e) => updateConfig(selectedElement, { fontSize: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border-2 p-4 rounded-2xl text-xs font-black outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Text Color</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                    <input
                      type="color"
                      value={config.elements[selectedElement].color}
                      onChange={(e) => updateConfig(selectedElement, { color: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-[10px] font-black text-slate-400 font-mono">{config.elements[selectedElement].color.toUpperCase()}</span>
                  </div>
                </div>
              </>
            )}

            {selectedElement === "pasFoto" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Width (px)</label>
                  <input
                    type="number"
                    value={config.elements.pasFoto.width}
                    onChange={(e) => updateConfig("pasFoto", { width: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border-2 p-4 rounded-2xl text-xs font-black shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Height (px)</label>
                  <input
                    type="number"
                    value={config.elements.pasFoto.height}
                    onChange={(e) => updateConfig("pasFoto", { height: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border-2 p-4 rounded-2xl text-xs font-black shadow-inner"
                  />
                </div>
              </div>
            )}

            {selectedElement === "qrcode" && (
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Square Size (px)</label>
                <input
                  type="number"
                  value={config.elements.qrcode.size}
                  onChange={(e) => updateConfig("qrcode", { size: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border-2 p-4 rounded-2xl text-xs font-black shadow-inner"
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.5rem] mt-12 shadow-2xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 italic"
        >
          <img src="https://cdn-icons-png.flaticon.com/128/2901/2901214.png" className="w-5 h-5 brightness-0 invert" alt="save" />
          Simpan Layout
        </button>
      </div>
    </div>
  );
}