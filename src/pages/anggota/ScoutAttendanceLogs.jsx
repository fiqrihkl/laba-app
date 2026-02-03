import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineClipboardCheck,
  HiOutlineInformationCircle,
  HiOutlineXCircle,
  HiOutlinePlusCircle,
  HiOutlineExclamationCircle
} from "react-icons/hi";

function ScoutAttendanceLogs({ attendanceLog = [] }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // KONFIGURASI JADWAL
  const HARI_LATIHAN_RUTIN = 5; // Jumat
  const TARGET_LATIHAN_SETAHUN = 48;
  const LABEL_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const LABEL_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  // Filter log presensi
  const filteredLogs = useMemo(() => {
    return (attendanceLog || []).filter(log => 
      log.type === "PRESENSI" || log.type === "IZIN" || log.type === "SAKIT"
    );
  }, [attendanceLog]);

  const { heatmapData, monthLabels } = useMemo(() => {
    const year = new Date().getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const startOffset = firstDayOfYear.getDay(); 
    const startDate = new Date(year, 0, 1 - startOffset);
    
    const today = new Date();
    const days = [];
    const months = [];
    
    const logMap = {};
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toLocaleDateString('en-CA');
      logMap[dateKey] = log;
    });

    let lastMonthSeen = -1;

    for (let i = 0; i < 53 * 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toLocaleDateString('en-CA');
      
      const isPast = currentDate < today;
      const isHariJumat = currentDate.getDay() === HARI_LATIHAN_RUTIN;
      const isSameYear = currentDate.getFullYear() === year;

      // Label Bulan (Hanya muncul di hari Minggu)
      const monthIndex = currentDate.getMonth();
      if (isSameYear && monthIndex !== lastMonthSeen && currentDate.getDay() === 0) {
        lastMonthSeen = monthIndex;
        months.push({ 
          name: LABEL_BULAN[monthIndex], 
          columnIndex: Math.floor(i / 7) 
        });
      }

      let status = "kosong"; 
      if (isSameYear) {
        const log = logMap[dateKey];
        if (log) {
          if (log.type === "PRESENSI") status = "hadir";
          else if (log.type === "IZIN") status = "izin";
          else if (log.type === "SAKIT") status = "sakit";
        } else if (isPast && isHariJumat) {
          status = "alpa";
        }
      }

      days.push({
        date: currentDate,
        dateKey,
        status,
        isSameYear,
        data: logMap[dateKey] || null,
        isTambahan: !isHariJumat && logMap[dateKey] && logMap[dateKey].type === "PRESENSI"
      });
    }
    return { heatmapData: days, monthLabels: months };
  }, [filteredLogs]);

  const stats = useMemo(() => {
    const totalHadir = filteredLogs.filter(l => l.type === "PRESENSI").length;
    const totalPoints = filteredLogs.reduce((acc, log) => acc + (log.pointsEarned || 0), 0);
    const persentase = Math.min(Math.round((totalHadir / TARGET_LATIHAN_SETAHUN) * 100), 100);
    return { totalHadir, totalPoints, persentase };
  }, [filteredLogs]);

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.persentase / 100) * circumference;

  return (
    <div className="space-y-6 mt-6 italic">
      {/* STATS CARD */}
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[3rem] shadow-inner flex items-center justify-between">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
            <motion.circle 
              cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              className="text-emerald-500" 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-black text-white leading-none">{stats.persentase}%</span>
            <span className="text-[6px] text-slate-500 font-black uppercase">Hadir</span>
          </div>
        </div>
        <div className="flex-1 ml-6 space-y-3">
          <div className="flex items-center justify-between font-black">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Poin Latihan</span>
            <span className="text-sm text-yellow-500">+{stats.totalPoints} XP</span>
          </div>
          <div className="flex items-center justify-between font-black">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Sesi Diikuti</span>
            <span className="text-sm text-white">{stats.totalHadir} Hari</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${stats.persentase}%` }} className="h-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* RADAR PRESENSI */}
      <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-3xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Radar Presensi</h3>
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-2 text-[6px] font-bold uppercase text-slate-500 max-w-[150px]">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Hadir</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Izin</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-orange-500 rounded-sm"></div> Sakit</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-sm"></div> Alpa</div>
          </div>
        </div>

        <div className="flex overflow-hidden">
          {/* LABEL HARI */}
          <div className="grid grid-rows-7 gap-1.5 mt-[22px] pr-4 border-r border-white/5">
            {LABEL_HARI.map((h, i) => (
              <span key={i} className="text-[7px] font-black text-slate-700 uppercase h-[12px] flex items-center justify-end leading-none">
                {h}
              </span>
            ))}
          </div>

          {/* HEATMAP AREA */}
          <div className="flex-1 overflow-x-auto scrollbar-hide pl-4">
            <div className="min-w-max">
              {/* LABEL BULAN */}
              <div className="relative h-4 mb-1.5">
                {monthLabels.map((m, i) => (
                  <span 
                    key={i} 
                    className="absolute text-[7px] font-black text-slate-600 uppercase"
                    style={{ left: `${m.columnIndex * 13.5}px` }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>

              {/* KOTAK-KOTAK HEATMAP */}
              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {heatmapData.map((day, idx) => (
                  <motion.div
                    key={idx}
                    onClick={() => day.isSameYear && setSelectedDay(day)}
                    className={`w-[12px] h-[12px] rounded-[2px] cursor-pointer transition-all ${
                      !day.isSameYear ? 'opacity-0' :
                      day.status === "hadir" ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                      day.status === "izin" ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' :
                      day.status === "sakit" ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' :
                      day.status === "alpa" ? 'bg-red-500' :
                      'bg-white/5 hover:bg-white/10'
                    } ${day.isTambahan ? 'ring-1 ring-yellow-500' : ''}`}
                    whileHover={day.isSameYear ? { scale: 1.2 } : {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* DETAIL BOX */}
        <div className="h-20 flex items-center justify-center border-t border-white/5 mt-6">
          <AnimatePresence mode="wait">
            {selectedDay ? (
              <motion.div 
                key={selectedDay.dateKey}
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <span className="text-[8px] text-slate-500 font-black uppercase mb-1.5 tracking-widest">
                  {new Date(selectedDay.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                
                {selectedDay.status === "hadir" ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase">
                      <HiOutlineClipboardCheck size={14} /> {selectedDay.data.activity}
                    </div>
                    <span className="text-[9px] font-bold text-yellow-500">+{selectedDay.data.pointsEarned} XP</span>
                  </div>
                ) : selectedDay.status === "izin" ? (
                  <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase">
                    <HiOutlinePlusCircle size={14} /> Izin (Tercatat)
                  </div>
                ) : selectedDay.status === "sakit" ? (
                  <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] uppercase">
                    <HiOutlineExclamationCircle size={14} /> Sakit (Tercatat)
                  </div>
                ) : selectedDay.status === "alpa" ? (
                  <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase">
                    <HiOutlineXCircle size={14} /> Alpha (Tidak Hadir)
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-600 font-black uppercase italic tracking-widest">Bukan Hari Latihan</span>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 text-slate-700 animate-pulse">
                 <HiOutlineInformationCircle size={16} />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em]">Sentuh kotak untuk detail</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
}

export default ScoutAttendanceLogs;