/*
 * Service Worker der internen Plattform.
 * Bewusst zurückhaltend: Es werden KEINE personenbezogenen Daten oder Seiten
 * zwischengespeichert – nur statische Build-Dateien und eine Offline-Seite.
 * Ungespeicherte Formulareingaben sichert die App selbst lokal.
 */
const VERSION = 'frey-ops-v2'
const OFFLINE_URL = '/intern/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll([OFFLINE_URL, '/intern/icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Seitenaufrufe: immer Netzwerk, bei Ausfall Offline-Hinweis
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Unveränderliche Build-Dateien (Hash im Namen): Cache zuerst
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      }),
    )
  }
})
