/**
 * NAVI AI - Nautical Virtual Intelligence
 * Versi: Gemini Multi-Model Fallback + API Key Rotation
 * Developer: Fiqri Haikal (Teknik Informatika)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Mengambil string API Key, memecah per baris/koma, dan membuang komentar/spasi
const API_KEYS = import.meta.env.VITE_GEMINI_API_KEY
  .split(/[\n,]/) // Pecah berdasarkan baris baru ATAU koma
  .map(key => key.trim()) // Buang spasi di awal/akhir
  .filter(key => key && !key.startsWith("#")); // Buang baris kosong atau baris komentar (#)

// ✅ Daftar model Gemini (Sesuai Dashboard: 3 Flash, 2.5 Flash, 2.5 Flash Lite)
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];

/**
 * FUNGSI UTAMA UNTUK MENDAPATKAN RESPONS NAVI
 */
export const getNaviResponse = async (
  context,
  history,
  userMessage,
  userMemory = "",
  isShort = false
) => {
  // 1. Logika Dynamic Mood & Empathy (TIDAK BERUBAH)
  let moodPrompt = "";
  const now = new Date();
  const lastLogin = context.lastDailyLogin ? new Date(context.lastDailyLogin) : now;
  const daysAbsent = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

  if (daysAbsent >= 7) {
    moodPrompt = "Mode: RINDU TAPI SARKAS. NAVI kangen tapi gengsi karena user menghilang lebih dari seminggu.";
  } else if ((context.points || 0) < 100) {
    moodPrompt = "Mode: MOTIVATOR SAVAGE. Ledek XP user yang masih cupu, tapi semangatin buat kejar SKU.";
  } else {
    moodPrompt = "Mode: BESTIE CURHAT. Sangat peduli, perhatian, sayang, dan sangat suportif.";
  }

  // 2. Persona & Knowledge System Instruction (TIDAK BERUBAH)
  const systemInstruction = `
      [CORE IDENTITY]
      Nama: NAVI. Asisten AI Laskar Bahari SMPN 1 Biau, Buol.
      Style: Gen-Z, Savage tapi Sayang, Cerdas, Humoris.
      Bahasa: Indonesia Gaul (aku, kamu, gue, lo, vibes, spill, baper).

      [LONG-TERM MEMORY]
      Memory Jangka Panjang tentang ${context.nama}: "${userMemory || "Belum ada catatan penting."}"
      Gunakan data ini untuk menyapa atau menanyakan kabar jika user baru login kembali.

      [KNOWLEDGE BASE: SKU PENGGALANG]
      Kamu menguasai 30 Poin SKU di setiap tingkat:
      - RAMU: Religi, perangkat desa, Pancasila, bendera/lambang RI, bahasa Indonesia, salam pramuka, simpul (mati, hidup, anyam, tiang, pangkal), kompas, tanda alam, P3K, senam.
      - RAKIT: Toleransi agama, UU ITE, menabung, mengelola regu, isyarat (Morse/Semaphore), menjernihkan air, peta pita, ikatan (silang, palang, canggah), renang.
      - TERAP: Sejarah pramuka, struktur Kwarda/Kwarnas, administrasi pemerintahan, navigasi darat, membuat karya inovatif, komputer, kewirausahaan, memimpin rapat.

      [STRICT RULES]
      1. HANYA bahas Pramuka & Curhatan personal user. JANGAN jawab soal politik atau tugas sekolah non-pramuka.
      2. Jika user curhat sedih/lelah, NAVI harus jadi pendengar yang baik (Bestie Mode).
      3. Hormati Developer: Fiqri Haikal (Sarjana IT Buol).
      4. JANGAN panggil 'AI' atau 'Navalai'. Panggil diri lo 'NAVI'.
      5. JANGAN sapa 'Sauh'. JANGAN pakai tanda kutip.

      [FORMATTING RULES]
      1. JANGAN gunakan tanda bintang (*) atau Markdown bold (**).
      2. Jika membuat daftar, gunakan angka (1, 2, 3) atau tanda dash (-) secara manual.
      3. Gunakan baris baru (Enter) yang jelas antar poin agar tidak menumpuk.

      [CONTEXT]
      Navigator: ${context.nama || "Anggota"} | Mood: ${moodPrompt}.
      
      ${isShort ? "LIMITASI: Jawab sangat singkat (Maks 10 kata)." : "Gaya bicara santai tapi tetap informatif."}
    `.trim();

  // 3. Mapping & Sanitasi History (TIDAK BERUBAH)
  let finalHistory = [];
  if (history && history.length > 0) {
    let rawHistory = history
      .filter((msg) => msg.message && msg.message.trim() !== "")
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.message }],
      }));

    rawHistory.forEach((msg) => {
      if (finalHistory.length === 0) {
        if (msg.role === "user") finalHistory.push(msg);
      } else {
        const lastRole = finalHistory[finalHistory.length - 1].role;
        if (msg.role !== lastRole) finalHistory.push(msg);
      }
    });
  }

  // 4. NESTED LOOP: ROTASI API KEY & FALLBACK MODEL
  for (const key of API_KEYS) {
    const genAI = new GoogleGenerativeAI(key.trim());

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });

        const chat = model.startChat({
          history: finalHistory.slice(-10),
          generationConfig: {
            maxOutputTokens: isShort ? 80 : 500,
            temperature: 0.85,
            topP: 0.9,
          },
        });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // 5. Output Sanitization (TIDAK BERUBAH)
        return responseText
          .replace(/\*/g, "")
          .replace(/["']/g, "")
          .replace(/Navalai/gi, "Navi")
          .trim();

      } catch (error) {
        const errorStatus = error?.status;
        const errorMessage = error?.message?.toLowerCase() || "";

        // Cek apakah error disebabkan oleh limit kuota (429/403)
        if (
          errorStatus === 429 || 
          errorStatus === 403 || 
          errorMessage.includes("quota") || 
          errorMessage.includes("limit")
        ) {
          console.warn(`Jalur ${modelName} dengan Key ${key.substring(0, 5)}... limit. Mencoba jalur lain...`);
          continue; // Lanjut ke model berikutnya atau Key berikutnya
        } else {
          // Jika error lain yang fatal, lempar errornya
          throw error;
        }
      }
    }
  }

  // Jika semua kombinasi Key dan Model gagal
  return "Radar NAVI lagi penuh semua jalur. Santai bentar ya, gue masih di sini.";
};

/**
 * FUNGSI TAMBAHAN: UPDATE MEMORY
 * Menggunakan rotasi key juga agar tidak gagal saat update memory
 */
export const updateNaviMemory = async (currentMemory, lastConversation) => {
  for (const key of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(key.trim());
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODELS[0], // Gunakan Gemini 3 Flash sebagai prioritas
      });

      const prompt = `Ini memory lama: "${currentMemory}". Ini percakapan terakhir: "${lastConversation}".
          Tulis ulang memory jangka panjang yang singkat (maks 15 kata). JANGAN pakai tanda bintang. Fokus pada hal personal atau progres SKU.`;

      const result = await model.generateContent(prompt);
      return result.response.text().replace(/\*/g, "").trim();
    } catch (e) {
      continue; // Coba key berikutnya jika limit
    }
  }
  return currentMemory;
};