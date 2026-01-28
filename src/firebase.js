import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage"; // 1. Tambahkan import Storage

const firebaseConfig = {
  apiKey: "AIzaSyB5sjUSKCuno_vYp_PlX0nMotub0cGOXoc",
  authDomain: "pramuka-digital-app.firebaseapp.com",
  projectId: "pramuka-digital-app",
  storageBucket: "pramuka-digital-app.firebasestorage.app",
  messagingSenderId: "315546220759",
  appId: "1:315546220759:web:ba35bc4a519a86cb889892",
  measurementId: "G-Q8RGWCC6VT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Ekspor layanan agar bisa dipanggil di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Ekspor layanan Storage