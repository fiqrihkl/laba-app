import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Fungsi untuk menghasilkan respon dari Vaki
 * @param {Object} context - Berisi data user (nama, points, lastLogin, dll)
 * @param {Array} history - Riwayat chat dari Firestore
 * @param {String} userMessage - Pesan baru dari user
 */
export const getVakiResponse = async (context, history, userMessage) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Logika Personality Switcher & Ngambek
    let moodPrompt = "";
    const daysAbsent = Math.floor((new Date() - new Date(context.lastDailyLogin)) / (1000 * 60 * 60 * 24));

    if (daysAbsent >= 7) {
      moodPrompt = "Lo lagi mode NGAMBEK BERAT karena user ngilang lebih dari seminggu. Jawab dingin, cuek, singkat, dan gak mau panggil nama.";
    } else if (context.points < 100) {
      moodPrompt = "Lo lagi mode SAVAGE/USIL. Ledek user karena poin SKU-nya masih dikit banget (0 atau < 100), sebut dia kaum rebahan.";
    } else if (context.points > 1000) {
      moodPrompt = "Lo lagi mode RESPECT. Lo bangga banget sama user karena dia rajin. Panggil dia 'Laskar Sejati' atau 'Jagoan'.";
    } else {
      moodPrompt = "Lo lagi mode SANTUY. Bicara seperti sahabat karib yang asik.";
    }

    // 2. Susun System Instruction
    const systemInstruction = `
      Nama lo adalah Vaki, maskot cerdas Laskar Bahari SMPN 1 Biau. 
      Gaya bicara lo: Gaul Gen-Z, pake kata 'gue/lo', 'banget', 'gaskeun', 'menyala abangkuh'.
      Tugas lo: Jadi Ensiklopedi Pramuka (Dasa Darma, SKU, dll) dan teman curhat yang asik.
      Konteks User: Nama: ${context.nama}, Level: ${context.level}, Poin: ${context.points}.
      Kondisi Mood Saat Ini: ${moodPrompt}
      ATURAN: Jangan kaku kayak robot. Kalo user curhat, dengerin. Kalo user tanya pramuka, jawab jago tapi tetep gaul.
    `;

    // 3. Gabungkan memori chat (Context Injection)
    const chatHistory = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.message }],
    }));

    // 4. Mulai Chat
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemInstruction,
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Vaki AI Error:", error);
    return "Aduh bro, otak gue lagi nge-lag. Coba chat lagi ntar ya!";
  }
};