import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase";
import { 
  collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, 
  doc, getDoc, getDocs, writeBatch, updateDoc 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiPaperAirplane, HiChevronLeft, HiOutlineTrash, HiExclamation } from "react-icons/hi";
import { getNaviResponse, updateNaviMemory } from "../../utils/naviAi"; 
import VakiAvatar from "./VakiAvatar";

function NaviChat() {
  const [userData, setUserData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isNaviTyping, setIsNaviTyping] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
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

          if (diffHours > 12 && !hasIntroduced.current) {
            hasIntroduced.current = true;
            initiateProactiveGreeting(user.uid, messages);
          }
        }
      }
    });

    return () => {
      unsubUser();
      unsubChat();
    };
  }, [navigate]);

  const sendFirstIntroduction = async (uid) => {
    setIsNaviTyping(true);
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const data = userSnap.data();
      const name = data?.nama?.split(' ')[0] || "Navigator";
      const memory = data?.navi_memory || "";
      const introPrompt = `Kenalkan dirimu sebagai NAVI kepada ${name}. Jika ada memori: "${memory}", bahas dikit. Gunakan gaya Gen-Z Savage tapi peduli. Maks 18 kata.`;
      const response = await getNaviResponse(data, [], introPrompt, memory);
      if (response) {
        await addDoc(collection(db, "users", uid, "navi_memory"), { 
          role: "navi", message: response, timestamp: serverTimestamp() 
        });
      }
    } catch (error) { console.error("Intro Error:", error); } 
    finally { setIsNaviTyping(false); }
  };

  const initiateProactiveGreeting = async (uid, history) => {
    if (isNaviTyping) return;
    setIsNaviTyping(true);
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      const data = userSnap.data();
      const memory = data?.navi_memory || "";
      const proactivePrompt = `Sapa kembali ${data.nama.split(' ')[0]} karena sudah lama tidak muncul. Jika ada memori penting: "${memory}", tanyakan kabarnya. Singkat & Savage.`;
      const response = await getNaviResponse(data, history, proactivePrompt, memory);
      if (response) {
        await addDoc(collection(db, "users", uid, "navi_memory"), { 
          role: "navi", message: response, timestamp: serverTimestamp() 
        });
      }
    } catch (error) { console.error("Greeting Error:", error); } 
    finally { setIsNaviTyping(false); }
  };

  const handleResetChat = async () => {
    setIsResetting(true);
    setShowDeleteModal(false);
    try {
      const chatRef = collection(db, "users", userData.docId, "navi_memory");
      const snapshot = await getDocs(chatRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      batch.update(doc(db, "users", userData.docId), { navi_memory: "" });
      await batch.commit();
      hasIntroduced.current = false;
    } catch (error) { alert("Radar macet! Gagal reset."); } 
    finally { setIsResetting(false); }
  };

  const handleSendChat = async () => {
    if (!inputMessage.trim() || isNaviTyping || isCooldown || !userData) return;
    const userMsg = inputMessage.trim();
    const currentMemory = userData.navi_memory || "";
    setInputMessage("");
    setIsNaviTyping(true);
    try {
      const chatRef = collection(db, "users", userData.docId, "navi_memory");
      await addDoc(chatRef, { role: "user", message: userMsg, timestamp: serverTimestamp() });
      const response = await getNaviResponse(userData, chatHistory, userMsg, currentMemory);
      if (response) {
        await addDoc(chatRef, { role: "navi", message: response, timestamp: serverTimestamp() });
        const newMemory = await updateNaviMemory(currentMemory, `User: ${userMsg} | Navi: ${response}`);
        await updateDoc(doc(db, "users", userData.docId), { navi_memory: newMemory });
      }
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 2000); 
    } catch (error) { console.error("Chat Error:", error); } 
    finally { setIsNaviTyping(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white font-sans italic overflow-hidden">
      
      {/* EFEK GLITCH SAAT WIPING DATA */}
      <AnimatePresence>
        {isResetting && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-red-600/10 backdrop-blur-[2px] pointer-events-none flex items-center justify-center"
          >
            <motion.div 
              animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.2 }}
              className="text-red-500 font-black text-xs tracking-[0.2em] uppercase"
            >
              Wiping Memory...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS CUSTOM */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <HiExclamation size={32} className="text-red-500 animate-pulse" />
              </div>
              <h3 className="text-center font-black text-lg uppercase tracking-tight mb-2 text-white">Kosongkan Memori?</h3>
              <p className="text-center text-[11px] text-slate-400 font-medium leading-relaxed mb-6 px-4 italic">
                Navigator, menghapus history berarti menghapus jejak percakapan kita. Masa depan butuh ruang baru, tapi kenangan kita tetap abadi di radar. Yakin mau reset?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleResetChat}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase transition-all shadow-lg shadow-red-600/20"
                >
                  Hapus Jejak
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 h-20 z-[100] p-5 flex items-center justify-between border-b border-white/10 bg-[#020617]/95 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/anggota-dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90">
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
          onClick={() => setShowDeleteModal(true)}
          disabled={isResetting || chatHistory.length === 0}
          className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl transition-all disabled:opacity-20"
        >
          <HiOutlineTrash size={20} className={isResetting ? "animate-spin" : ""} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto mt-20 p-4 space-y-6 custom-scroll bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed pb-32">
        <div className="flex flex-col space-y-6">
          <AnimatePresence mode="popLayout">
            {chatHistory.map((chat) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ 
                  opacity: 0, 
                  scale: 0.5, 
                  x: chat.role === 'user' ? 100 : -100,
                  transition: { duration: 0.3 }
                }}
                key={chat.id} 
                className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold leading-relaxed shadow-2xl relative whitespace-pre-wrap ${
                  chat.role === 'user' ? 'bg-gradient-to-br from-red-600 to-red-800 text-white rounded-tr-none' : 'bg-slate-800/80 backdrop-blur-md text-slate-100 rounded-tl-none border border-white/5 shadow-xl shadow-black/20'
                }`}>
                  {chat.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-5 bg-[#020617] border-t border-white/5 z-[110]">
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-slate-800 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center">
            <input 
              type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder={isCooldown ? "Navi memproses..." : "Ketik koordinat pesan..."}
              disabled={isCooldown || isNaviTyping || isResetting}
              className="w-full bg-slate-900/90 border border-white/10 rounded-full py-4 px-6 pr-14 text-xs font-bold focus:outline-none focus:border-red-600 transition-all text-white placeholder:text-slate-700 shadow-2xl"
            />
            <button onClick={handleSendChat} disabled={!inputMessage.trim() || isNaviTyping || isCooldown || isResetting}
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