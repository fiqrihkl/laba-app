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
import { motion, AnimatePresence } from "framer-motion";

// IMPORT REACT ICONS
import { 
  HiOutlineChevronLeft, 
  HiOutlineTrash, 
  HiOutlinePlusCircle, 
  HiOutlineBookOpen, 
  HiOutlineViewGrid,
  HiOutlineStar,
  HiOutlineLibrary
} from "react-icons/hi";

export default function KelolaMasterSKU() {
  const [skuList, setSkuList] = useState([]);
  const [tingkat, setTingkat] = useState("Ramu");
  const [nomor, setNomor] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("SPIRITUAL"); 
  const [subAgama, setSubAgama] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nomor || !deskripsi) return alert("Lengkapi data butir SKU!");
    if (!user) return alert("Sesi habis. Silakan login kembali.");

    setIsSubmitting(true);
    try {
      const skuData = {
        tingkat: tingkat,
        nomor: Number(nomor),
        deskripsi: deskripsi.trim(),
        kategori: kategori,
        admin_uid: user.uid,
        createdAt: serverTimestamp(),
      };

      if (Number(nomor) === 4) {
        skuData.sub_agama = subAgama;
      }

      await addDoc(collection(db, "master_sku"), skuData);

      await addDoc(collection(db, "logs"), {
        action: "Tambah Master SKU",
        adminName: user.displayName || "Admin",
        targetName: `SKU ${tingkat} No. ${nomor}`,
        timestamp: serverTimestamp(),
      });

      setNomor("");
      setDeskripsi("");
      setSubAgama("");
      alert("Butir SKU berhasil ditambahkan!");
    } catch (error) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Hapus butir SKU nomor ${item.nomor} secara permanen?`)) {
      try {
        await deleteDoc(doc(db, "master_sku", item.id));
        await addDoc(collection(db, "logs"), {
          action: "Hapus Master SKU",
          adminName: user?.displayName || "Admin",
          targetName: `SKU ${item.tingkat} No. ${item.nomor}`,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        alert("Gagal menghapus.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic selection:bg-blue-900">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest">Master Kurikulum</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Pengaturan Butir SKU</p>
            </div>
          </div>
          <HiOutlineLibrary size={22} className="text-slate-700" />
        </header>

        {/* FORM INPUT */}
        <div className="p-6">
          <form onSubmit={handleAdd} className="bg-slate-900 border border-white/5 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Tingkatan</label>
                <select
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value)}
                  className="w-full p-3 bg-black border border-white/5 rounded-xl font-bold text-[10px] text-white outline-none focus:border-blue-500 transition-all"
                >
                  <option value="Ramu">RAMU</option>
                  <option value="Rakit">RAKIT</option>
                  <option value="Terap">TERAP</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Nomor Poin</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full p-3 bg-black border border-white/5 rounded-xl font-bold text-[10px] text-blue-400 outline-none focus:border-blue-500"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value)}
                />
              </div>
            </div>

            <div className={`grid ${Number(nomor) === 4 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Kategori Radar</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full p-3 bg-black border border-white/5 rounded-xl font-bold text-[10px] text-white outline-none focus:border-blue-500"
                >
                  <option value="SPIRITUAL">SPIRITUAL</option>
                  <option value="EMOSIONAL">EMOSIONAL</option>
                  <option value="SOSIAL">SOSIAL</option>
                  <option value="INTELEKTUAL">INTELEKTUAL</option>
                  <option value="FISIK">FISIK</option>
                </select>
              </div>

              {Number(nomor) === 4 && (
                <div>
                  <label className="text-[8px] font-bold text-red-500 uppercase tracking-widest ml-1 mb-1 block">Spesifik Agama</label>
                  <select
                    value={subAgama}
                    onChange={(e) => setSubAgama(e.target.value)}
                    className="w-full p-3 bg-red-950/20 border border-red-500/20 rounded-xl font-bold text-[10px] text-red-400 outline-none focus:border-red-500"
                    required
                  >
                    <option value="">Pilih...</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Deskripsi Tugas</label>
              <textarea
                placeholder="Isi butir SKU..."
                className="w-full p-4 bg-black border border-white/5 rounded-xl font-bold text-[11px] text-slate-300 outline-none focus:border-blue-500 h-24 resize-none italic"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? "Processing..." : <><HiOutlinePlusCircle size={18} /> Simpan Butir SKU</>}
            </button>
          </form>
        </div>

        {/* LIST VIEW */}
        <main className="px-6 flex-1 space-y-3 pb-10 overflow-y-auto custom-scroll">
          <div className="flex justify-between items-center px-1 mb-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Daftar SKU {tingkat} ({skuList.length})
            </h2>
            {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          <AnimatePresence mode="popLayout">
            {skuList.length === 0 && !loading ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-xl opacity-40">
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-600">Data Kurikulum Kosong</p>
              </div>
            ) : (
              skuList.map((item) => (
                <motion.div 
                  layout
                  key={item.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-white/5 p-4 rounded-xl flex justify-between items-start gap-4 group hover:border-blue-500/30 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-blue-400 text-xs border border-white/5 shrink-0">
                      {item.nomor}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-200 leading-relaxed italic">
                        "{item.deskripsi}"
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] font-bold text-blue-500 uppercase tracking-widest">
                          {item.kategori}
                        </span>
                        {item.sub_agama && (
                          <span className="text-[7px] font-bold text-red-500 uppercase tracking-widest border-l border-white/5 pl-2">
                            Agama: {item.sub_agama}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto py-8 text-center border-t border-white/5 mx-6 opacity-30">
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.5em]">Curriculum Database System v2.0</p>
        </footer>
      </div>
    </div>
  );
}