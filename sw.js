const CACHE_VERSION = 'v10'
const STATIC_CACHE = `cqm-static-${CACHE_VERSION}`
const API_CACHE    = `cqm-api-${CACHE_VERSION}`
const STATIC_ASSETS = [
  '/manifest.json',
]
const SUPABASE_HOST = 'kzqnsbztfyhyyageuboz.supabase.co'

self.addEventListener('install', e => {
  e.waitUntil(
    self.skipWaiting()
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(async () => {
      await self.clients.claim()
      const allClients = await self.clients.matchAll({ type: 'window' })
      allClients.forEach(c => { try { c.navigate(c.url) } catch(err) {} })
    })
  )
})


self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)

  // Supabase API GET - Stale-While-Revalidate
  // Returns cached data immediately; updates cache in background
  if (req.method === 'GET' && url.hostname === SUPABASE_HOST) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE)
      const cached = await cache.match(req)
      const tableName = url.pathname.split('/').filter(Boolean)[2] || ''
      const networkPromise = fetch(req.clone()).then(async res => {
        if (res.ok) {
          await cache.put(req, res.clone())
          if (tableName === 'medleys' || tableName === 'setlists') {
            const clients = await self.clients.matchAll({ type: 'window' })
            clients.forEach(c => c.postMessage({ type: 'DATA_UPDATED', table: tableName }))
          }
        }
        return res
      }).catch(() => null)
      if (cached) { networkPromise; return cached }
      return await networkPromise || new Response('Offline', { status: 503 })
    })())
    return
  }

  503 })
    })())
    return
  }

    // HTML pages - Network-first (always get fresh HTML)
    if (req.method === 'GET' && url.origin === self.location.origin && url.pathname.endsWith('.html')) {
      event.respondWith(
        fetch(req).then(res => {
          if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(req, res.clone()))
          return res
        }).catch(() => caches.match(req))
      )
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

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'INVALIDATE_CACHE') {
    const pattern = event.data.pattern
    caches.open(API_CACHE).then(cache => {
      cache.keys().then(keys =>
        keys.filter(k => k.url.includes(pattern)).forEach(k => cache.delete(k))
      )
    })
  }
})
