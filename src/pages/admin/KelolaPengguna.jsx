import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function KelolaPengguna() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserNTA, setNewUserNTA] = useState("");
  const [newUserRole, setNewUserRole] = useState("anggota");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("nama", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const userData = [];
      snap.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserNTA) return alert("Nama dan NTA wajib diisi!");

    const activationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    try {
      // Buat referensi dokumen menggunakan Activation Code sebagai ID
      const userRef = doc(db, "users", activationCode);

      const userData = {
        nama: newUserName.trim(),
        nta: newUserNTA.trim(),
        role: newUserRole,
        points: 0,
        level: 1,
        isClaimed: false, // Penting untuk sistem aktivasi mandiri
        ktaStatus: "belum_lengkap",
        ktaPhotoURL: "",
        agama: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        jabatan: newUserRole === "pembina" ? "Pembina Gudep" : "Anggota Laskar",
        tingkat: newUserRole === "pembina" ? "Pembina Dewasa" : "Calon Anggota",
        kwarran: "Biau",
        kwarcab: "Buol",
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, userData);

      alert(
        `BERHASIL!\n\nNama: ${newUserName}\nKode Aktivasi: ${activationCode}\n\nBerikan kode ini kepada ybs.`,
      );

      setShowAddModal(false);
      setNewUserName("");
      setNewUserNTA("");
    } catch (error) {
      console.error("Firebase Error:", error);
      alert("Gagal menyimpan ke database. Error: " + error.message);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "pembina" ? "anggota" : "pembina";
    if (window.confirm(`Ubah peran menjadi ${newRole.toUpperCase()}?`)) {
      try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
      } catch (error) {
        alert("Gagal mengubah role.");
      }
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Hapus pengguna permanen?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        alert("Gagal menghapus.");
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 text-slate-900 italic font-medium">
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 pt-10 pb-16 px-8 rounded-b-[4rem] relative text-white">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-5">
              <Link
                to="/admin"
                className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <img
                  src="https://cdn-icons-png.flaticon.com/128/271/271220.png"
                  className="w-4 h-4 invert"
                  alt="back"
                />
              </Link>
              <div>
                <h1 className="text-xs font-black uppercase opacity-70">
                  User Management
                </h1>
                <p className="text-blue-300 text-[10px] font-bold uppercase mt-1">
                  Gudep 10.491-10.492 SMPN 1 Biau
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white text-[9px] font-black px-6 py-3.5 rounded-2xl uppercase shadow-xl">
              Registrasi Anggota
            </button>
          </div>
        </div>

        <div className="px-8 -mt-8 relative z-20">
          <div className="bg-white rounded-[2.5rem] p-2 shadow-2xl border flex items-center group transition-all">
            <div className="pl-6 opacity-30">
              <img
                src="https://cdn-icons-png.flaticon.com/128/622/622669.png"
                className="w-4 h-4"
                alt="search"
              />
            </div>
            <input
              type="text"
              placeholder="Cari Nama atau Kode..."
              className="w-full bg-transparent border-none p-4 text-sm font-bold outline-none italic"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 px-8 mt-10">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">
            Data Terverifikasi ({filteredUsers.length})
          </h2>
          <div className="space-y-5 pb-20">
            {loading ? (
              <div className="py-20 text-center animate-pulse">Loading...</div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white border p-6 rounded-[3rem] shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6 group">
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-xl font-black border ${u.role === "pembina" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-900 border-blue-100"}`}>
                      {u.nama?.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm uppercase">
                        {u.nama}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded-md italic">
                          NTA: {u.nta}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${u.isClaimed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {u.isClaimed ? "AKTIF" : `KODE: ${u.id}`}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${u.role === "pembina" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all">
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/1828/1828414.png"
                        className="w-4 h-4 opacity-40"
                        alt="edit"
                      />
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-red-50 transition-all">
                      <img
                        src="https://cdn-icons-png.flaticon.com/128/3221/3221803.png"
                        className="w-4 h-4 opacity-40"
                        alt="del"
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 italic font-medium">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-10 text-center text-white relative">
                <h2 className="text-2xl font-black uppercase italic leading-none">
                  Anggota Baru
                </h2>
                <p className="text-[9px] opacity-60 font-bold uppercase mt-3 tracking-[0.3em]">
                  Master Database Entry
                </p>
              </div>
              <form onSubmit={handleAddUser} className="p-10 space-y-6">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Contoh: Muhammad Fikri"
                    className="w-full bg-slate-50 border-2 rounded-2xl p-4 mt-2 font-bold outline-none focus:border-blue-900 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    NTA Resmi
                  </label>
                  <input
                    type="text"
                    value={newUserNTA}
                    onChange={(e) => setNewUserNTA(e.target.value)}
                    placeholder="Input NTA Gudep"
                    className="w-full bg-slate-50 border-2 rounded-2xl p-4 mt-2 font-bold text-blue-900 outline-none focus:border-blue-900 transition-all italic"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Otoritas Akun
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-50 border-2 rounded-2xl p-4 mt-2 font-black text-slate-800 outline-none italic">
                    <option value="anggota">ANGGOTA (SISWA)</option>
                    <option value="pembina">PEMBINA (GURU)</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 font-black text-slate-300 uppercase text-[10px] tracking-widest">
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-slate-900 text-white font-black py-5 rounded-2xl text-[10px] uppercase shadow-xl active:scale-95 transition-all italic">
                    Generate Kode
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
