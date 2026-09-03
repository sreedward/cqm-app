// CQM Service Worker - PWA
const CACHE_VERSION = 'v3';
const STATIC_CACHE = 'cqm-static-v3';
const DYNAMIC_CACHE = 'cqm-dynamic-v3';

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
