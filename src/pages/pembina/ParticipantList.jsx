import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx'; // Import library Excel
import { 
  HiOutlineArrowLeft, 
  HiOutlineExternalLink, 
  HiOutlineTrash, 
  HiOutlineSearch,
  HiOutlineDocumentDownload, // Icon baru untuk Excel
  HiOutlineBadgeCheck,
  HiOutlineClipboardCopy,
  HiOutlineCheck
} from 'react-icons/hi';
import { useConfirm } from './context/ConfirmContext';

const ParticipantList = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [participants, setParticipants] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null); // Untuk feedback salin link

  useEffect(() => {
    const fetchEvent = async () => {
      const eventRef = doc(db, "events", eventId);
      onSnapshot(eventRef, (snap) => {
        if (snap.exists()) setEventInfo(snap.data());
      });
    };

    const q = query(collection(db, "certificates"), where("eventId", "==", eventId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
      setLoading(false);
    });

    fetchEvent();
    return () => unsubscribe();
  }, [eventId]);

  const handleDelete = (id, nama) => {
    confirm({
      title: "Hapus Sertifikat?",
      message: `HAPUS DATA SERTIFIKAT ATAS NAMA ${nama.toUpperCase()}? DATA VALIDASI AKAN HILANG PERMANEN.`,
      type: "danger",
      onConfirm: async () => {
        await deleteDoc(doc(db, "certificates", id));
      }
    });
  };

  // --- FUNGSI EKSPOR KE EXCEL (.XLSX) ---
  const exportToExcel = () => {
    if (participants.length === 0) return alert("Tidak ada data untuk diekspor!");

    // Menyiapkan data untuk Excel
    const dataFormatted = participants.map((p, index) => ({
      "No": index + 1,
      "Nama Penerima": p.namaPenerima.toUpperCase(),
      "Nomor Sertifikat": p.noSertifikat,
      "Kegiatan": p.eventTitle,
      "Tanggal": p.eventDate,
      "Link Validasi": `${window.location.origin}/v/${p.noSertifikat}`
    }));

    // Membuat worksheet dan workbook
    const worksheet = XLSX.utils.json_to_sheet(dataFormatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sertifikat");

    // Atur lebar kolom otomatis (opsional)
    const wscols = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama
      { wch: 25 }, // No Sertifikat
      { wch: 30 }, // Kegiatan
      { wch: 20 }, // Tanggal
      { wch: 40 }  // Link
    ];
    worksheet['!cols'] = wscols;

    // Download file
    XLSX.writeFile(workbook, `Database_Sertifikat_${eventInfo?.title || 'Kegiatan'}.xlsx`);
  };

  // --- FUNGSI SALIN LINK ---
  const copyLink = (certId) => {
    const fullLink = `${window.location.origin}/v/${certId}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000); // Reset icon setelah 2 detik
  };

  const filteredParticipants = participants.filter(p => 
    p.namaPenerima.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 italic font-sans selection:bg-blue-900">
      <div className="max-w-md mx-auto p-6">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/pembina/event-list')} className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-slate-400 active:scale-90 transition-all">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-xl font-black uppercase tracking-tighter text-white truncate">
              {eventInfo?.title || "Syncing..."}
            </h1>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">
              Archive Intelligence: {participants.length} Records
            </p>
          </div>
        </div>

        {/* Toolbar Aksi */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 bg-emerald-600/10 border border-emerald-500/20 py-3 rounded-xl text-[9px] font-black uppercase text-emerald-500 tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-900/10"
          >
            <HiOutlineDocumentDownload size={16} /> Export Excel
          </button>
          <button 
            onClick={() => navigate(`/pembina/input-nama/${eventId}`)}
            className="flex items-center justify-center gap-2 bg-blue-600/10 border border-blue-500/20 py-3 rounded-xl text-[9px] font-black uppercase text-blue-400 tracking-widest active:scale-95 transition-all"
          >
            <HiOutlineBadgeCheck size={16} /> Add More
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 group">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="CARI NAMA ANGGOTA..." 
            className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[10px] font-black uppercase focus:border-blue-500 outline-none transition-all placeholder:text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List Peserta */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 flex flex-col items-center gap-2 animate-pulse">
               <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
               <p className="text-[9px] font-black uppercase text-slate-700 tracking-widest">Accessing Dossiers...</p>
            </div>
          ) : filteredParticipants.length > 0 ? (
            filteredParticipants.map((p) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={p.id}
                className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-all hover:border-blue-500/30 backdrop-blur-sm"
              >
                <div className="flex-1 pr-4">
                  <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight mb-0.5 line-clamp-1">{p.namaPenerima}</h4>
                  <p className="text-[9px] font-mono text-slate-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    {p.noSertifikat}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* TOMBOL SALIN LINK */}
                  <button 
                    onClick={() => copyLink(p.noSertifikat)}
                    className={`p-2.5 rounded-lg transition-all active:scale-90 ${copiedId === p.noSertifikat ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    title="Salin Link Validasi"
                  >
                    {copiedId === p.noSertifikat ? <HiOutlineCheck size={16} /> : <HiOutlineClipboardCopy size={16} />}
                  </button>

                  {/* TOMBOL LIHAT VALIDASI */}
                  <button 
                    onClick={() => window.open(`/v/${p.noSertifikat}`, '_blank')}
                    className="p-2.5 bg-slate-800 rounded-lg text-blue-500 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                    title="Buka Halaman Validasi"
                  >
                    <HiOutlineExternalLink size={16} />
                  </button>

                  {/* TOMBOL HAPUS */}
                  <button 
                    onClick={() => handleDelete(p.id, p.namaPenerima)}
                    className="p-2.5 bg-slate-800 rounded-lg text-slate-600 hover:text-red-500 transition-all active:scale-90"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em]">Empty Archives</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantList;