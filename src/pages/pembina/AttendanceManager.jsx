import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, getDocs, doc, updateDoc, 
  arrayUnion, increment, serverTimestamp 
} from "firebase/firestore";
import { 
  HiOutlineUserGroup, HiCheckCircle, 
  HiExclamationCircle, HiPlusCircle, HiChevronLeft 
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function AttendanceManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter hanya anggota (bukan pembina)
      setMembers(data.filter(user => user.role !== 'pembina'));
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (member, type) => {
    const confirmAction = window.confirm(`Set status ${member.nama} menjadi ${type}?`);
    if (!confirmAction) return;

    try {
      const userRef = doc(db, "users", member.id);
      const points = type === "HADIR" ? 50 : 0; // Izin/Sakit tidak dapat poin

      await updateDoc(userRef, {
        points: increment(points),
        lastAttendance: serverTimestamp(),
        attendanceLog: arrayUnion({
          timestamp: new Date().toISOString(),
          activity: "Latihan Rutin (Input Manual)",
          pointsEarned: points,
          type: type === "HADIR" ? "PRESENSI" : type
        }),
      });

      alert(`Berhasil memperbarui status ${member.nama}`);
      fetchMembers(); // Refresh data
    } catch (error) {
      alert("Gagal memperbarui status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 italic">
      {/* HEADER */}
      <div className="bg-slate-900 pt-12 pb-10 px-6 rounded-b-[3rem] text-white shadow-xl">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-lg">
             <HiChevronLeft size={24} />
           </button>
           <div>
             <h1 className="text-xl font-black uppercase tracking-tighter">Manajemen Presensi</h1>
             <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Rekapitulasi Anggota</p>
           </div>
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-white rounded-[2rem] shadow-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-4 px-2">
            <HiOutlineUserGroup className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Anggota ({members.length})</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-10 text-center animate-pulse text-slate-300 uppercase text-[10px] font-bold">Memuat Data Anggota...</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{member.nama}</h3>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">UID: {member.uid || 'N/A'}</p>
                    </div>
                    <div className="bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded text-[8px] font-black">
                      {member.points || 0} XP
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => markAttendance(member, "HADIR")}
                      className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                    >
                      <HiCheckCircle size={14}/> Hadir
                    </button>
                    <button 
                      onClick={() => markAttendance(member, "IZIN")}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20 active:scale-95 transition"
                    >
                      <HiPlusCircle size={14}/> Izin
                    </button>
                    <button 
                      onClick={() => markAttendance(member, "SAKIT")}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 shadow-lg shadow-orange-500/20 active:scale-95 transition"
                    >
                      <HiExclamationCircle size={14}/> Sakit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}