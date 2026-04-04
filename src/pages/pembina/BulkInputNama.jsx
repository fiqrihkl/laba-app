import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx'; // Import library Excel
import { 
  HiOutlineArrowLeft, 
  HiOutlineViewGridAdd, 
  HiOutlineClipboardList, 
  HiOutlineExclamationCircle,
  HiOutlineDocumentDownload,
  HiOutlineUpload
} from 'react-icons/hi';

const BulkInputNama = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [rawNames, setRawNames] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent(docSnap.data());
      } else {
        alert("PROTOKOL ERROR: EVENT DATA NOT FOUND.");
        navigate('/pembina/event-list');
      }
    };
    fetchEvent();
  }, [eventId]);

  // Fungsi Download Template Excel
  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{ "Nama Peserta": "" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `Template_Import_${event?.title || 'Sertifikat'}.xlsx`);
  };

  // Fungsi Handle Upload Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Ambil data dari kolom "Nama Peserta"
      const namesFromExcel = jsonData
        .map(row => row["Nama Peserta"])
        .filter(name => name && name.toString().trim() !== "")
        .join('\n');

      if (!namesFromExcel) {
        alert("ERROR: Kolom 'Nama Peserta' tidak ditemukan atau kosong!");
      } else {
        setRawNames(prev => prev ? prev + '\n' + namesFromExcel : namesFromExcel);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; // Reset input file
  };

  const getCleanNames = () => {
    return rawNames.split('\n').map(name => name.trim()).filter(name => name !== "");
  };

  const handleProcessBulk = async (e) => {
    e.preventDefault();
    const nameList = getCleanNames();
    if (nameList.length === 0) return alert("INPUT DATA KOSONG!");

    setLoading(true);
    const batch = writeBatch(db);

    try {
      nameList.forEach((name, index) => {
        const sequence = (index + 1).toString().padStart(3, '0');
        const customCertId = `${event.idFormat}${sequence}`;
        const certRef = doc(collection(db, "certificates"));
        
        batch.set(certRef, {
          eventId: eventId,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          namaPenerima: name.toUpperCase(), // Paksa Uppercase agar rapi di sertifikat
          noSertifikat: customCertId,
          status: 'valid',
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      alert(`PROTOKOL BERHASIL: ${nameList.length} SERTIFIKAT TERDAFTAR.`);
      navigate(`/pembina/participants/${eventId}`);
    } catch (error) {
      console.error("Critical Bulk Error:", error);
      alert("GAGAL SINKRONISASI DATABASE.");
    } finally {
      setLoading(false);
    }
  };

  if (!event) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900">
      <div className="max-w-md mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-slate-400">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">Import <span className="text-blue-500">Massal</span></h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate w-48">{event.title}</p>
          </div>
        </div>

        {/* Toolbar Aksi Excel */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            type="button"
            onClick={downloadTemplate}
            className="flex items-center justify-center gap-2 bg-slate-900 border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all"
          >
            <HiOutlineDocumentDownload size={16} /> Template
          </button>
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center justify-center gap-2 bg-emerald-600/10 border border-emerald-500/20 py-3 rounded-xl text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all"
          >
            <HiOutlineUpload size={16} /> Upload Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
        </div>

        <form onSubmit={handleProcessBulk} className="space-y-6">
          
          <div className="bg-blue-600/5 border border-blue-500/20 p-5 rounded-[1.5rem] relative overflow-hidden text-left">
            <HiOutlineExclamationCircle className="absolute -right-2 -top-2 text-blue-500/10 font-sans" size={80} />
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Instruksi Protokol
            </h4>
            <p className="text-[9px] text-slate-400 leading-relaxed uppercase font-black">
              Gunakan tombol <b>Upload Excel</b> atau ketik manual di bawah. Pastikan satu nama per baris. Format ID: <span className="text-white underline">{event.idFormat}XXX</span>
            </p>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineClipboardList size={14} /> Daftar Nama Peserta
               </label>
               <span className="text-[8px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded italic">
                  {getCleanNames().length} DETECTED
               </span>
            </div>
            <textarea 
              rows="12"
              className="w-full bg-slate-950 border border-white/5 rounded-2xl p-5 text-[11px] font-black uppercase text-slate-200 focus:border-blue-500 outline-none transition-all placeholder:text-slate-800 tracking-tighter custom-scroll"
              placeholder="CONTOH:&#10;MUHAMMAD FIQRI&#10;PUSPawati&#10;ANDI AHMAD..."
              value={rawNames}
              onChange={(e) => setRawNames(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          <div className="flex flex-col gap-3">
             <button 
                type="submit"
                disabled={loading || getCleanNames().length === 0}
                className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                  loading || getCleanNames().length === 0
                  ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 shadow-lg'
                }`}
             >
                {loading ? (
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                   <>
                     <HiOutlineViewGridAdd size={20} />
                     Generate {getCleanNames().length} Sertifikat
                   </>
                )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkInputNama;