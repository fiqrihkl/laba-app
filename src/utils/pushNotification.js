/**
 * Utilitas Notifikasi Lokal Laskar Bahari
 * Dikembangkan oleh: Fiqri Haikal
 */

// 1. Fungsi untuk meminta izin notifikasi ke sistem HP/Browser
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Browser ini tidak mendukung notifikasi desktop.");
    return false;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return Notification.permission === "granted";
};

// 2. Fungsi inti untuk mengirim popup ke panel notifikasi
export const sendPushNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    const options = {
      body: body,
      icon: "https://cdn-icons-png.flaticon.com/128/595/595067.png", // Icon Pramuka
      badge: "https://cdn-icons-png.flaticon.com/128/595/595067.png",
      vibrate: [200, 100, 200],
      tag: "laskar-bahari-alert", // Menghindari spam jika notif muncul beruntun
      requireInteraction: false // Notif akan hilang sendiri setelah beberapa saat
    };

    try {
      new Notification(title, options);
    } catch (error) {
      console.error("Gagal mengirim notifikasi lokal:", error);
    }
  }
};