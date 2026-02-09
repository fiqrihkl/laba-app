import { db } from "../firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

/**
 * Helper untuk generate nomor sertifikat berdasarkan pattern dinamis
 * Placeholder: {NO}, {TINGKAT}, {ROMAN_MONTH}, {YEAR}
 */
export const generateCertificateNumber = (pattern, lastNumber, tingkat) => {
  const now = new Date();
  const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  
  // Mengambil nomor urut berikutnya
  const nextRawNumber = (Number(lastNumber) || 0) + 1;
  // Format 3 digit (misal: 1 jadi 001)
  const nextNumberFormatted = nextRawNumber.toString().padStart(3, '0'); 
  
  const year = now.getFullYear();
  const romanMonth = romanMonths[now.getMonth()];

  // Gunakan Regex agar semua placeholder terganti
  let result = (pattern || "{NO}/LB-BIAU/{TINGKAT}/{ROMAN_MONTH}/{YEAR}")
    .replace(/{NO}/g, nextNumberFormatted)
    .replace(/{TINGKAT}/g, tingkat.toUpperCase())
    .replace(/{ROMAN_MONTH}/g, romanMonth)
    .replace(/{YEAR}/g, year.toString());

  return {
    formattedNumber: result,
    newRawNumber: nextRawNumber
  };
};

/**
 * Fungsi Utama Pelantikan (Process Graduation)
 * Perubahan: Menambahkan logika kenaikan tingkat otomatis
 */
export const processGraduation = async (userId, tingkatSaatIni) => {
  const configRef = doc(db, "settings", "certificate_config");
  const userRef = doc(db, "users", userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const configDoc = await transaction.get(configRef);
      
      if (!configDoc.exists()) {
        throw "Konfigurasi sertifikat belum diatur di menu Setting!";
      }

      const { pattern, lastNumber } = configDoc.data();
      const currentLevel = tingkatSaatIni.toUpperCase();

      // 1. Logika Penentuan Tingkat Baru (Auto-Promotion)
      let tingkatBaru = "";
      if (currentLevel === "RAMU") tingkatBaru = "RAKIT";
      else if (currentLevel === "RAKIT") tingkatBaru = "TERAP";
      else tingkatBaru = currentLevel; // Tetap TERAP jika sudah di puncak

      // 2. Generate nomor sertifikat untuk tingkat yang baru saja diselesaikan
      const { formattedNumber, newRawNumber } = generateCertificateNumber(
        pattern, 
        lastNumber, 
        currentLevel // Sertifikat dicetak untuk tingkat yang baru diselesaikan
      );

      // 3. Update counter nomor urut di settings
      transaction.update(configRef, { lastNumber: newRawNumber });

      // 4. Update Data Anggota
      transaction.update(userRef, {
        // Simpan info kelulusan di tingkat yang lama
        [`lulus_info.${currentLevel}`]: {
          isLulus: true,
          noSertifikat: formattedNumber,
          tglLulus: serverTimestamp(), 
        },
        // OTOMATIS naikkan tingkat aktif di profil ke tingkat berikutnya
        tingkat: tingkatBaru 
      });

      return { formattedNumber, tingkatBaru };
    });

    console.log(`Pelantikan Berhasil! Nomor: ${result.formattedNumber}, Tingkat Baru: ${result.tingkatBaru}`);
    return { success: true, noSertifikat: result.formattedNumber, tingkatBaru: result.tingkatBaru };
  } catch (error) {
    console.error("Gagal memproses pelantikan:", error);
    return { success: false, error: error.toString() };
  }
};