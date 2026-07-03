// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker context
firebase.initializeApp({
  apiKey: "AIzaSyCWvuDRexrbZbEusRfhWWYUrjYEyBBD2ZA",
  authDomain: "sunuyite-6a7ac.firebaseapp.com",
  projectId: "sunuyite-6a7ac",
  storageBucket: "sunuyite-6a7ac.firebasestorage.app",
  messagingSenderId: "887808926036",
  appId: "1:887808926036:web:7eb61aecd57a986287a8c1"
});

const messaging = firebase.messaging();

// Handle background notification triggers
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Sunu Yité';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nouveau message ou alerte.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
