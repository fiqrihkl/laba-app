import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, 
  doc, getDoc, getDocs, writeBatch 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiPaperAirplane, HiChevronLeft, HiOutlineTrash } from "react-icons/hi";
import { getNaviResponse } from "../../utils/naviAi";
import VakiAvatar from "./VakiAvatar";

function NaviChat() {
  const [userData, setUserData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isNaviTyping, setIsNaviTyping] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const hasIntroduced = useRef(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isNaviTyping]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return navigate("/login");

    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) setUserData({ ...snap.data(), docId: snap.id });
    });

    const chatRef = query(
      collection(db, "users", user.uid, "navi_memory"),
      orderBy("timestamp", "asc"),
      limit(50)
    );
    
    const unsubChat = onSnapshot(chatRef, (snap) => {
      const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatHistory(messages);

      if (messages.length === 0 && !isNaviTyping && !hasIntroduced.current) {
        hasIntroduced.current = true;
        sendFirstIntroduction(user.uid);
      } 
      else if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.timestamp && lastMsg.role === 'user') {
          const lastTime = lastMsg.timestamp.toDate().getTime();
          const now = new Date().getTime();
          const diffHours = (now - lastTime) / (1000 * 60 * 60);

          if (diffHours > 12) {
            initiateProactiveGreeting(user.uid, messages);
          }
        }
      }
    });

    return () => unsubChat();
  }, [navigate]);

  const sendFirstIntroduction = async (uid) => {
    setIsNaviTyping(true);
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const data = userSnap.data();
      const name = data?.nama?.split(' ')[0] || "Navigator";

      const introPrompt = `
        [IDENTITY]
        Nama: NAVI.
        Role: Asisten Laskar Bahari SMPN 1 Biau.
        
        [INSTRUCTION]
        Ini pertama kali kamu bertemu ${name}. Perkenalkan dirimu dengan gaya Gen-Z Savage tapi tetap peduli.
        
        [CONSTRAINTS]
        1. JANGAN sebut 'Navalai'.
        2. JANGAN pakai kata 'Gaskeun' di kalimat pertama.
        3. Gunakan bahasa manusia normal, jangan gabungkan semua kata kunci jadi satu kalimat aneh.
        4. Maksimal 18 kata. Tanpa tanda kutip.
        
        [STYLE EXAMPLE]
        "Eh, ${name}? Kenalin, gue NAVI. Navigator lo di Laskar Bahari. Butuh bantuan SKU atau mau curhat? Gue standby."
      `;

      const response = await getNaviResponse(data, [], introPrompt);

      if (response) {
        const chatRef = collection(db, "users", uid, "navi_memory");
        await addDoc(chatRef, { 
          role: "navi", 
          message: response.replace(/["']/g, "").trim(), 
          timestamp: serverTimestamp() 
        });
      }
    } catch (error) {
      console.error("Intro Error:", error);
    } finally {
      setIsNaviTyping(false);
    }
  };

  const initiateProactiveGreeting = async (uid, history) => {
    if (isNaviTyping) return;
    setIsNaviTyping(true);

    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const data = userSnap.data();
      
      const proactivePrompt = `
        Tugas: Sapa kembali ${data.nama.split(' ')[0]}. 
        Konteks: Cek riwayat terakhir, jika ada keluhan sakit/sedih tanya kabarnya. Jika tidak, sapa dengan gaya asik karena dia baru muncul lagi.
        Aturan: Singkat, Savage, Maks 15 kata. JANGAN sapa 'Sauh'.
      `;

      const response = await getNaviResponse(data, history, proactivePrompt);

      if (response) {
        const chatRef = collection(db, "users", uid, "navi_memory");
        await addDoc(chatRef, { 
          role: "navi", 
          message: response.replace(/["']/g, "").trim(), 
          timestamp: serverTimestamp() 
        });
      }
    } catch (error) {
      console.error("Proactive Greeting Error:", error);
    } finally {
      setIsNaviTyping(false);
    }
  };

  const handleResetChat = async () => {
    if (!userData || isResetting) return;
    const confirmReset = window.confirm("Navigator, yakin mau hapus semua memori radar? Histori chat akan hilang, tapi data level/SKU tetap aman. Ganti.");
    if (!confirmReset) return;

    setIsResetting(true);
    try {
      const chatRef = collection(db, "users", userData.docId, "navi_memory");
      const snapshot = await getDocs(chatRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      hasIntroduced.current = false;
    } catch (error) {
      alert("Radar macet! Gagal reset.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendChat = async () => {
    if (!inputMessage.trim() || isNaviTyping || isCooldown || !userData) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    setIsNaviTyping(true);

    try {
      const chatRef = collection(db, "users", userData.docId, "navi_memory");
      await addDoc(chatRef, { role: "user", message: userMsg, timestamp: serverTimestamp() });

      const response = await getNaviResponse(userData, [...chatHistory, { role: "user", message: userMsg }], userMsg);

      if (response) {
        await addDoc(chatRef, { 
          role: "navi", 
          message: response.replace(/["']/g, "").trim(), 
          timestamp: serverTimestamp() 
        });
      }

      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 2000); 
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsNaviTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white font-sans italic overflow-hidden">
      
      {/* HEADER - Tetap di atas (flex-none) */}
      <header className="flex-none p-5 flex items-center justify-between border-b border-white/10 bg-[#020617]/95 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/anggota-dashboard')} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90"
          >
            <HiChevronLeft size={24} />
          </button>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 overflow-hidden">
            <VakiAvatar level={userData?.level} userData={userData} className="w-8 h-8 scale-150" />
          </div>
          <div>
            <h2 className="font-black uppercase tracking-tighter text-sm leading-none">NAVI SYSTEM</h2>
            <p className="text-[8px] text-green-400 font-bold uppercase flex items-center gap-1 mt-1">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Signal Stable
            </p>
          </div>
        </div>

        <button 
          onClick={handleResetChat}
          disabled={isResetting || chatHistory.length === 0}
          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 disabled:opacity-20"
        >
          <HiOutlineTrash size={20} className={isResetting ? "animate-spin" : ""} />
        </button>
      </header>

      {/* CHAT AREA - Area scroll mandiri (flex-1) */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed">
        <div className="flex flex-col space-y-6">
          {chatHistory.map((chat) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              key={chat.id} 
              className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold leading-relaxed shadow-2xl relative ${
                chat.role === 'user' 
                  ? 'bg-gradient-to-br from-red-600 to-red-800 text-white rounded-tr-none' 
                  : 'bg-slate-800/80 backdrop-blur-md text-slate-100 rounded-tl-none border border-white/5 shadow-xl shadow-black/20'
              }`}>
                {chat.message}
              </div>
            </motion.div>
          ))}
          
          <AnimatePresence>
            {isNaviTyping && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1.5 shadow-xl">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Spasi agar pesan terakhir tidak mepet footer */}
          <div ref={chatEndRef} className="pb-4" />
        </div>
      </main>

      {/* FOOTER INPUT - Berada di dalam kontainer flex (flex-none) */}
      <footer className="flex-none p-5 pb-28 bg-[#020617] border-t border-white/5 z-[90]">
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-slate-800 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder={isCooldown ? "Navi memproses..." : "Ketik koordinat pesan..."}
              disabled={isCooldown || isNaviTyping || isResetting}
              className="w-full bg-slate-900/90 border border-white/10 rounded-full py-4 px-6 pr-14 text-xs font-bold focus:outline-none focus:border-red-600 transition-all text-white placeholder:text-slate-700 shadow-2xl"
            />
            <button 
              onClick={handleSendChat}
              disabled={!inputMessage.trim() || isNaviTyping || isCooldown || isResetting}
              className="absolute right-2 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all active:scale-90 shadow-lg"
            >
              <HiPaperAirplane className={`rotate-90 text-white size-4 ${isNaviTyping ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default NaviChat;