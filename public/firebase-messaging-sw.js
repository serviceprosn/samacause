// Firebase Cloud Messaging Background Service Worker & Offline PWA Cache
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

// PWA OFFLINE CACHING CAPABILITIES
const CACHE_NAME = 'sunu-yite-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
];

// Service Worker Install: Cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Service Worker Activation: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Service Worker Fetch Interceptor: Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip supabase queries, paytech API calls, email sending, cloudflare check, and external firebase messaging API
  if (
    url.origin.includes('supabase.co') || 
    url.pathname.includes('/api/') || 
    url.pathname.includes('cdn-cgi') || 
    url.origin.includes('firebase')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, cache it dynamically for static resources
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed (offline), resolve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and browsing pages, return main HTML template
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
