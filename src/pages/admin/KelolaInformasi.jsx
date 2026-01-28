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
  HiOutlineBell
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

  // 2. Handle Submit (Create & Update) dengan Push Notification
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return alert("Mohon lengkapi Judul dan Isi Pesan.");

    const currentUser = auth.currentUser;
    const adminName = currentUser.displayName || "Pembina Laskar";

    try {
      if (isEditing) {
        // UPDATE DATA
        await updateDoc(doc(db, "announcements", currentId), {
          ...formData,
          updatedAt: serverTimestamp(),
          author: adminName
        });

        alert("Perubahan berhasil disimpan!");
      } else {
        // 1. SIMPAN PENGUMUMAN UTAMA
        const announceRef = await addDoc(collection(db, "announcements"), {
          ...formData,
          createdAt: serverTimestamp(),
          author: adminName,
          date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
        });

        // 2. KIRIM PUSH NOTIFICATION KE KOLEKSI GLOBAL
        // Ini akan memicu pop-up di layar semua anggota yang sedang membuka aplikasi
        await addDoc(collection(db, "notifications"), {
          type: "ANNOUNCEMENT",
          title: "Siaran Baru Terdeteksi!",
          body: formData.title,
          category: formData.category,
          targetPath: "/announcements",
          createdAt: serverTimestamp(),
          isRead: false
        });

        // 3. LOGGING AKTIVITAS
        await addDoc(collection(db, "logs"), {
          action: "Publikasi Informasi",
          adminName: adminName,
          targetName: "Semua Anggota",
          reason: `Publikasi: ${formData.title}`,
          timestamp: serverTimestamp(),
        });

        alert("Pengumuman resmi dipublikasikan dan notifikasi terkirim!");
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Gagal memproses ke database.");
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic">
      <div className="text-center font-black text-purple-900 animate-pulse uppercase text-[10px] tracking-widest">
        Sinkronisasi Laskar Hub...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-purple-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter">Kelola Informasi</h1>
              <p className="text-[9px] text-purple-200 font-bold uppercase tracking-[0.3em]">Nautical Newsroom</p>
            </div>
          </div>
          <button 
            onClick={() => openModal()}
            className="w-10 h-10 bg-white text-purple-900 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <HiOutlinePlus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* LIST PENGUMUMAN */}
      <div className="px-6 -mt-8 relative z-20 space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center border border-dashed border-slate-200 opacity-50">
            <HiOutlineSpeakerphone size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dermaga Informasi Kosong.</p>
          </div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      item.category === 'Urgent' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                   }`}>
                      <HiOutlineSpeakerphone size={16} />
                   </div>
                   <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase italic ${
                    item.category === 'Urgent' ? 'bg-red-50 text-red-600' : 
                    item.category === 'Kegiatan' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {item.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(item)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-90">
                    <HiOutlinePencilAlt size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id, item.title)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-600 transition-all active:scale-90">
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-black uppercase text-slate-800 leading-tight mb-2 tracking-tight">{item.title}</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-5 italic">"{item.message}"</p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <p className="text-[8px] font-black text-slate-300 uppercase italic flex items-center gap-1.5">
                  <HiOutlineShieldCheck className="w-3.5 h-3.5 text-purple-400" /> By: {item.author}
                </p>
                <p className="text-[8px] font-black text-slate-300 uppercase">{item.date}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={closeModal}></div>
          <form 
            onSubmit={handleSubmit}
            className="bg-white w-full max-w-md rounded-[3.5rem] p-10 relative z-10 shadow-2xl animate-in zoom-in duration-300 border border-slate-100"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-100 text-purple-900 rounded-2xl flex items-center justify-center shadow-inner">
                    <HiOutlineSpeakerphone size={20} />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800 leading-none">
                   {isEditing ? "Edit Siaran" : "Siaran Baru"}
                 </h2>
              </div>
              <button type="button" onClick={closeModal} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                <HiOutlineX size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-3 tracking-widest flex items-center gap-1"><HiOutlineCollection /> Kategori</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-[1.5rem] font-bold text-xs outline-none border-2 border-transparent focus:border-purple-600 focus:bg-white transition-all appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Umum">Umum / Berita</option>
                  <option value="Kegiatan">Kegiatan Latihan</option>
                  <option value="Urgent">⚠️ Sangat Penting / Darurat</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-3 tracking-widest flex items-center gap-1"><HiOutlineDocumentText /> Judul Informasi</label>
                <input 
                  type="text"
                  placeholder="Ketik judul yang menarik..."
                  className="w-full p-4 bg-slate-50 rounded-[1.5rem] font-bold text-xs outline-none border-2 border-transparent focus:border-purple-600 focus:bg-white transition-all shadow-inner"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-3 tracking-widest flex items-center gap-1"><HiOutlineBell /> Pesan Push (Notification)</label>
                <textarea 
                  placeholder="Tuliskan isi informasi selengkapnya di sini..."
                  className="w-full p-6 bg-slate-50 rounded-[2.2rem] font-bold text-xs outline-none border-2 border-transparent focus:border-purple-600 focus:bg-white h-36 transition-all shadow-inner resize-none italic"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-8 bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-2">
               <p className="text-[8px] text-amber-700 font-black uppercase italic leading-relaxed text-center">Info: Mengirim pengumuman ini akan memicu push notification ke seluruh anggota Laskar Bahari.</p>
            </div>

            <button 
              type="submit"
              className="w-full bg-purple-950 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-950/20 active:scale-95 hover:bg-purple-900 transition-all flex items-center justify-center gap-3"
            >
              <HiOutlinePlus size={18} /> {isEditing ? "Simpan Perubahan" : "Publikasikan & Siarkan"}
            </button>
          </form>
        </div>
      )}

      <footer className="mt-20 text-center opacity-20">
         <p className="text-[8px] font-black uppercase tracking-[0.6em] italic">Marine Broadcast System v4.2</p>
      </footer>
    </div>
  );
}