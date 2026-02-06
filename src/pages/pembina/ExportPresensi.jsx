import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // Perbaikan: Impor autoTable secara eksplisit
import { useNavigate } from "react-router-dom";

// --- ICONS ---
import { 
  HiOutlineChevronLeft, 
  HiOutlineDocumentDownload, 
  HiOutlineClipboardList,
  HiOutlineFilter
} from "react-icons/hi";

export default function ExportPresensi() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const navigate = useNavigate();

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // 1. Ambil Data Anggota
      const q = query(collection(db, "users"), where("role", "==", "anggota"));
      const querySnapshot = await getDocs(q);
      
      const reportData = [];
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];

      // 2. Olah Data Log Kehadiran
      querySnapshot.docs.forEach((doc) => {
        const user = doc.data();
        const logs = user.attendanceLog || [];
        
        // Filter log berdasarkan bulan yang dipilih
        const monthlyLogs = logs.filter(log => {
          if (!log.timestamp) return false;
          const logDate = new Date(log.timestamp);
          return (logDate.getMonth() + 1) === parseInt(selectedMonth);
        });

        // Hitung statistik singkat berdasarkan kata kunci activity
        const hadir = monthlyLogs.filter(l => 
          l.activity?.toLowerCase().includes("presensi") || 
          l.activity?.toLowerCase().includes("hadir")
        ).length;
        
        const sakit = monthlyLogs.filter(l => 
          l.activity?.toLowerCase().includes("sakit")
        ).length;
        
        const izin = monthlyLogs.filter(l => 
          l.activity?.toLowerCase().includes("izin")
        ).length;

        reportData.push([
          user.nama ? user.nama.toUpperCase() : "IDENTITAS UNKNOWN",
          user.nta || "-",
          user.tingkat || "Laskar",
          hadir,
          sakit,
          izin,
          `${user.points || 0} XP`
        ]);
      });

      // 3. Inisialisasi jsPDF
      const docPDF = new jsPDF();
      
      // Header Dokumen
      docPDF.setFontSize(18);
      docPDF.text("LAPORAN REKAPITULASI PRESENSI", 14, 22);
      docPDF.setFontSize(11);
      docPDF.setTextColor(100);
      docPDF.text(`Pasukan Laskar Bahari - SMP Negeri 1 Biau`, 14, 30);
      docPDF.text(`Periode: ${monthNames[selectedMonth - 1]} 2026`, 14, 35);
      
      // Garis Pemisah
      docPDF.setLineWidth(0.5);
      docPDF.line(14, 40, 196, 40);

      // 4. Generate Tabel (Menggunakan autoTable sebagai fungsi)
      autoTable(docPDF, {
        startY: 45,
        head: [['NAMA LASKAR', 'NTA', 'TINGKAT', 'H', 'S', 'I', 'TOTAL XP']],
        body: reportData,
        theme: 'striped',
        headStyles: { fillGray: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50 },
          6: { fontStyle: 'bold', halign: 'right' }
        }
      });

      // 5. Simpan File
      docPDF.save(`Rekap_Presensi_${monthNames[selectedMonth - 1]}_2026.pdf`);
      
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Gagal menggenerate laporan: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 font-sans italic">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col border-x border-white/5 bg-[#020617]">
        
        {/* HEADER */}
        <header className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest leading-none">Intelligence Export</h1>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Rekapitulasi Data Laskar</p>
            </div>
          </div>
          <HiOutlineClipboardList size={22} className="text-slate-600" />
        </header>

        <main className="p-8 flex-1 flex flex-col">
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto text-blue-500 border border-blue-500/20">
              <HiOutlineDocumentDownload size={40} />
            </div>
            
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Export PDF System</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-2">Generate Dokumen Presensi Bulanan</p>
            </div>

            {/* FILTER BULAN */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 justify-center text-slate-500">
                <HiOutlineFilter size={14} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Pilih Periode</span>
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-center text-xs font-black text-white outline-none focus:border-blue-500 transition-all uppercase appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1).toLocaleString('id-ID', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGenerating}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-lg active:scale-95 ${
                isGenerating 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
              }`}
            >
              {isGenerating ? "Encrypting PDF..." : "Generate Intelligence Report"}
            </button>
          </div>

          <div className="mt-8 p-6 border border-dashed border-white/5 rounded-3xl opacity-40">
             <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed text-center">
               Sistem akan mengekstrak log dari database untuk menghitung kehadiran manual, sakit, dan izin secara otomatis berdasarkan algoritma filter tanggal.
             </p>
          </div>
        </main>

        <footer className="mt-auto py-8 text-center border-t border-white/5 mx-6">
           <p className="text-[8px] font-bold uppercase tracking-[0.5em]">NAVIGASI Data Processing Protocol</p>
        </footer>
      </div>
    </div>
  );
}