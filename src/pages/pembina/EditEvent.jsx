import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineBadgeCheck, 
  HiOutlineArrowLeft, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineSave,
  HiOutlineCalendar
} from 'react-icons/hi';

const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modal, setModal] = useState({ show: false, success: true, message: '' });
  
  // State untuk tanggal penerbitan (Format: YYYY-MM-DD agar bisa dibaca input type date)
  const [issueDate, setIssueDate] = useState('');

  const [eventData, setEventData] = useState({
    title: '',
    location: '',
    idFormat: '',
    description: '',
    issuer: ''
  });

  // 1. Ambil data dari Firestore saat halaman dimuat
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEventData({
            title: data.title,
            location: data.location,
            idFormat: data.idFormat,
            description: data.description || '',
            issuer: data.issuer
          });
          // Note: Karena 'date' di database sudah berformat string "12 Maret 2026",
          // input date HTML tidak bisa membacanya secara otomatis. 
          // User harus memilih tanggal baru jika ingin melakukan perubahan jadwal.
        } else {
          navigate('/pembina/event-list');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchEvent();
  }, [eventId, navigate]);

  const formatDateIndo = (dateString) => {
    if (!dateString) return "";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = doc(db, "events", eventId);
      
      const updatePayload = {
        ...eventData,
        // Update tanggal hanya jika pembina memilih tanggal baru di form
        ...(issueDate && { date: formatDateIndo(issueDate) })
      };

      await updateDoc(docRef, updatePayload);
      
      setModal({
        show: true,
        success: true,
        message: "SINKRONISASI BERHASIL: DATA MASTER KEGIATAN TELAH DIPERBARUI."
      });

      setTimeout(() => navigate('/pembina/event-list'), 2000);
    } catch (error) {
      console.error(error);
      setModal({
        show: true,
        success: false,
        message: "KEGAGALAN UPDATE: KONEKSI TERPUTUS ATAU OTORITAS DITOLAK."
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin" />
    </div>
  );

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
              className={`max-w-xs w-full p-6 rounded-[2rem] border shadow-2xl text-center bg-slate-900 ${
                modal.success ? 'border-emerald-500/50' : 'border-red-500/50'
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
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors tracking-widest"
        >
          <HiOutlineArrowLeft size={16} /> Batal & Kembali
        </button>

        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-8 border-b border-white/5 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <HiOutlineBadgeCheck size={80} />
            </div>
            <h2 className="text-2xl font-black uppercase text-white italic tracking-tighter">
              Edit Master <span className="text-orange-500">Kegiatan</span>
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
              UUID: {eventId.substring(0, 18)}...
            </p>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            
            {/* NAMA KEGIATAN */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Kegiatan / Event</label>
              <input 
                type="text" 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={eventData.title} 
                onChange={(e) => setEventData({...eventData, title: e.target.value.toUpperCase()})} 
              />
            </div>

            {/* TANGGAL PENERBITAN & LOKASI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ganti Tanggal Penerbitan</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
                    value={issueDate} 
                    onChange={(e) => setIssueDate(e.target.value)} 
                  />
                  <HiOutlineCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                </div>
                <p className="text-[8px] text-slate-600 font-bold italic">*Kosongkan jika tidak ingin mengubah tanggal lama.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lokasi Otoritas</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={eventData.location} 
                  onChange={(e) => setEventData({...eventData, location: e.target.value.toUpperCase()})} 
                />
              </div>
            </div>

            {/* PROTOKOL ID FORMAT */}
            <div className="bg-orange-600/5 border border-orange-500/20 p-6 rounded-[1.5rem] relative">
              <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">
                Protokol Penomoran ID (Custom):
              </label>
              <input 
                type="text" 
                required 
                className="w-full bg-black border border-orange-500/30 rounded-xl px-4 py-3 text-sm font-black text-white focus:ring-2 focus:ring-orange-500 outline-none uppercase"
                value={eventData.idFormat} 
                onChange={(e) => setEventData({...eventData, idFormat: e.target.value})} 
              />
              <div className="mt-4 flex items-center gap-3 bg-orange-900/20 p-3 rounded-lg border border-orange-500/10">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <p className="text-[9px] font-black text-orange-300 uppercase tracking-tighter">
                  Output Preview: <span className="text-white ml-2">{eventData.idFormat.toUpperCase() || 'FORMAT/'}001</span>
                </p>
              </div>
            </div>

            {/* DESKRIPSI */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Keterangan / Deskripsi</label>
              <textarea 
                rows="3" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                value={eventData.description} 
                onChange={(e) => setEventData({...eventData, description: e.target.value})} 
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                loading 
                ? 'bg-slate-800 text-slate-600' 
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20'
              }`}
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <HiOutlineSave size={18} />
              )}
              {loading ? 'MEMPROSES DATA...' : 'SIMPAN PERUBAHAN MASTER'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
          NAVI Certification System v2.0 • Secure Update Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default EditEvent;