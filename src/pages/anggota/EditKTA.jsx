import React, { useRef } from "react";
import { HiOutlineCamera, HiOutlineInformationCircle } from "react-icons/hi";
import { motion } from "framer-motion";

export default function EditKTA({ editForm, setEditForm, onPhotoChange, photoPreview, isSaving, onSubmit }) {
  const fileInputRef = useRef(null);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full lg:w-[450px] shrink-0 bg-slate-900/80 border border-white/10 rounded-[3rem] p-8 shadow-3xl backdrop-blur-3xl mb-10 lg:mb-0"
    >
      <form onSubmit={onSubmit} className="space-y-5 text-[11px] font-semibold">
        {/* INFO HEADER */}
        <div className="px-2 border-l-4 border-red-600">
          <p className="text-red-500 uppercase tracking-[0.2em] text-[9px] font-bold">Official Update</p>
          <h3 className="text-white text-lg uppercase tracking-tight font-bold">Penyuntingan Identitas</h3>
        </div>

        {/* UPDATE FOTO DENGAN PREVIEW */}
        <div className="bg-white/5 p-6 rounded-3xl border-2 border-dashed border-white/10 text-center hover:border-red-500/40 transition-all group relative overflow-hidden">
          {photoPreview && (
            <div className="absolute inset-0 opacity-30">
              <img src={photoPreview} alt="prev" className="w-full h-full object-cover blur-[2px]" />
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onPhotoChange} 
          />
          <button 
            type="button" 
            disabled={isSaving}
            onClick={() => fileInputRef.current.click()} 
            className="relative z-10 flex flex-col items-center gap-2 mx-auto text-red-500 hover:text-red-400 transition-colors"
          >
            <div className="w-14 h-14 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
              <HiOutlineCamera size={28} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="tracking-widest uppercase font-bold text-[9px]">Ganti Pas Foto</span>
          </button>
        </div>

        {/* INFO KETENTUAN FOTO */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-3">
          <HiOutlineInformationCircle className="text-blue-500 shrink-0" size={18} />
          <div className="text-[9px] text-slate-300 leading-relaxed uppercase tracking-wider">
            <span className="text-blue-400 font-bold block mb-1">Ketentuan Pas Foto:</span>
            Rasio 2:3 atau 3:4, Seragam Pramuka Lengkap, Latar Belakang Merah (Formal).
          </div>
        </div>

        {/* INPUT NAMA LENGKAP */}
        <div className="space-y-2">
          <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Nama Lengkap (Sesuai Ijazah)</label>
          <input 
            type="text" 
            required
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 transition-all uppercase placeholder:text-slate-700 font-bold" 
            value={editForm.nama || ""} 
            onChange={(e) => setEditForm({...editForm, nama: e.target.value})} 
          />
        </div>

        {/* TTL SECTION */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Kota Lahir</label>
            <input 
              type="text" 
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 uppercase font-bold" 
              value={editForm.tempat_lahir || ""} 
              onChange={(e) => setEditForm({...editForm, tempat_lahir: e.target.value})}
            />
          </div>
          <div className="space-y-2 font-sans">
            <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Tgl Lahir</label>
            <input 
              type="date" 
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 font-bold appearance-none" 
              value={editForm.tanggal_lahir || ""} 
              onChange={(e) => setEditForm({...editForm, tanggal_lahir: e.target.value})}
            />
          </div>
        </div>

        {/* AGAMA & JABATAN */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Agama</label>
            <input 
              type="text" 
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 uppercase font-bold" 
              value={editForm.agama || ""} 
              onChange={(e) => setEditForm({...editForm, agama: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Jabatan</label>
            <input 
              type="text" 
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 uppercase font-bold" 
              value={editForm.jabatan || ""} 
              onChange={(e) => setEditForm({...editForm, jabatan: e.target.value})}
            />
          </div>
        </div>

        {/* KWARRAN & KWARCAB */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Kwarran</label>
            <input 
              type="text" 
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 uppercase font-bold" 
              value={editForm.kwarran || ""} 
              onChange={(e) => setEditForm({...editForm, kwarran: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold">Kwarcab</label>
            <input 
              type="text" 
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-red-600 uppercase font-bold" 
              value={editForm.kwarcab || ""} 
              onChange={(e) => setEditForm({...editForm, kwarcab: e.target.value})}
            />
          </div>
        </div>

        {/* TINGKATAN (READ ONLY / INFO) */}
        <div className="space-y-2 opacity-60">
          <label className="text-slate-500 ml-2 uppercase tracking-widest font-bold italic">Tingkatan SKU (Sistem Validasi)</label>
          <div className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 font-bold uppercase cursor-not-allowed">
            {editForm.tingkat || "-"}
          </div>
        </div>

        {/* TOMBOL AKSI */}
        <button 
          type="submit" 
          disabled={isSaving} 
          className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-5 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-wait"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Sinkronisasi Data...</span>
            </div>
          ) : "Simpan Perubahan"}
        </button>
      </form>
    </motion.div>
  );
}