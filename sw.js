const CACHE_NAME = 'tfe-studio-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/image/optimized/logo-400.webp',
  '/image/optimized/hero-400.webp',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
];

// Define a network timeout duration (e.g., 10 seconds) - Increased for potentially slower mobile networks
const NETWORK_TIMEOUT = 10000; // Increased timeout again

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
      .catch(error => console.error('Service worker installation failed:', error)) // Log installation errors
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Claim clients to take control immediately
    .catch(error => console.error('Service worker activation failed:', error)) // Log activation errors
  );
});

// Fetch event - prioritize network, fallback to cache, with specific offline fallback for navigation
self.addEventListener('fetch', event => {
  // Ignore requests for chrome-extension:// or other non-http(s) schemes
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // For navigation requests (main page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Try the network first with a timeout
      Promise.race([
        fetch(event.request),
        new Promise((_, reject) =>
          setTimeout(() => reject('Network timeout'), NETWORK_TIMEOUT)
        )
      ])
      .then(response => {
        // If network request is successful, cache it and return the response
        if (response && response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }
        // If network request fails (e.g., 404, 500), try cache
        return caches.match(event.request);
      })
      .catch(() => {
        // Network failed or timed out, try cache. If that also fails, serve the offline page.
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response; // Serve from cache if available
            } else {
              // If not in cache, serve the explicitly cached index.html as the offline fallback
              console.log('Serving offline fallback for navigation:', event.request.url);
              return caches.match('/index.html');
            }
          });
      })
      .catch(error => {
         // Final catch for any errors during the fallback process
         console.error('Navigation fetch failed completely:', event.request.url, error);
         // Return a generic network error response as a last resort
         return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
  }
  // For all other requests (images, CSS, JS, etc.)
  else {
     event.respondWith(
       // Try the network first with a timeout
       Promise.race([
         fetch(event.request),
         new Promise((_, reject) =>
           setTimeout(() => reject('Network timeout'), NETWORK_TIMEOUT)
         )
       ])
       .then(response => {
         // If network request is successful, cache it and return the response
         if (response && response.ok) {
           const responseToCache = response.clone();
           caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, responseToCache);
           });
         }
         return response; // Return network response even if not OK
       })
       .catch(() => {
         // Network failed or timed out, try cache
         return caches.match(event.request);
       })
       .then(response => {
          // If response from network (even if not ok) or cache is available, return it.
          if (response) {
            return response;
          } else {
             // If both network and cache fail, return a generic network error response
             console.error('Resource fetch failed network and cache:', event.request.url);
             return new Response(null, { status: 503, statusText: 'Service Unavailable' });
          }
       })
       .catch(error => {
          // Final catch for any errors during resource fetch/cache
          console.error('Resource fetch failed completely:', event.request.url, error);
          return new Response(null, { status: 500, statusText: 'Service Worker Error' });
       })
     );
  }
}); 