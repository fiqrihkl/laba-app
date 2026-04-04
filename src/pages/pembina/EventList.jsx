import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc, 
  where,
  getDocs 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePlus, 
  HiOutlineCalendar, 
  HiOutlineUsers, 
  HiOutlineTrash, 
  HiOutlinePencilAlt, 
  HiOutlineEye,
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineLocationMarker
} from 'react-icons/hi';
import { useConfirm } from './context/ConfirmContext';

const EventList = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [counts, setCounts] = useState({}); // State untuk menyimpan jumlah peserta per event

  // 1. Listen ke koleksi Events
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventData);
      
      // Setelah dapat events, hitung peserta untuk masing-masing event
      eventData.forEach(ev => fetchParticipantCount(ev.id));
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fungsi untuk menghitung jumlah peserta secara dinamis
  const fetchParticipantCount = async (eventId) => {
    try {
      const q = query(collection(db, "certificates"), where("eventId", "==", eventId));
      const snap = await getDocs(q);
      setCounts(prev => ({
        ...prev,
        [eventId]: snap.size
      }));
    } catch (err) {
      console.error("Error counting:", err);
    }
  };

  const handleDelete = (id, title) => {
    confirm({
      title: "Hapus Master?",
      message: `HAPUS SELURUH DATA SERTIFIKAT DI EVENT: ${title}? TINDAKAN INI PERMANEN.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "events", id));
          // Logika hapus massal certificates bisa ditambahkan di Cloud Functions atau loop manual
        } catch (err) {
          alert("GAGAL MENGHAPUS DATA.");
        }
      }
    });
  };

  const filteredEvents = events.filter(ev => 
    ev.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 italic selection:bg-blue-900 font-sans">
      <div className="max-w-md mx-auto p-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
              Sertifikat <span className="text-blue-500">Master</span>
            </h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Laskar Bahari Archives
            </p>
          </div>
          <button 
            onClick={() => navigate('/pembina/create-event')}
            className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 active:scale-90 transition-all border border-blue-400/30"
          >
            <HiOutlinePlus size={24} className="text-white" />
          </button>
        </div>

        {/* Search Bar - Style Cyberpunk */}
        <div className="relative mb-8 group">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="CARI ARSIP KEGIATAN..." 
            className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-blue-500 focus:bg-slate-900/50 outline-none transition-all placeholder:text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List Section */}
        <div className="space-y-6">
          {loading ? (
             <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Accessing encrypted files...</p>
             </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((ev) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={ev.id}
                className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden backdrop-blur-sm shadow-xl"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Validated Event</span>
                    <h3 className="text-lg font-black text-white uppercase leading-none tracking-tighter">
                      {ev.title}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/pembina/edit-event/${ev.id}`)} className="p-2 bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"><HiOutlinePencilAlt size={16} /></button>
                    <button onClick={() => handleDelete(ev.id, ev.title)} className="p-2 bg-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-all"><HiOutlineTrash size={16} /></button>
                  </div>
                </div>

                <div className="space-y-2 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-slate-500">
                    <HiOutlineCalendar size={14} className="text-blue-500" />
                    <span className="text-[9px] font-black uppercase">{ev.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <HiOutlineLocationMarker size={14} className="text-blue-500" />
                    <span className="text-[9px] font-black uppercase truncate">{ev.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                        <HiOutlineUsers size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                            {counts[ev.id] || 0} Anggota Terdaftar
                        </span>
                    </div>
                  </div>
                </div>

                {/* Mobile-First Action Grid */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button 
                    onClick={() => navigate(`/pembina/input-nama/${ev.id}`)}
                    className="flex flex-col items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                  >
                    <HiOutlineUserAdd size={20} />
                    Tambah Nama
                  </button>
                  <button 
                    onClick={() => navigate(`/pembina/participants/${ev.id}`)}
                    className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                  >
                    <HiOutlineEye size={20} />
                    Lihat Data
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic">No archives detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventList;