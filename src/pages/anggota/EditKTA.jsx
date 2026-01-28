import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { HiOutlineChevronLeft, HiOutlineCamera, HiOutlineSave } from "react-icons/hi";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    nta: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "Laki-laki",
    agama: "Islam",
    jabatan: "",
    kwarran: "",
    kwarcab: "",
    ktaPhotoURL: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFormData(data);
          setPreviewURL(data.ktaPhotoURL);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = auth.currentUser;
      let photoURL = formData.ktaPhotoURL;

      // 1. Upload foto jika ada perubahan
      if (imageFile) {
        const storageRef = ref(storage, `kta_photos/${user.uid}`);
        const uploadTask = await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(uploadTask.ref);
      }

      // 2. Update Firestore
      const finalData = { ...formData, ktaPhotoURL: photoURL };
      await updateDoc(doc(db, "users", user.uid), finalData);

      alert("Profil berhasil diperbarui!");
      navigate("/anggota"); // Kembali ke dashboard anggota
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 italic animate-pulse">
      Memuat Data Profil...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 italic">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-8 bg-blue-900 text-white flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <HiOutlineChevronLeft size={24} />
          </button>
          <div>
            <h1 className="font-black uppercase text-lg tracking-tighter">Edit Data Identitas</h1>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Laskar Bahari System</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          
          {/* Foto Profil Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-40 bg-slate-200 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner">
                {previewURL ? (
                  <img src={previewURL} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">FOTO</div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-blue-600 p-2 rounded-xl text-white cursor-pointer hover:scale-110 transition-all shadow-lg">
                <HiOutlineCamera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-[9px] text-slate-400 mt-3 uppercase font-bold tracking-widest text-center">
              Gunakan foto berseragam pramuka <br/> latar belakang merah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Nama */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nama Lengkap</label>
              <input 
                type="text" name="nama" value={formData.nama} onChange={handleChange} required
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Input NTA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">NTA (Nomor Tanda Anggota)</label>
              <input 
                type="text" name="nta" value={formData.nta} onChange={handleChange} placeholder="10.491.XXX.XXX"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Tempat Lahir */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tempat Lahir</label>
              <input 
                type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tanggal Lahir</label>
              <input 
                type="text" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} placeholder="01 Januari 2010"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Jabatan */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Jabatan</label>
              <input 
                type="text" name="jabatan" value={formData.jabatan} onChange={handleChange} placeholder="Anggota Penggalang"
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Kwarran */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Kwarran (Kecamatan)</label>
              <input 
                type="text" name="kwarran" value={formData.kwarran} onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={saving}
            className={`w-full ${saving ? 'bg-slate-400' : 'bg-blue-900 hover:bg-slate-800'} text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mt-8`}
          >
            <HiOutlineSave size={20} />
            {saving ? "Menyimpan Data..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}