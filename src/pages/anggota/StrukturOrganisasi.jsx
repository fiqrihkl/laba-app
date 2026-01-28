import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function StrukturOrganisasi() {
  const [struktur, setStruktur] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isEditing, setIsEditing] = useState(null); // Menyimpan ID jabatan yang sedang diedit
  const [newName, setNewName] = useState("");

  useEffect(() => {
    // 1. Ambil Role User untuk proteksi tombol Edit
    const checkRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setUserRole(snap.docs[0].data().role);
      }
    };
    checkRole();

    // 2. Ambil Data Struktur secara Real-time
    const unsub = onSnapshot(
      doc(db, "settings", "struktur_organisasi"),
      (snap) => {
        if (snap.exists()) {
          setStruktur(snap.data());
        }
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const handleUpdate = async (key) => {
    try {
      const docRef = doc(db, "settings", "struktur_organisasi");
      await updateDoc(docRef, {
        [`${key}.nama`]: newName,
      });
      setIsEditing(null);
      setNewName("");
    } catch (error) {
      alert("Gagal memperbarui data.");
    }
  };

  // Komponen Kartu Pejabat
  const NodeCard = ({ title, data, id }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white border-2 border-slate-100 p-4 rounded-[2rem] shadow-xl w-44 flex flex-col items-center relative group hover:border-blue-900 transition-all duration-500">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl mb-3 flex items-center justify-center border border-blue-100 shadow-inner">
          <img
            src="https://cdn-icons-png.flaticon.com/128/1077/1077063.png"
            className="w-6 h-6 opacity-40"
            alt="icon"
          />
        </div>
        <p className="text-[7px] font-black uppercase text-blue-900 tracking-[0.2em] mb-1">
          {title}
        </p>

        {isEditing === id ? (
          <div className="flex flex-col gap-2 w-full">
            <input
              autoFocus
              className="text-[10px] font-bold border-b border-blue-900 outline-none text-center"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              onClick={() => handleUpdate(id)}
              className="text-[8px] bg-blue-900 text-white py-1 rounded-lg">
              Simpan
            </button>
          </div>
        ) : (
          <h3 className="text-[10px] font-black uppercase text-slate-800 text-center leading-tight">
            {data?.nama || "Belum Diatur"}
          </h3>
        )}

        {/* Tombol Edit hanya untuk Admin */}
        {userRole === "admin" && isEditing !== id && (
          <button
            onClick={() => {
              setIsEditing(id);
              setNewName(data?.nama || "");
            }}
            className="absolute -top-2 -right-2 bg-slate-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <img
              src="https://cdn-icons-png.flaticon.com/128/1828/1828911.png"
              className="w-2 h-2 brightness-0 invert"
              alt="edit"
            />
          </button>
        )}
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center italic font-black text-blue-900 animate-pulse text-xs uppercase tracking-widest">
        Memuat Bagan Struktur...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-24 italic">
      {/* HEADER */}
      <div className="w-full max-w-4xl pt-10 px-8 flex justify-between items-center mb-16">
        <Link
          to={userRole === "admin" ? "/admin" : "/pembina"}
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100">
          <img
            src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
            className="w-4 h-4"
            alt="back"
          />
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-black uppercase tracking-[0.4em] text-blue-900">
            Struktur Organisasi
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
            Laskar Bahari SMPN 1 BIAU
          </p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* VISUAL CHART AREA */}
      <div className="w-full overflow-x-auto pb-10 px-4">
        <div className="min-w-[600px] flex flex-col items-center">
          {/* LEVEL 1: KAMABIGUS */}
          <NodeCard
            title="Kamabigus"
            data={struktur.kamabigus}
            id="kamabigus"
          />

          {/* Vertical Line */}
          <div className="h-10 w-0.5 bg-slate-200"></div>

          {/* LEVEL 2: PEMBINA (Horizontal Branch) */}
          <div className="relative flex flex-col items-center">
            {/* Horizontal Connector Line */}
            <div className="absolute top-0 w-[300px] h-0.5 bg-slate-200"></div>

            <div className="flex gap-32 relative">
              {/* Line connectors to children */}
              <div className="absolute -top-0 left-1/2 -translate-x-[150px] h-5 w-0.5 bg-slate-200"></div>
              <div className="absolute -top-0 right-1/2 translate-x-[150px] h-5 w-0.5 bg-slate-200"></div>

              <NodeCard
                title="Pembina Satuan Putra"
                data={struktur.pembina_pa}
                id="pembina_pa"
              />
              <NodeCard
                title="Pembina Satuan Putri"
                data={struktur.pembina_pi}
                id="pembina_pi"
              />
            </div>
          </div>

          <div className="h-10 w-0.5 bg-slate-200"></div>

          {/* LEVEL 3: PEMIMPIN REGU / PRATAMA */}
          <div className="relative flex flex-col items-center">
            <div className="absolute top-0 w-[300px] h-0.5 bg-slate-200"></div>
            <div className="flex gap-32 relative">
              <div className="absolute -top-0 left-1/2 -translate-x-[150px] h-5 w-0.5 bg-slate-200"></div>
              <div className="absolute -top-0 right-1/2 translate-x-[150px] h-5 w-0.5 bg-slate-200"></div>

              <NodeCard
                title="Pratama Putra"
                data={struktur.pratama_pa}
                id="pratama_pa"
              />
              <NodeCard
                title="Pratama Putri"
                data={struktur.pratama_pi}
                id="pratama_pi"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-10 px-8 text-center max-w-xs">
        <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
          Bagan ini disinkronkan secara otomatis dengan pangkalan data Gudep
          10.491-10.492.
        </p>
      </div>
    </div>
  );
}
