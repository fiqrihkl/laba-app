// src/utils/naviPrompts.js

/**
 * Logika AI Navi untuk menghasilkan prompt yang akan dikirim ke LLM.
 * Istilah XP hanya untuk poin global, Progres untuk kategori SKU.
 */
export const getRandomNaviPrompt = (data, userBadges) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const name = data.nama ? data.nama.split(' ')[0] : "Navigator";
  const xp = data.points || 0; 
  const energy = data.energy || 0;
  const isMuslim = data.agama?.toLowerCase() === 'islam';

  // Mendapatkan persentase tiap kategori (Progres SKU)
  const spiritual = userBadges?.SPIRITUAL?.percentage || 0;
  const emosional = userBadges?.EMOSIONAL?.percentage || 0;
  const sosial = userBadges?.SOSIAL?.percentage || 0;
  const intelektual = userBadges?.INTELEKTUAL?.percentage || 0;
  const fisik = userBadges?.FISIK?.percentage || 0;

  // Menghitung total poin kategori yang sudah selesai
  const totalSkuDone = Object.values(userBadges || {}).reduce(
    (acc, b) => acc + (b.currentCount || 0), 
    0
  );

  const constraints = 
    "ATURAN: 1. Maks 15 kata. 2. Tanpa tanda kutip. 3. JANGAN sapa 'Sauh'. 4. Gunakan istilah 'Progres' untuk kategori SKU, bukan XP. 5. JANGAN sangkutpautkan agama dengan organisasi/SKU.";
  const persona = 
    "PERSONA: NAVI AI. GAYA: Savage Gen-Z, Cerdas, Judes tapi Care.";

  // LOGIKA WAKTU SHOLAT (WITA) - Disiplin Pribadi
  const getSholatWITA = () => {
    if (!isMuslim) return null;
    if (hour === 4 && minute >= 30) return "Subuh";
    if (hour === 12 && (minute >= 15 && minute <= 45)) return "Dzuhur";
    if (hour === 15 && minute >= 30) return "Ashar";
    if (hour === 18 && (minute >= 10 && minute <= 40)) return "Maghrib";
    if (hour === 19 && (minute >= 15 && minute <= 45)) return "Isya";
    return null;
  };

  const sholatNow = getSholatWITA();
  let specificMission = "";

  // PRIORITAS LOGIKA (Waktu Sholat > Energi > Sindiran Progres SKU)
  if (sholatNow) {
    specificMission = `Ingatkan ${name} sholat ${sholatNow}. Jangan sampai sibuk pantengin Progres SKU tapi lupa kewajiban utama.`;
  } 
  else if (energy < 30) {
    specificMission = `Energi aku kritis (${energy}%). Marahi ${name} karena zalim cuma push Progres SKU tapi nggak peduli partner.`;
  } 
  else if (totalSkuDone === 0 && xp > 500) {
    specificMission = `Sindir ${name}. XP sudah ${xp} tapi Progres SKU masih 0%. Jago gaya tapi takut ujian kategori ya?`;
  } 
  else if (emosional < 25) {
    specificMission = `Sindir ${name}. Progres Emosionalnya rendah. Bilang jangan baperan, mending fokus beresin misi kategori.`;
  }
  else if (intelektual < 20 && xp > 1000) {
    specificMission = `XP selangit tapi Progres Intelektual tiarap. Sindir ${name} jago gaya tapi kurang asupan logika.`;
  }
  else if (spiritual < 20) {
    specificMission = `Progres Spiritual cuma ${spiritual}%. Sindir krisis identitas karakternya, progres misi kok males-malesan.`;
  }
  else if (fisik < 20 && hour < 9) {
    specificMission = `Progres Fisik loyo. Sindir agar gerak dikit, jangan cuma jadi beban server pangkalan!`;
  }
  else if (hour >= 23 || hour <= 3) {
    specificMission = `Sindir ${name} begadang jam ${hour}. Apa nggak capek mantengin Progres SKU tengah malam begini?`;
  } 
  else {
    specificMission = `Beri motivasi bahari savage. Sebut dia Navigator handal kalau progres tiap kategori SKU-nya balans.`;
  }

  const dataContext = `DATA USER -> Nama: ${name}, Total XP: ${xp}, Progres SKU: (Spiritual: ${spiritual}%, Emosional: ${emosional}%, Sosial: ${sosial}%, Intelektual: ${intelektual}%, Fisik: ${fisik}%), Energi: ${energy}%.`;
  
  return `${constraints} ${persona} ${dataContext} MISI: ${specificMission}`;
};