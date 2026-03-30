const CACHE_NAME = 'golden-services-v1'
const OFFLINE_QUEUE_KEY = 'gs-offline-queue'

// Cache essential assets for offline access
const STATIC_ASSETS = [
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Intercept API requests and queue them if offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // For API POST/PUT/PATCH requests, queue if offline
  if (
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH'].includes(event.request.method)
  ) {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        // Offline - queue the request
        const body = await event.request.clone().text()
        const queueItem = {
          id: Date.now().toString(),
          url: event.request.url,
          method: event.request.method,
          headers: Object.fromEntries(event.request.headers.entries()),
          body,
          timestamp: new Date().toISOString(),
        }

        // Store in IndexedDB via message to client
        const clients = await self.clients.matchAll()
        clients.forEach((client) => {
          client.postMessage({
            type: 'OFFLINE_QUEUE_ADD',
            item: queueItem,
          })
        })

        return new Response(
          JSON.stringify({
            success: true,
            offline: true,
            message: 'Request queued for sync',
            queueId: queueItem.id,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      })
    )
    return
  }

  // For GET requests to API, try network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses for offline viewing
          if (event.request.method === 'GET' && response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(event.request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ error: 'Offline', offline: true }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              })
          )
        })
    )
    return
  }
})

// Listen for sync events
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_QUEUE') {
    syncQueue(event.data.items)
  }
})

async function syncQueue(items) {
  const results = []
  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })

      results.push({
        id: item.id,
        success: response.ok,
        status: response.status,
      })
    } catch {
      results.push({ id: item.id, success: false, status: 0 })
    }
  }

  // Notify clients of sync results
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_RESULTS', results })
  })
}
