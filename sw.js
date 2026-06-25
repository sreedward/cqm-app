// CQM Service Worker - PWA
const CACHE_VERSION = 'v1';
const STATIC_CACHE = 'cqm-static-v1';
const DYNAMIC_CACHE = 'cqm-dynamic-v1';

const STATIC_ASSETS = [
  '/',
    '/index.html',
      '/login.html',
        '/library.html',
          '/setlist.html',
            '/setlist-view.html',
              '/song.html',
                '/more.html',
                  '/profile.html',
                    '/manifest.json',
                      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js',
                        'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
                        ];

                        self.addEventListener('install', event => {
                          event.waitUntil(
                              caches.open(STATIC_CACHE)
                                    .then(cache => cache.addAll(STATIC_ASSETS))
                                          .then(() => self.skipWaiting())
                                            );
                                            });

                                            self.addEventListener('activate', event => {
                                              event.waitUntil(
                                                  caches.keys().then(keys =>
                                                        Promise.all(
                                                                keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
                                                                            .map(k => caches.delete(k))
                                                                                  )
                                                                                      ).then(() => self.clients.claim())
                                                                                        );
                                                                                        });

                                                                                        self.addEventListener('fetch', event => {
                                                                                          const req = event.request;
                                                                                            const url = new URL(req.url);

                                                                                              if (req.method !== 'GET') return;
                                                                                                if (!url.protocol.startsWith('http')) return;

                                                                                                  // Supabase API - Network with cache fallback
                                                                                                    if (url.hostname.includes('supabase.co')) {
                                                                                                        event.respondWith(
                                                                                                              fetch(req).catch(() => caches.match(req))
                                                                                                                  );
                                                                                                                      return;
                                                                                                                        }
                                                                                                                        
                                                                                                                          // HTML pages - Network First
                                                                                                                            const acceptHeader = req.headers.get('accept') || '';
                                                                                                                              if (acceptHeader.includes('text/html')) {
                                                                                                                                  event.respondWith(networkFirst(req));
                                                                                                                                      return;
                                                                                                                                        }
                                                                                                                                        
                                                                                                                                          // Static assets - Cache First
                                                                                                                                            if (req.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)(\?|$)/)) {
                                                                                                                                                event.respondWith(cacheFirst(req));
                                                                                                                                                    return;
                                                                                                                                                      }
                                                                                                                                                      
                                                                                                                                                        // External CDN - Cache First
                                                                                                                                                          if (url.hostname !== location.hostname) {
                                                                                                                                                              event.respondWith(cacheFirst(req));
                                                                                                                                                                  return;
                                                                                                                                                                    }
                                                                                                                                                                    
                                                                                                                                                                      event.respondWith(networkFirst(req));
                                                                                                                                                                      });
                                                                                                                                                                      
                                                                                                                                                                      async function cacheFirst(req) {
                                                                                                                                                                        const cached = await caches.match(req);
                                                                                                                                                                          if (cached) return cached;
                                                                                                                                                                            try {
                                                                                                                                                                                const res = await fetch(req);
                                                                                                                                                                                    if (res.ok) {
                                                                                                                                                                                          const cache = await caches.open(STATIC_CACHE);
                                                                                                                                                                                                cache.put(req, res.clone());
                                                                                                                                                                                                    }
                                                                                                                                                                                                        return res;
                                                                                                                                                                                                          } catch (e) {
                                                                                                                                                                                                              return new Response('Offline', { status: 503 });
                                                                                                                                                                                                                }
                                                                                                                                                                                                                }
                                                                                                                                                                                                                
                                                                                                                                                                                                                async function networkFirst(req) {
                                                                                                                                                                                                                  try {
                                                                                                                                                                                                                      const res = await fetch(req);
                                                                                                                                                                                                                          if (res.ok) {
                                                                                                                                                                                                                                const cache = await caches.open(DYNAMIC_CACHE);
                                                                                                                                                                                                                                      cache.put(req, res.clone());
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                              return res;
                                                                                                                                                                                                                                                } catch (e) {
                                                                                                                                                                                                                                                    const cached = await caches.match(req);
                                                                                                                                                                                                                                                        if (cached) return cached;
                                                                                                                                                                                                                                                            const fallback = await caches.match('/library.html');
                                                                                                                                                                                                                                                                return fallback || new Response('Sin conexion', { status: 503 });
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                  self.addEventListener('message', event => {
                                                                                                                                                                                                                                                                    if (event.data && event.data.type === 'SKIP_WAITING') {
                                                                                                                                                                                                                                                                        self.skipWaiting();
                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                          });
