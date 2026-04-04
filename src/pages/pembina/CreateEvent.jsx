import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBadgeCheck, HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCalendar } from 'react-icons/hi';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, success: true, message: '' });
  
  // State untuk tanggal tunggal (Penerbitan)
  const [issueDate, setIssueDate] = useState('');

  const [eventData, setEventData] = useState({
    title: '',
    location: '',
    idFormat: '',
    description: '',
    issuer: 'Gugus Depan 10.491-10.492 Pangkalan SMP Negeri 1 Biau'
  });

  const formatDateIndo = (dateString) => {
    if (!dateString) return "";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mengonversi input date HTML ke format teks Indonesia
      const finalDateFormatted = formatDateIndo(issueDate);

      await addDoc(collection(db, "events"), {
        ...eventData,
        date: finalDateFormatted, // Disimpan sebagai tanggal penerbitan yang sudah rapi
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      setModal({
        show: true,
        success: true,
        message: "PROTOKOL BERHASIL: MASTER KEGIATAN & TANGGAL PENERBITAN TELAH DIARSIPKAN."
      });

      setTimeout(() => {
        navigate('/pembina/event-list');
      }, 2000);

    } catch (error) {
      console.error("Error:", error);
      setModal({
        show: true,
        success: false,
        message: "KEGAGALAN SISTEM: IZIN DITOLAK ATAU MASALAH KONEKSI."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans italic selection:bg-blue-900">
      
      {/* MODAL NOTIFIKASI */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`max-w-xs w-full p-6 rounded-[2rem] border shadow-2xl text-center ${
                modal.success ? 'bg-slate-900 border-emerald-500/50' : 'bg-slate-900 border-red-500/50'
              }`}
            >
              <div className="flex justify-center mb-4">
                {modal.success ? (
                  <HiOutlineCheckCircle className="text-emerald-500" size={60} />
                ) : (
                  <HiOutlineXCircle className="text-red-500" size={60} />
                )}
              </div>
              <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${modal.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {modal.success ? 'System Success' : 'System Error'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                {modal.message}
              </p>
              {!modal.success && (
                <button 
                  onClick={() => setModal({ ...modal, show: false })}
                  className="mt-6 w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
                >
                  Tutup & Perbaiki
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <button 
          onClick={() => navigate('/pembina/event-list')}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
        >
          <HiOutlineArrowLeft size={16} /> Kembali ke Daftar
        </button>

        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
          
          <div className="bg-gradient-to-r from-blue-600/20 to-transparent p-8 border-b border-white/5 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <HiOutlineBadgeCheck size={80} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">
              Master Sertifikat <span className="text-blue-500">Baru</span>
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
              Langkah 1: Inisialisasi Data & Protokol ID
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* INPUT NAMA KEGIATAN */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Kegiatan / Event</label>
              <input 
                type="text"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-700"
                placeholder="CONTOH: PESTA GUDEP IV 2026"
                value={eventData.title}
                onChange={(e) => setEventData({...eventData, title: e.target.value})}
              />
            </div>

            {/* INPUT TANGGAL PENERBITAN & LOKASI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tanggal Penerbitan</label>
                <div className="relative">
                  <input 
                    type="date"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all uppercase appearance-none"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                  <HiOutlineCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lokasi Otoritas</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="CONTOH: BIAU"
                  value={eventData.location}
                  onChange={(e) => setEventData({...eventData, location: e.target.value})}
                />
              </div>
            </div>

            {/* PROTOKOL ID FORMAT */}
            <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[1.5rem] relative">
              <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                Protokol Penomoran ID (Custom):
              </label>
              <input 
                type="text"
                required
                className="w-full bg-black border border-blue-500/30 rounded-xl px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-800 uppercase"
                placeholder="CONTOH: LB/PG-IV/2026/"
                value={eventData.idFormat}
                onChange={(e) => setEventData({...eventData, idFormat: e.target.value})}
              />
              <div className="mt-4 flex items-center gap-3 bg-blue-900/20 p-3 rounded-lg border border-blue-500/10">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-[9px] font-black text-blue-300 uppercase tracking-tighter">
                  Output Preview: <span className="text-white ml-2">{eventData.idFormat.toUpperCase() || 'FORMAT/'}001</span>
                </p>
              </div>
            </div>

            {/* DESKRIPSI */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Keterangan / Deskripsi</label>
              <textarea 
                rows="3"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                placeholder="MASUKKAN DESKRIPSI SINGKAT KEGIATAN..."
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] ${
                loading 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Arsip Sedang Diproses...
                </div>
              ) : (
                'Finalisasi & Simpan Master'
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
          NAVI Certification System v2.0 • Secure Transmission Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default CreateEvent;