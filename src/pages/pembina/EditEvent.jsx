import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBadgeCheck, HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineSave } from 'react-icons/hi';

const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modal, setModal] = useState({ show: false, success: true, message: '' });
  
  // State untuk input date (Format: YYYY-MM-DD agar bisa dibaca input type date)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [eventData, setEventData] = useState({
    title: '',
    location: '',
    idFormat: '',
    description: '',
    issuer: ''
  });

  // 1. Ambil data lama dari Firestore saat halaman dimuat
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
            description: data.description,
            issuer: data.issuer
          });
          // Note: Karena 'date' di Firestore sudah dalam format string "12 Maret...", 
          // kita tidak bisa langsung memasukkannya ke input type="date".
          // Pembina harus memilih ulang tanggal jika ingin mengubahnya.
        } else {
          alert("DATA TIDAK DITEMUKAN");
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

    let finalDateRange = "";
    // Jika tanggal baru dipilih, gunakan yang baru. Jika tidak, tetap gunakan yang lama (logika sederhana)
    if (startDate) {
      const startFormatted = formatDateIndo(startDate);
      const endFormatted = endDate ? formatDateIndo(endDate) : startFormatted;
      finalDateRange = startDate === endDate || !endDate ? startFormatted : `${startFormatted} s/d ${endFormatted}`;
    }

    try {
      const docRef = doc(db, "events", eventId);
      const updatePayload = {
        ...eventData,
        // Update tanggal hanya jika pembina memilih tanggal baru di form
        ...(startDate && { date: finalDateRange })
      };

      await updateDoc(docRef, updatePayload);
      
      setModal({
        show: true,
        success: true,
        message: "SINKRONISASI BERHASIL: DATA MASTER KEGIATAN TELAH DIPERBARUI."
      });

      setTimeout(() => navigate('/pembina/event-list'), 2000);
    } catch (error) {
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
      <div className="w-8 h-8 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans italic selection:bg-blue-900">
      
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`max-w-xs w-full p-6 rounded-[2rem] border shadow-2xl text-center bg-slate-900 ${modal.success ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
              <div className="flex justify-center mb-4">
                {modal.success ? <HiOutlineCheckCircle className="text-emerald-500" size={60} /> : <HiOutlineXCircle className="text-red-500" size={60} />}
              </div>
              <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${modal.success ? 'text-emerald-400' : 'text-red-400'}`}>Update Status</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{modal.message}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/pembina/event-list')} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors">
          <HiOutlineArrowLeft size={16} /> Batal & Kembali
        </button>

        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md">
          <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-8 border-b border-white/5 relative">
            <h2 className="text-2xl font-black uppercase text-white italic">Edit <span className="text-orange-500">Master</span></h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">ID: {eventId}</p>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Judul Kegiatan</label>
              <input type="text" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={eventData.title} onChange={(e) => setEventData({...eventData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganti Tgl Mulai</label>
                <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganti Tgl Selesai</label>
                <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <p className="text-[8px] text-slate-600 uppercase font-bold italic">*Kosongkan tanggal jika tidak ingin mengubah jadwal lama.</p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lokasi</label>
              <input type="text" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={eventData.location} onChange={(e) => setEventData({...eventData, location: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protokol ID Format</label>
              <input type="text" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none"
                value={eventData.idFormat} onChange={(e) => setEventData({...eventData, idFormat: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-800 text-slate-600' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20'}`}>
              <HiOutlineSave size={18} /> {loading ? 'Memproses...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default EditEvent;