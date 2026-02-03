import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

// IMPORT REACT ICONS
import { 
  MdChevronLeft, 
  MdDelete, 
  MdPlaylistAdd, 
  MdAutoGraph, 
  MdLayers,
  MdDescription,
  MdStarOutline,
  MdOutlinePlace
} from "react-icons/md";

export default function KelolaMasterSKU() {
  const [skuList, setSkuList] = useState([]);
  const [tingkat, setTingkat] = useState("Ramu");
  const [nomor, setNomor] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("SPIRITUAL"); 
  const [subAgama, setSubAgama] = useState(""); // STATE BARU UNTUK POIN 4
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. Monitor status Auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Load Data SKU berdasarkan Tingkat secara Real-time
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "master_sku"),
      where("tingkat", "==", tingkat),
      orderBy("nomor", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setSkuList(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [tingkat]);

  // 3. Fungsi Tambah Data dengan Logging
  const handleAdd = async (e) => {
    e.preventDefault();

    if (!nomor || !deskripsi) return alert("Lengkapi nomor dan deskripsi!");
    if (!user) return alert("Sesi habis. Silakan login kembali.");

    setIsSubmitting(true);
    try {
      // Objek data yang akan disimpan
      const skuData = {
        tingkat: tingkat,
        nomor: Number(nomor),
        deskripsi: deskripsi.trim(),
        kategori: kategori,
        admin_uid: user.uid,
        createdAt: serverTimestamp(),
      };

      // Tambahkan subAgama hanya jika nomor poin adalah 4
      if (Number(nomor) === 4) {
        skuData.sub_agama = subAgama;
      }

      await addDoc(collection(db, "master_sku"), skuData);

      // AUTO-LOGGING (Audit Trail)
      await addDoc(collection(db, "logs"), {
        action: "Tambah Master SKU",
        adminName: user.displayName || "Admin",
        targetName: `SKU ${tingkat} No. ${nomor} ${Number(nomor) === 4 ? `(${subAgama})` : ""}`,
        reason: deskripsi.substring(0, 50) + "...",
        timestamp: serverTimestamp(),
      });

      setNomor("");
      setDeskripsi("");
      setSubAgama("");
      alert("Butir SKU berhasil ditambahkan!");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Fungsi Hapus Data dengan Logging
  const handleDelete = async (item) => {
    if (window.confirm(`Hapus butir SKU nomor ${item.nomor} secara permanen?`)) {
      try {
        await deleteDoc(doc(db, "master_sku", item.id));

        await addDoc(collection(db, "logs"), {
          action: "Hapus Master SKU",
          adminName: user?.displayName || "Admin",
          targetName: `SKU ${item.tingkat} No. ${item.nomor}`,
          reason: "Penghapusan butir kurikulum",
          timestamp: serverTimestamp(),
        });

      } catch (error) {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-slate-100">
        
        {/* HEADER */}
        <div className="bg-slate-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="flex items-center gap-5 relative z-10">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
            >
              <MdChevronLeft size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Master SKU</h1>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-2">Kurikulum Pangkalan</p>
            </div>
          </div>
        </div>

        {/* FORM INPUT */}
        <div className="px-6 -mt-8 relative z-20">
          <form onSubmit={handleAdd} className="bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                  <MdLayers /> Tingkatan
                </label>
                <select
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-blue-900 transition-all"
                >
                  <option value="Ramu">RAMU</option>
                  <option value="Rakit">RAKIT</option>
                  <option value="Terap">TERAP</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                  <MdAutoGraph /> Nomor
                </label>
                <input
                  type="number"
                  placeholder="No..."
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-blue-900 transition-all shadow-inner"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value)}
                />
              </div>
            </div>

            {/* BARIS KATEGORI & SUB-AGAMA (KONDISIONAL) */}
            <div className={`grid ${Number(nomor) === 4 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                  <MdStarOutline /> Kategori
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full p-4 bg-blue-50/50 rounded-2xl font-bold text-[10px] text-blue-900 outline-none border-2 border-blue-100 focus:border-blue-900 transition-all"
                >
                  <option value="SPIRITUAL">SPIRITUAL</option>
                  <option value="EMOSIONAL">EMOSIONAL</option>
                  <option value="SOSIAL">SOSIAL</option>
                  <option value="INTELEKTUAL">INTELEKTUAL</option>
                  <option value="FISIK">FISIK</option>
                </select>
              </div>

              {Number(nomor) === 4 && (
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1 text-red-600">
                    <MdOutlinePlace /> Khusus Agama
                  </label>
                  <select
                    value={subAgama}
                    onChange={(e) => setSubAgama(e.target.value)}
                    className="w-full p-4 bg-red-50/50 rounded-2xl font-bold text-[10px] text-red-900 outline-none border-2 border-red-100 focus:border-red-900 transition-all"
                    required
                  >
                    <option value="">Pilih Agama...</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                <MdDescription /> Deskripsi Butir SKU
              </label>
              <textarea
                placeholder="Tuliskan isi butir SKU..."
                className="w-full p-5 bg-slate-50 rounded-[2rem] font-bold text-[10px] outline-none border-2 border-transparent focus:border-blue-900 h-24 transition-all shadow-inner resize-none"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Processing..." : <><MdPlaylistAdd size={18} /> Simpan Butir</>}
            </button>
          </form>
        </div>

        {/* LIST VIEW */}
        <div className="flex-1 px-6 mt-8 pb-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Daftar SKU {tingkat}
            </h2>
            {loading && <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          <div className="space-y-3">
            {skuList.length === 0 && !loading ? (
              <div className="bg-slate-50 p-10 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100 opacity-50">
                <p className="text-[9px] font-black uppercase tracking-widest">Data Kosong</p>
              </div>
            ) : (
              skuList.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-[2rem] shadow-sm flex justify-between items-center gap-4 border border-slate-100 group hover:shadow-md transition-all">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center font-black text-blue-900 text-[10px] shadow-inner shrink-0">
                      {item.nomor}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                        {item.deskripsi}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">
                          {item.kategori}
                        </span>
                        {item.sub_agama && (
                          <span className="text-[7px] font-black text-red-500 uppercase tracking-widest border-l border-slate-200 pl-2">
                            Agama: {item.sub_agama}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2.5 bg-red-50 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 hover:bg-red-100 hover:text-red-600"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="p-8 text-center bg-slate-50 border-t border-slate-100 mt-auto">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em]">Laskar Bahari Curriculum Hub</p>
        </footer>

      </div>
    </div>
  );
}