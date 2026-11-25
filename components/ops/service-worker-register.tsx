'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/intern/sw.js', { scope: '/intern/' }).catch(() => {
      // Ohne Service Worker funktioniert die App weiterhin (nur ohne Offline-Seite).
    })
  }, [])
  return null
}
