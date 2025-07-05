// Service Worker for Wedding Invitation PWA
const CACHE_NAME = 'wedding-invitation-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/undangan.css',
  '/js/undangan.js',
  '/manifest.json',
  // External resources
  'https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap',
  'https://unpkg.com/@phosphor-icons/web@2.0.3/src/fill/style.css',
  // Media files
  '/media/bg.webp',
  '/media/tl.webp',
  '/media/tr.webp',
  '/media/tl-2.webp',
  '/media/tr-2.webp',
  '/media/bl-1.webp',
  '/media/bl-2.webp',
  '/media/bl-3.webp',
  '/media/br-1.webp',
  '/media/br-2.webp',
  '/media/br-3.webp',
  '/media/bm.webp',
  '/media/gunungan.webp',
  '/media/sinta.webp',
  '/media/rama.webp',
  '/media/27897-gallery-1672939613.png',
  '/media/301467-gallery-rNpYuhv9jd.png',
  '/media/301467-gallery-FMgCPTNp2h.png',
  '/media/female-1-1687991981.webp',
  '/media/male-1-1687991959.webp',
  '/media/bca-logo.png',
  '/media/mandiri-logo.png',
  '/media/jawa-happy-javanese-backsound-mp3cutnet.mp3'
];

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
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
    }).then(() => {
      console.log('Service Worker: Activation completed');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed', error);
        
        // Return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        // For other resources, return a basic error response
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Background sync for RSVP submissions
self.addEventListener('sync', event => {
  if (event.tag === 'rsvp-submission') {
    event.waitUntil(syncRsvpSubmissions());
  }
});

// Function to sync RSVP submissions when online
async function syncRsvpSubmissions() {
  try {
    // Get pending RSVP submissions from IndexedDB or localStorage
    const pendingSubmissions = JSON.parse(localStorage.getItem('pending_rsvps') || '[]');
    
    for (const submission of pendingSubmissions) {
      try {
        // Send to your backend API
        const response = await fetch('/api/rsvp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission)
        });
        
        if (response.ok) {
          // Remove from pending list
          const updatedPending = pendingSubmissions.filter(item => item.id !== submission.id);
          localStorage.setItem('pending_rsvps', JSON.stringify(updatedPending));
          console.log('RSVP synced successfully:', submission.id);
        }
      } catch (error) {
        console.error('Failed to sync RSVP:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncRsvpSubmissions:', error);
  }
}

// Handle push notifications (if implementing)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/media/icons/icon-192x192.png',
      badge: '/media/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Buka Undangan',
          icon: '/media/icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Tutup',
          icon: '/media/icons/close-icon.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Share target (if implementing Web Share Target API)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(handleSharedContent(event.request));
  }
});

async function handleSharedContent(request) {
  const formData = await request.formData();
  const title = formData.get('title');
  const text = formData.get('text');
  const url = formData.get('url');
  
  // Process shared content
  console.log('Shared content:', { title, text, url });
  
  // Redirect to main app
  return Response.redirect('/', 303);
}

// Periodic background sync (if implementing)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-invitation') {
    event.waitUntil(updateInvitationContent());
  }
});

async function updateInvitationContent() {
  try {
    // Check for updates to invitation content
    const response = await fetch('/api/invitation-updates');
    if (response.ok) {
      const updates = await response.json();
      
      // Update cached content if needed
      if (updates.hasUpdates) {
        console.log('Updating invitation content...');
        // Implementation depends on your update strategy
      }
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker: Script loaded');