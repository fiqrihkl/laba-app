import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

// IMPORT REACT ICONS - Perbaikan HiQrCode menjadi HiQrcode
import { 
  HiHome, 
  HiAcademicCap, 
  HiBell, 
  HiUser, 
  HiQrcode, 
  HiShieldCheck, 
  HiOutlineLogout,
  HiClipboardCheck
} from "react-icons/hi";

export default function Navbar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Keluar dari Laskar Bahari?")) {
      signOut(auth);
      navigate("/");
    }
  };

  // --- KONFIGURASI MENU MINIMALIS BERDASARKAN ROLE ---
  const menuConfig = {
    admin: [
      {
        name: "Home",
        path: "/admin",
        icon: <HiHome className="w-6 h-6" />,
      },
      {
        name: "Verif", // Hub untuk Verif Tingkat & Master SKU
        path: "/admin/verifikasi-tingkat",
        icon: <HiClipboardCheck className="w-6 h-6" />,
      },
      {
        name: "SFH", // Hub Investigasi
        path: "/admin/investigasi-sfh",
        icon: <HiShieldCheck className="w-6 h-6" />,
      },
      {
        name: "Profil",
        path: "/profile",
        icon: <HiUser className="w-6 h-6" />,
      },
    ],
    pembina: [
      {
        name: "Home",
        path: "/pembina",
        icon: <HiHome className="w-6 h-6" />,
      },
      {
        name: "Scan",
        path: "/pembina/scanner",
        icon: <HiQrcode className="w-6 h-6" />,
      },
      {
        name: "Ujian", // Hub Verifikasi SKU & SOS
        path: "/pembina/verifikasi-sku",
        icon: <HiAcademicCap className="w-6 h-6" />,
      },
      {
        name: "Profil",
        path: "/profile",
        icon: <HiUser className="w-6 h-6" />,
      },
    ],
    anggota: [
      {
        name: "Home",
        path: "/anggota",
        icon: <HiHome className="w-6 h-6" />,
      },
      {
        name: "SKU",
        path: "/sku",
        icon: <HiAcademicCap className="w-6 h-6" />,
      },
      {
        name: "Notif",
        path: "/riwayat-status",
        icon: <HiBell className="w-6 h-6" />,
      },
      {
        name: "Profil",
        path: "/profile",
        icon: <HiUser className="w-6 h-6" />,
      },
    ],
  };

  const activeMenu = menuConfig[role] || [];

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/40 rounded-[2.5rem] px-6 py-3 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:top-0 md:bottom-auto md:left-0 md:right-0 md:rounded-none italic">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex justify-around items-center w-full md:w-auto md:gap-12">
          {activeMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 group relative transition-all"
              >
                <div className={`transition-all duration-300 ${
                    isActive
                      ? "text-blue-900 scale-110 drop-shadow-[0_0_8px_rgba(30,58,138,0.3)]"
                      : "text-slate-300 group-hover:text-blue-400"
                  }`}>
                  {item.icon}
                </div>
                
                <span
                  className={`text-[7px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    isActive ? "text-blue-900" : "text-slate-300"
                  }`}
                >
                  {item.name}
                </span>

                {isActive && (
                  <div className="absolute -bottom-1.5 w-1 h-1 bg-blue-900 rounded-full"></div>
                )}
              </Link>
            );
          })}

          {/* BUTTON LOGOUT MINIMALIS */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-500 transition-all active:scale-90 group"
          >
            <HiOutlineLogout className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="text-[7px] font-black uppercase tracking-widest text-red-500">
              Exit
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}