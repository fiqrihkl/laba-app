import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function TombolSOS({ userProfile }) {
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    // 1. Konfirmasi sederhana (mencegah salah pencet)
    const yakin = window.confirm("KIRIM SINYAL DARURAT SEKARANG?");
    if (!yakin) return;

    setLoading(true);

    // 2. Ambil Lokasi GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          try {
            // 3. Simpan ke Firestore
            await addDoc(collection(db, "emergency_calls"), {
              uid: auth.currentUser.uid,
              nama: userProfile?.nama || "Anggota Tanpa Nama",
              nomor_hp: userProfile?.no_hp || "-",
              lokasi: {
                lat,
                lng,
                mapUrl,
              },
              status: "active",
              tgl_darurat: serverTimestamp(),
            });

            alert("SINYAL SOS TERKIRIM! Tetap tenang, Pembina sedang menuju lokasi Anda.");
          } catch (error) {
            alert("Gagal mengirim sinyal: " + error.message);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setLoading(false);
          alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLoading(false);
      alert("Browser/HP Anda tidak mendukung GPS.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] shadow-2xl border border-red-50">
      <div className="text-center mb-4">
        <h2 className="text-red-600 font-black uppercase text-xs tracking-widest italic">Emergency System</h2>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Tekan jika dalam bahaya fisik</p>
      </div>

      <button
        onClick={handleSOS}
        disabled={loading}
        className={`w-32 h-32 rounded-full border-[8px] border-red-100 flex items-center justify-center shadow-xl shadow-red-200 active:scale-90 transition-all ${
          loading ? "bg-slate-400" : "bg-red-600"
        }`}
      >
        <div className="text-white text-center">
          <span className="block text-2xl font-black tracking-tighter">SOS</span>
          <span className="text-[8px] font-bold uppercase tracking-widest">
            {loading ? "Sending..." : "Pencet"}
          </span>
        </div>
      </button>

      <p className="mt-4 text-[8px] text-red-400 font-black uppercase animate-pulse">
        Sinyal & Lokasi GPS akan dikirim ke semua Pembina
      </p>
    </div>
  );
}