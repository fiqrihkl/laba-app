import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineChevronLeft, 
  HiOutlinePlus, 
  HiOutlinePencilAlt, 
  HiOutlineTrash, 
  HiOutlineSpeakerphone,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineCollection,
  HiOutlineBell,
  HiOutlineInformationCircle
} from "react-icons/hi";

export default function KelolaInformasi() {
  const navigate = useNavigate();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // State Form
  const [formData, setFormData] = useState({
    title: "",
    message: "", 
    category: "Umum"
  });

  // 1. Fetch Data Real-time
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (location.state?.openForm) {
      openModal();
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 2. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return alert("Lengkapi data informasi.");

    const currentUser = auth.currentUser;
    const adminName = currentUser?.displayName || "Pembina Laskar";

    try {
      if (isEditing) {
        await updateDoc(doc(db, "announcements", currentId), {
          ...formData,
          updatedAt: serverTimestamp(),
          author: adminName
        });
      } else {
        // Publikasi & Notifikasi
        await addDoc(collection(db, "announcements"), {
          ...formData,
          createdAt: serverTimestamp(),
          author: adminName,
          date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
        });

        await addDoc(collection(db, "notifications"), {
          type: "ANNOUNCEMENT",
          title: "Siaran Baru Terdeteksi!",
          body: formData.title,
          category: formData.category,
          createdAt: serverTimestamp(),
          isRead: false
        });

        await addDoc(collection(db, "logs"), {
          action: "Publikasi Informasi",
          adminName: adminName,
          targetName: "Semua Anggota",
          reason: `Publikasi: ${formData.title}`,
          timestamp: serverTimestamp(),
        });
      }
      closeModal();
    } catch (error) {
      alert("Gagal memproses data.");
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Hapus pengumuman "${title}"?`)) {
      try {
        await deleteDoc(doc(db, "announcements", id));
      } catch (error) {
        alert("Gagal menghapus.");
      }
    }
  };

  const openModal = (data = null) => {
    if (data) {
      setIsEditing(true);
      setCurrentId(data.id);
      setFormData({ 
        title: data.title, 
        message: data.message || "", 
        category: data.category 
      });
    } else {
      setIsEditing(false);
      setFormData({ title: "", message: "", category: "Umum" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 font-sans uppercase text-[10px] tracking-widest">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
      Sinkronisasi Newsroom...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-indigo-900">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest">Broadcast Center</h1>
              <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">Manajemen Informasi Laskar</p>
            </div>
          </div>
          <button 
            onClick={() => openModal()}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <HiOutlinePlus size={20} />
          </button>
        </header>

        {/* LIST PENGUMUMAN */}
        <main className="px-6 mt-6 space-y-4 flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Siaran Terbit ({announcements.length})</h2>
          </div>

          <AnimatePresence mode="popLayout">
            {announcements.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-xl opacity-40">
                <HiOutlineSpeakerphone size={32} className="mx-auto mb-3 text-slate-600" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Dermaga Informasi Kosong</p>
              </div>
            ) : (
              announcements.map((item) => (
                <motion.div 
                  layout key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-white/5 p-5 rounded-xl space-y-4 group hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                      item.category === 'Urgent' ? 'bg-red-500/10 text-red-500' : 
                      item.category === 'Kegiatan' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {item.category}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(item)} className="p-2 text-slate-500 hover:text-indigo-400"><HiOutlinePencilAlt size={16} /></button>
                      <button onClick={() => handleDelete(item.id, item.title)} className="p-2 text-slate-500 hover:text-red-500"><HiOutlineTrash size={16} /></button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-100 leading-snug mb-1">{item.title}</h3>
                    <p className="text-[10px] text-slate-400 italic line-clamp-2">"{item.message}"</p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <p className="text-[7px] font-bold text-slate-600 uppercase flex items-center gap-1">
                      <HiOutlineShieldCheck className="text-indigo-500" /> By: {item.author}
                    </p>
                    <p className="text-[7px] font-bold text-slate-600 uppercase">{item.date}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>

        {/* MODAL FORM */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 w-full max-w-xs rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <HiOutlineSpeakerphone size={20} />
                    <h2 className="text-xs font-bold uppercase tracking-widest">{isEditing ? "Edit Siaran" : "Siaran Baru"}</h2>
                  </div>
                  <button type="button" onClick={closeModal}><HiOutlineX size={18} /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1 ml-1">Kategori Informasi</label>
                    <select 
                      className="w-full p-3 bg-black border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Umum">Umum / Berita</option>
                      <option value="Kegiatan">Kegiatan Latihan</option>
                      <option value="Urgent">⚠️ Sangat Penting / Darurat</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1 ml-1">Judul Informasi</label>
                    <input 
                      type="text" value={formData.title}
                      placeholder="Judul siaran..."
                      className="w-full p-3 bg-black border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1 ml-1">Isi Pesan (Push Notif)</label>
                    <textarea 
                      value={formData.message}
                      placeholder="Ketik detail informasi di sini..."
                      className="w-full p-4 bg-black border border-white/5 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-indigo-500 h-28 resize-none italic"
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>

                  <div className="bg-indigo-500/10 p-3 rounded-lg flex items-center gap-3 border border-indigo-500/20">
                    <HiOutlineInformationCircle className="text-indigo-500 shrink-0" size={16} />
                    <p className="text-[7px] text-indigo-200 uppercase font-bold leading-tight">Sistem akan mengirimkan push notification ke semua anggota Laskar Bahari.</p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <HiOutlinePlus size={16} /> {isEditing ? "Update Informasi" : "Siarkan Sekarang"}
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-auto py-8 text-center opacity-30 mx-6 border-t border-white/5">
           <p className="text-[8px] font-bold uppercase tracking-[0.5em]">Broadcast Intelligence v4.5</p>
        </footer>
      </div>
    </div>
  );
}