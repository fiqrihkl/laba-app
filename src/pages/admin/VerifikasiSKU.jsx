import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  addDoc
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function VerifikasiSKU() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTingkat, setFilterTingkat] = useState("Ramu");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Mengambil data pengajuan SKU yang berstatus 'pending' sesuai filter tingkatan
    const q = query(
      collection(db, "sku_progress"),
      where("status", "==", "pending"),
      where("tingkat", "==", filterTingkat),
      orderBy("tgl_pengajuan", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching SKU requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterTingkat]);

  const handleVerify = async (item) => {
    // Destruktur data termasuk deskripsi_poin untuk verifikasi yang lebih detail
    const { id, uid, nama_anggota, nomor_poin, tingkat, deskripsi_poin } = item;

    // Fix bug: Menggunakan nomor_poin (bukan nomorPoin) dan menambah konteks materi
    if (!window.confirm(`Luluskan Poin ${nomor_poin} (${deskripsi_poin.substring(0, 20)}...) untuk ${nama_anggota}?`)) return;

    setProcessingId(id);
    try {
      // 1. UPDATE DOKUMEN SKU_PROGRESS
      const docRef = doc(db, "sku_progress", id);
      await updateDoc(docRef, {
        status: "verified",
        verifikator_nama: auth.currentUser?.displayName || "Pembina",
        verifikator_id: auth.currentUser?.uid || "",
        tgl_verifikasi: serverTimestamp(),
      });

      // 2. UPDATE DOKUMEN USER ANGGOTA (Tambah XP & Catat History)
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        points: increment(50), 
        energy: increment(5), // Bonus energi tambahan untuk anggota
        attendanceLog: arrayUnion({
          timestamp: new Date().toISOString(),
          // Mencatat materi spesifik agar log anggota lebih informatif
          activity: `Lulus SKU ${tingkat} No.${nomor_poin}: ${deskripsi_poin.substring(0, 30)}...`,
          pointsEarned: 50,
          type: "SKU_VERIFICATION"
        })
      });

      // 3. AUTO-LOGGING (Audit Trail untuk Admin)
      await addDoc(collection(db, "logs"), {
        action: "Verifikasi SKU",
        adminName: auth.currentUser?.displayName || "Pembina",
        targetName: `${nama_anggota} - SKU ${tingkat} No.${nomor_poin}`,
        reason: `Materi: ${deskripsi_poin}`,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error("Gagal verifikasi:", error);
      alert("Terjadi kesalahan saat verifikasi sistem radar.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] relative text-white shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <Link 
              to="/pembina" 
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/271/271220.png" className="w-4 h-4 brightness-0 invert" alt="back" />
            </Link>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Verifikasi SKU</h1>
              <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.3em] mt-1">Otoritas Pengujian Bahari</p>
            </div>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-3xl p-2 shadow-xl border border-slate-100 flex gap-2">
            {["Ramu", "Rakit", "Terap"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTingkat(t)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterTingkat === t 
                  ? "bg-blue-900 text-white shadow-lg" 
                  : "bg-slate-50 text-slate-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="px-6 mt-8 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-20 animate-pulse font-black text-slate-300 uppercase text-[10px] tracking-widest">
              Memantau Radar Antrean...
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100 flex flex-col items-center">
              <img src="https://cdn-icons-png.flaticon.com/128/7486/7486744.png" className="w-10 h-10 opacity-20 mb-4" alt="empty" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-relaxed">
                Radar Bersih. <br /> Tingkat {filterTingkat} Belum Ada Laporan.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-10">
              {requests.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-slate-50 hover:border-blue-200 transition-all animate-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-900 text-xs shadow-inner border border-blue-100">
                        {item.nomor_poin}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase italic leading-none">
                          {item.nama_anggota}
                        </h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          {item.tgl_pengajuan?.toDate().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleVerify(item)}
                      disabled={processingId === item.id}
                      className="bg-green-500 text-white p-3 rounded-2xl shadow-lg shadow-green-500/30 active:scale-90 transition-all disabled:opacity-50"
                    >
                      {processingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <img src="https://cdn-icons-png.flaticon.com/128/4436/4436481.png" className="w-4 h-4 invert" alt="check" />
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner group">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block">Materi Uji:</span>
                        <span className="text-[7px] font-black text-blue-500 uppercase">{item.kategori}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed italic group-hover:text-blue-900 transition-colors">
                      "{item.deskripsi_poin}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-auto py-8 text-center bg-white border-t border-slate-50">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">
            Laskar Bahari Examiner System — v1.2
          </p>
        </footer>
      </div>
    </div>
  );
}