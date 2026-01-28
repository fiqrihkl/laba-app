import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  HiOutlineChevronLeft, 
  HiOutlineTemplate, 
  HiOutlineSpeakerphone, 
  HiOutlineDatabase, 
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineChartPie,
  HiOutlineDocumentDownload,
  HiOutlineShieldCheck 
} from "react-icons/hi";

export default function AdminHub({ role }) {
  const navigate = useNavigate();

  // Daftar semua menu yang ada di sistem
  const allMenus = [
    {
      name: "Layout KTA Digital",
      desc: "Atur template & desain kartu anggota",
      path: "/admin/kta-editor",
      icon: <HiOutlineTemplate className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-50",
      onlyAdmin: true // Menu khusus Admin
    },
    {
      name: "Kelola Informasi",
      desc: "Buat, edit, & hapus pengumuman broadcast",
      path: "/admin/pengumuman",
      icon: <HiOutlineSpeakerphone className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-50",
      onlyAdmin: false
    },
    {
      name: "Master Data SKU",
      desc: "Update poin kurikulum SKU",
      path: "/admin/master-sku",
      icon: <HiOutlineDatabase className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-50",
      onlyAdmin: false
    },
    {
      name: "Struktur Organisasi",
      desc: "Update pengurus Gudep",
      path: "/admin/struktur",
      icon: <HiOutlineUserGroup className="w-6 h-6 text-green-600" />,
      bg: "bg-green-50",
      onlyAdmin: false
    },
    {
      name: "Riwayat Presensi",
      desc: "Rekapitulasi kehadiran anggota",
      path: "/pembina/riwayat",
      icon: <HiOutlineClipboardList className="w-6 h-6 text-indigo-600" />,
      bg: "bg-indigo-50",
      onlyAdmin: false
    },
    {
      name: "Statistik Capaian SKU",
      desc: "Lihat grafik sebaran tingkatan anggota",
      path: "/pembina/statistik-sku",
      icon: <HiOutlineChartPie className="w-6 h-6 text-red-600" />,
      bg: "bg-red-50",
      onlyAdmin: false
    },
    {
      name: "Cetak Laporan Presensi",
      desc: "Format tabel siap cetak/unduh PDF",
      path: "/pembina/export-presensi",
      icon: <HiOutlineDocumentDownload className="w-6 h-6 text-emerald-600" />,
      bg: "bg-emerald-50",
      onlyAdmin: false
    },
    {
      name: "Audit Trail Logs",
      desc: "Pantau riwayat aktivitas admin & pembina",
      path: "/admin/logs",
      icon: <HiOutlineShieldCheck className="w-6 h-6 text-slate-600" />,
      bg: "bg-slate-100",
      onlyAdmin: true // Menu khusus Admin
    },
  ];

  // Memfilter menu berdasarkan role pengguna yang sedang aktif
  const filteredMenus = role === "admin" 
    ? allMenus 
    : allMenus.filter(menu => !menu.onlyAdmin);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 italic font-medium">
      {/* HEADER */}
      <div className="bg-slate-900 pt-12 pb-16 px-8 rounded-b-[3.5rem] text-white relative shadow-xl">
        <div className="flex items-center gap-5 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
          >
            <HiOutlineChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Pusat Administrasi</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">System Management Hub</p>
          </div>
        </div>
      </div>

      {/* MENU LIST (Sudah Terfilter) */}
      <div className="px-6 -mt-8 relative z-20 space-y-4">
        {filteredMenus.map((menu, index) => (
          <Link 
            key={index} 
            to={menu.path}
            className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 active:scale-95 transition-all group"
          >
            <div className={`w-14 h-14 ${menu.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6`}>
              {menu.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">{menu.name}</h3>
              <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">{menu.desc}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
               <HiOutlineChevronLeft className="w-3 h-3 text-slate-300 rotate-180" />
            </div>
          </Link>
        ))}
      </div>

      {/* FOOTER INFO */}
      <div className="mt-12 px-12 text-center opacity-20">
        <HiOutlineDatabase className="w-12 h-12 mx-auto mb-2" />
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">
          Otoritas Pembina & Admin Diperlukan <br /> Untuk Mengubah Data Master
        </p>
      </div>
    </div>
  );
}