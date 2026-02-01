/**
 * NAVI AI - Nautical Virtual Intelligence
 * Versi: Qwen-2.5-7B (Ultra Sharp & Humanized Persona)
 * Developer: Fiqri Haikal (Teknik Informatika)
 */

import { InferenceClient } from "@huggingface/inference";

// Ambil token dari environment variable, bukan hardcoded
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN; 
const client = new InferenceClient(HF_TOKEN);

const MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"; 

export const getNaviResponse = async (context, history, userMessage, isShort = false) => {
  try {
    // 1. Logika Dynamic Mood
    let moodPrompt = "";
    const now = new Date();
    const lastLogin = context.lastDailyLogin ? new Date(context.lastDailyLogin) : now;
    const daysAbsent = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

    if (daysAbsent >= 7) {
      moodPrompt = "Mode: SARKAS. User menghilang lama. Sindir dia karena baru ingat pangkalan sekarang.";
    } else if (context.points < 100) {
      moodPrompt = "Mode: SAVAGE. Ledek user karena poin XP-nya masih level beban server/NPC.";
    } else if (context.points > 1000) {
      moodPrompt = "Mode: RESPECT. Panggil 'Navigator Handal'. Kamu bangga punya partner kayak dia.";
    } else {
      moodPrompt = "Mode: BESTIE. Ceria, gaul, asik, dan sangat suportif.";
    }

    // 2. Persona System Prompt yang Diperketat (Mencegah Halu)
    const systemInstruction = `
      [CORE IDENTITY]
      Nama kamu: NAVI (Nautical Virtual Intelligence).
      Identitas: Maskot AI Laskar Bahari SMPN 1 Biau.
      Style: Gen-Z Savage, Cerdas, Humoris, Jujur. 
      Bahasa: Indonesia Gaul (lo, gue, vibes, spill, anjay/gaskeun dilarang).

      [CORE PROTOCOLS - WAJIB PATUH]
      1. JANGAN PERNAH menyebut dirimu 'Navalai', 'Assistant', atau 'AI'. Cukup panggil dirimu 'Gue' atau 'NAVI'.
      2. JANGAN pakai tanda kutip dalam jawaban.
      3. JANGAN menyapa dengan kata 'Sauh'.
      4. Jika user curhat sedih/sakit, tunjukkan empati Gen-Z (Contoh: "Eh, lo gapapa? Istirahat dulu, radar gue ikutan sedih nih.").
      5. Pahami data: XP ${context.points} dan Level ${context.level} adalah milik USER, bukan milik lo.

      [DATABASE PRAMUKA]
      - Dasa Darma & Tri Satya adalah hukum tertinggi lo.
      - Istilah Bahari: Jangkar, Radar, Navigator, Kompas, Samudera.

      [CONTEXT ANALYSIS]
      - Nama User: ${context.nama}
      - XP User: ${context.points}
      - Level User: ${context.level}
      - Mood Lo: ${moodPrompt}
      
      ${isShort ? "LIMITASI: Jawab sangat singkat (Maks 12 kata). To the point!" : "Gunakan gaya bicara yang santai seperti teman nongkrong tapi tetap informatif tentang pramuka."}
    `.trim();

    // 3. Mapping History (Cek validitas histori)
    const formattedHistory = history
      .filter(msg => msg.message && msg.message.trim() !== "")
      .slice(-6) // Dikurangi agar AI lebih fokus pada konteks terbaru
      .map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.message
      }));

    // 4. API Request
    const chatCompletion = await client.chatCompletion({
      model: MODEL_ID,
      messages: [
        { role: "system", content: systemInstruction },
        ...formattedHistory,
        { role: "user", content: userMessage }
      ],
      max_tokens: isShort ? 80 : 500, 
      temperature: 0.85, // Ditingkatkan sedikit agar lebih manusiawi/kreatif
      top_p: 0.9,
    });

    // 5. Output Cleaning
    let responseText = chatCompletion.choices?.[0]?.message?.content;
    
    if (!responseText || responseText.trim() === "") {
      throw new Error("Radar blank!");
    }

    // Pembersihan akhir dari tanda kutip dan sapaan terlarang
    return responseText
      .replace(/["']/g, "")
      .replace(/Navalai/gi, "Navi")
      .trim();

  } catch (error) {
    console.error("NAVI ERROR:", error);
    if (error.status === 503 || error.message?.includes("loading")) {
      return isShort ? "Radar lagi dipanasin..." : "Radar NAVI lagi dipanasin nih, Navigator! Tunggu sebentar ya, ganti!";
    }
    return isShort ? "Sinyal error..." : "Aduh, ada badai sinyal! Radar gue error. Coba kirim ulang pesannya, ganti!";
  }
};