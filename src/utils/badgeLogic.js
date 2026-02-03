// src/utils/badgeLogic.js

export const SKU_CATEGORIES = {
  SPIRITUAL: {
    name: "Spiritual",
    color: "yellow",
    total: 4, 
    competency: "Taat beribadah dan mampu hidup rukun dalam keberagaman tanpa diskriminasi."
  },
  EMOSIONAL: {
    name: "Emosional",
    color: "red",
    total: 2, 
    competency: "Dapat mengelola emosi dan perasaannya untuk kestabilan dirinya."
  },
  SOSIAL: {
    name: "Sosial",
    color: "blue",
    total: 13, 
    competency: "Mampu menerima dan mendorong orang lain untuk menaati norma dan nilai masyarakat."
  },
  INTELEKTUAL: {
    name: "Intelektual",
    color: "green",
    total: 6, 
    competency: "Mampu menganalisis situasi serta mengaplikasikan iptek dan keterampilan secara kreatif."
  },
  FISIK: {
    name: "Fisik",
    color: "white",
    total: 5, 
    competency: "Mampu menjelaskan pertumbuhan fisik/psikis serta kesehatan lingkungan."
  }
};

/**
 * Fungsi untuk menghitung progres lencana (Achievement Radar)
 * Ditingkatkan dengan normalisasi string yang lebih ketat.
 */
export const calculateBadges = (verifiedSkus, userData, masterSkuData = []) => {
  const badgeStatus = {};
  
  // 1. Normalisasi data profil (User)
  // Menghilangkan spasi dan memaksa ke lowercase agar pembandingan konsisten
  const userAgama = userData?.agama?.trim().toLowerCase() || "";
  const tingkatUser = userData?.tingkat?.trim().toUpperCase() || "";

  // 2. Tentukan Tingkat Target (Misi yang sedang dikerjakan)
const getTargetTingkat = () => {
  // Normalisasi tingkat user ke huruf besar
  const t = userData?.tingkat?.toUpperCase() || "";
  
  /**
   * LOGIKA BARU:
   * Jika statusnya PENGGALANG (baru registrasi), maka targetnya adalah RAMU.
   * Jika sudah RAMU, targetnya RAKIT.
   * Jika sudah RAKIT, targetnya TERAP.
   */
  if (!t || t === "PENGGALANG" || t === "CALON ANGGOTA" || t === "BELUM ADA TINGKATAN") {
    return "ramu";
  }
  
  if (t === "RAMU") return "rakit";
  if (t === "RAKIT") return "terap";
  
  return t.toLowerCase(); 
};

  const currentTargetLevel = getTargetTingkat().toLowerCase();

  Object.keys(SKU_CATEGORIES).forEach((key) => {
    const category = SKU_CATEGORIES[key];
    
    // 3. Filter SKU berdasarkan Kategori dan TINGKAT TARGET
    let relevantSkus = verifiedSkus.filter(sku => {
      // Normalisasi data dari Firestore
      const skuKategori = sku.kategori?.trim().toUpperCase() || "";
      const skuLevel = sku.tingkat?.trim().toLowerCase() || "";
      
      // Data yang dihitung hanya yang sesuai dengan tingkat target misi saat ini
      const isLevelMatch = skuLevel === currentTargetLevel;
      const isCategoryMatch = skuKategori === key;

      return isCategoryMatch && isLevelMatch;
    });

    let currentCount = 0;

    if (key === "SPIRITUAL") {
      // Hitung Poin 1, 2, dan 3 (Poin Umum)
      const commonPointsUnique = new Set(
        relevantSkus
          .filter(sku => {
            const num = Number(sku.nomor_poin);
            return num >= 1 && num <= 3;
          })
          .map(sku => Number(sku.nomor_poin))
      );

      // --- LOGIKA KHUSUS POIN 4 (AGAMA) ---
      // Cari target sub-poin agama di master_sku
      const targetSubPoin4 = masterSkuData.filter(m => {
        const mLevel = m.tingkat?.trim().toLowerCase() || "";
        const mAgama = m.sub_agama?.trim().toLowerCase() || "";
        return Number(m.nomor) === 4 && mAgama === userAgama && mLevel === currentTargetLevel;
      }).length;

      // Hitung sub-poin agama yang sudah verified
      const verifiedSubPoin4 = relevantSkus.filter(sku => {
        const sAgama = sku.sub_agama?.trim().toLowerCase() || "";
        const sNomor = Number(sku.nomor_poin);
        return sNomor === 4 && (sAgama === userAgama || sAgama === "");
      }).length;

      let religiousPointDone = 0;
      
      // Syarat Lulus Poin 4: Semua sub-poin agama di tingkatan tersebut harus selesai
      if (targetSubPoin4 > 0) {
        if (verifiedSubPoin4 >= targetSubPoin4) religiousPointDone = 1;
      } else if (verifiedSubPoin4 > 0) {
        religiousPointDone = 1;
      }

      currentCount = commonPointsUnique.size + religiousPointDone;
      
    } else {
      // Untuk kategori selain Spiritual, pastikan nomor poin unik yang dihitung (Gunakan Set)
      const uniquePoints = new Set(relevantSkus.map(s => Number(s.nomor_poin)));
      currentCount = uniquePoints.size;
    }

    // 4. Kalkulasi Persentase
    const percentage = Math.min((currentCount / category.total) * 100, 100);

    let tier = null;
    if (percentage >= 100) tier = "GOLD";
    else if (percentage >= 70) tier = "SILVER";
    else if (percentage >= 30) tier = "BRONZE";

    badgeStatus[key] = {
      ...category,
      currentCount: currentCount,
      percentage: percentage,
      tier: tier,
      isMax: percentage === 100
    };
  });

  return badgeStatus;
};