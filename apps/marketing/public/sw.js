// Service Worker for Performance Optimization
const CACHE_NAME = 'aicomply-v1';
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.destination === 'document') {
    // For navigation requests, use network-first strategy
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/'))
    );
  } else {
    // For other requests, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});