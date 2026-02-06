import { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";

export const useVerifikasiSKU = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Referensi ke koleksi pengajuan SKU
    const q = query(
      collection(db, "sku_submissions"),
      where("status", "==", "pending") // Hanya ambil yang belum diuji
    );

    // 2. Listener Realtime
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Format waktu sederhana untuk UI
        waktuPengajuan: doc.data().createdAt?.toDate().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) || "Baru saja"
      }));
      
      setQueue(submissions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching SKU queue:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Fungsi untuk memproses Verifikasi (Lulus/Gagal)
   * @param {string} submissionId - ID dokumen pengajuan
   * @param {string} status - 'approved' atau 'rejected'
   */
  const verifySKU = async (submissionId, status) => {
    try {
      const submissionRef = doc(db, "sku_submissions", submissionId);
      const submissionSnap = await getDoc(submissionRef);

      if (!submissionSnap.exists()) return;

      const data = submissionSnap.data();
      const userRef = doc(db, "users", data.userId);

      if (status === "approved") {
        // --- LOGIKA JIKA LULUS ---
        // 1. Update status pengajuan
        await updateDoc(submissionRef, {
          status: "approved",
          verifiedAt: serverTimestamp(),
        });

        // 2. Tambah XP Anggota & Update Radar (Progress SKU)
        // Kita asumsikan poin SKU bertambah sesuai kategori yang ada di data pengajuan
        await updateDoc(userRef, {
          points: increment(100), // Bonus XP per poin SKU
          energy: increment(10),  // Bonus Energi
          // Update field progres kategori (misal: sku_spiritual, sku_fisik, dll)
          [`progress_sku.${data.kategori}`]: increment(1) 
        });

        alert(`Berhasil! ${data.namaAnggota} dinyatakan LULUS poin ini.`);
      } else {
        // --- LOGIKA JIKA GAGAL ---
        await updateDoc(submissionRef, {
          status: "rejected",
          verifiedAt: serverTimestamp(),
        });
        
        alert(`Status: ${data.namaAnggota} harus mengulang poin ini.`);
      }
    } catch (error) {
      console.error("Error verifying SKU:", error);
      alert("Terjadi kesalahan sistem saat verifikasi.");
    }
  };

  return { queue, verifySKU, loading };
};