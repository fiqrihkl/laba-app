import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function StrukturOrganisasi() {
  const [pejabat, setPejabat] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const docId = "struktur_organisasi";

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setUserRole(snap.docs[0].data().role);
      }
    };
    checkRole();

    const unsub = onSnapshot(doc(db, "settings", docId), (snap) => {
      if (snap.exists()) setPejabat(snap.data());
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const canEdit = userRole === "admin" || userRole === "pembina";

  const handleUpdate = async (key, value) => {
    try {
      await updateDoc(doc(db, "settings", docId), {
        [`${key}.nama`]: value,
      });
    } catch (error) {
      console.error("Gagal update:", error);
    }
  };

  const LeaderCard = ({ label, id, color }) => (
    <div
      className={`p-5 rounded-[2rem] border-2 transition-all shadow-sm ${color === "blue" ? "bg-blue-50/30 border-blue-100" : color === "pink" ? "bg-pink-50/30 border-pink-100" : "bg-slate-50 border-slate-100"}`}>
      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        disabled={!canEdit}
        className={`w-full bg-transparent mt-1 p-2 font-black text-xs uppercase italic outline-none ${canEdit ? "focus:text-indigo-600 border-b border-transparent focus:border-indigo-600" : "text-slate-800"}`}
        value={pejabat[id]?.nama || ""}
        placeholder="Belum Ada Nama..."
        onChange={(e) => handleUpdate(id, e.target.value)}
      />
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-indigo-900 text-xs tracking-widest animate-pulse italic">
        LOADING ARCHIVE...
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-md min-h-screen flex flex-col relative">
        {/* HEADER */}
        <div className="pt-12 px-8 flex justify-between items-center mb-8">
          <Link
            to="/"
            className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 active:scale-90 transition">
            <img
              src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
              className="w-4 h-4"
              alt="back"
            />
          </Link>
          <div className="text-right">
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none text-indigo-900">
              Struktur
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
              Gudep 10.491-10.492
            </p>
          </div>
        </div>

        <div className="px-8 space-y-10">
          {/* TOP TIER: KAMABIGUS */}
          <section>
            <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 ml-2">
              Manajemen Atas
            </h2>
            <LeaderCard label="Kamabigus" id="kamabigus" color="slate" />
          </section>

          {/* SPLIT: SATUAN TERPISAH */}
          <div className="grid grid-cols-1 gap-12">
            {/* SATUAN PUTRA */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4 ml-2">
                <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/9070/9070381.png"
                    className="w-3 h-3 brightness-0 invert"
                    alt="pa"
                  />
                </div>
                <h2 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em]">
                  Satuan Putra
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <LeaderCard
                  label="Pembina Putra"
                  id="pembina_pa"
                  color="blue"
                />
                <LeaderCard
                  label="Pratama Putra"
                  id="pratama_pa"
                  color="blue"
                />
                <div className="grid grid-cols-2 gap-3">
                  <LeaderCard
                    label="Sekretaris PA"
                    id="sekretaris_pa"
                    color="blue"
                  />
                  <LeaderCard
                    label="Bendahara PA"
                    id="bendahara_pa"
                    color="blue"
                  />
                </div>
              </div>
            </section>

            {/* SATUAN PUTRI */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4 ml-2">
                <div className="w-5 h-5 bg-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-pink-200">
                  <img
                    src="https://cdn-icons-png.flaticon.com/128/9070/9070381.png"
                    className="w-3 h-3 brightness-0 invert"
                    alt="pi"
                  />
                </div>
                <h2 className="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em]">
                  Satuan Putri
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <LeaderCard
                  label="Pembina Putri"
                  id="pembina_pi"
                  color="pink"
                />
                <LeaderCard
                  label="Pratama Putri"
                  id="pratama_pi"
                  color="pink"
                />
                <div className="grid grid-cols-2 gap-3">
                  <LeaderCard
                    label="Sekretaris PI"
                    id="sekretaris_pi"
                    color="pink"
                  />
                  <LeaderCard
                    label="Bendahara PI"
                    id="bendahara_pi"
                    color="pink"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-20 py-10 text-center">
          {canEdit ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
              <p className="text-[8px] font-black text-indigo-600 uppercase italic">
                Auto-Save Mode Active
              </p>
            </div>
          ) : (
            <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] italic">
              Read Only Archive
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
