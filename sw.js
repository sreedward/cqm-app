const CACHE_VERSION = 'v4'
const STATIC_CACHE = `cqm-static-${CACHE_VERSION}`
const API_CACHE    = `cqm-api-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/index.html',
  '/medleys.html',
  '/medley-view.html',
  '/setlist.html',
  '/setlist-view.html',
  '/song.html',
  '/library.html',
  '/login.html',
  '/manifest.json',
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
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Supabase API â Network First, URL-keyed cache as offline fallback
  if (url.hostname === SUPABASE_HOST && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request.clone())
        .then(response => {
          if (response && response.status === 200) {
            caches.open(API_CACHE)
              .then(c => c.put(e.request.url, response.clone()))
          }
          return response
        })
        .catch(() =>
          caches.open(API_CACHE).then(c => c.match(e.request.url))
        )
    )
    return
  }

  // Static assets â Cache First, update in background
  if (url.origin === self.location.origin && e.request.method === 'GET') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const net = fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              caches.open(STATIC_CACHE)
                .then(c => c.put(e.request, res.clone()))
            }
            return res
          })
          .catch(() => cached)
        return cached || net
      })
    )
  }
})
