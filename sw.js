const CACHE_VERSION = 'v6'
const STATIC_CACHE = `cqm-static-${CACHE_VERSION}`
const API_CACHE    = `cqm-api-${CACHE_VERSION}`
const STATIC_ASSETS = [
  '/index.html', '/medleys.html', '/medley-view.html',
  '/setlist.html', '/setlist-view.html', '/song.html',
  '/library.html', '/login.html', '/manifest.json',
]
const SUPABASE_HOST = 'kzqnsbztfyhyyageuboz.supabase.co'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)

  // Supabase API GET â Stale-While-Revalidate
  // Returns cached data immediately; updates cache in background
  if (req.method === 'GET' && url.hostname === SUPABASE_HOST) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE)
      const cached = await cache.match(req)
      const networkPromise = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone())
        return res
      }).catch(() => null)
      // If we have cached data, return it instantly and update in background
      if (cached) {
        networkPromise // fire-and-forget update
        return cached
      }
      // No cache yet â wait for network
      return await networkPromise || new Response('Offline', { status: 503 })
    })())
    return
  }

  // Same-origin GET â Cache First for static assets
  if (req.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res.ok) {
          caches.open(STATIC_CACHE).then(c => c.put(req, res.clone()))
        }
        return res
      }))
    )
    return
  }
})
