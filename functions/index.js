const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendSOSNotification = functions.firestore
  .document("sos_signals/{signalId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const namaAnggota = data.nama || "Seorang Anggota";

    // 1. Pesan Notifikasi
    const payload = {
      notification: {
        title: "⚠️ DARURAT: SINYAL SOS!",
        body: `${namaAnggota} mengirim sinyal bahaya! Segera buka radar monitoring.`,
        icon: "https://cdn-icons-png.flaticon.com/128/595/595067.png",
        clickAction: "https://laskar-bahari-app.web.app/pembina/monitor-sos", // Ganti dengan URL aplikasi Anda
      },
      data: {
        type: "SOS_ALERT",
        signalId: context.params.signalId
      }
    };

    try {
      // 2. Ambil semua token FCM milik user dengan role 'pembina' atau 'admin'
      const usersSnapshot = await admin.firestore()
        .collection("users")
        .where("role", "in", ["pembina", "admin"])
        .get();

      const tokens = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log("Tidak ada token pembina ditemukan.");
        return null;
      }

      // 3. Kirim ke semua token
      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log(`Notifikasi terkirim ke ${tokens.length} pembina.`, response);
      return null;
    } catch (error) {
      console.error("Gagal mengirim notifikasi:", error);
      return null;
    }
  });