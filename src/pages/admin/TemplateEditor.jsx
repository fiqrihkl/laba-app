import React, { useState } from "react";
import { storage, db } from "../../firebase"; //
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

export default function TemplateEditor({ config }) {
  const [fields, setFields] = useState(config.fields || {});
  const [uploading, setUploading] = useState(false);

  // Fungsi Upload Gambar Template
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const storageRef = ref(storage, `templates/cert_bg.jpg`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "settings", "certificate_config"), { templateUrl: url });
    setUploading(false);
  };

  // Fungsi Update Posisi (Input Manual untuk Presisi)
  const updatePos = async (key, axis, value) => {
    const newFields = { ...fields, [key]: { ...fields[key], [axis]: value } };
    setFields(newFields);
    await updateDoc(doc(db, "settings", "certificate_config"), { fields: newFields });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Upload Section */}
      <input type="file" onChange={handleUpload} className="text-white" />
      
      {/* Preview Canvas */}
      <div className="relative w-full border-4 border-amber-900 rounded-lg overflow-hidden bg-slate-800 aspect-[1.41/1]">
        {config.templateUrl && (
          <img src={config.templateUrl} className="w-full h-full object-contain opacity-50" alt="Template" />
        )}
        
        {/* Nama (Contoh Field) */}
        <div 
          className="absolute text-white font-bold pointer-events-none border border-dashed border-white/50 px-2"
          style={{ left: `${fields.nama?.x}%`, top: `${fields.nama?.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          [NAMA ANGGOTA]
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-2 gap-4">
        {['nama', 'nomor', 'tanggal'].map((field) => (
          <div key={field} className="bg-white/5 p-4 rounded-xl">
            <p className="uppercase text-[10px] font-black text-amber-500 mb-2">{field}</p>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={fields[field]?.x} 
                onChange={(e) => updatePos(field, 'x', e.target.value)}
                className="w-full bg-black p-2 rounded text-xs" 
                placeholder="X (%)"
              />
              <input 
                type="number" 
                value={fields[field]?.y} 
                onChange={(e) => updatePos(field, 'y', e.target.value)}
                className="w-full bg-black p-2 rounded text-xs" 
                placeholder="Y (%)"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}