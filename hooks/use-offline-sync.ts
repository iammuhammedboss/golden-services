'use client'

import { useEffect, useState, useCallback } from 'react'

interface QueueItem {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string
  timestamp: string
}

const QUEUE_KEY = 'gs-offline-queue'

function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function setQueue(items: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    setPendingCount(getQueue().length)

    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      syncQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_QUEUE_ADD') {
        const queue = getQueue()
        queue.push(event.data.item)
        setQueue(queue)
        setPendingCount(queue.length)
      }

      if (event.data?.type === 'SYNC_RESULTS') {
        const results = event.data.results as Array<{
          id: string
          success: boolean
        }>
        const successIds = results
          .filter((r) => r.success)
          .map((r) => r.id)
        const queue = getQueue().filter((item) => !successIds.includes(item.id))
        setQueue(queue)
        setPendingCount(queue.length)
        setSyncing(false)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err)
      })
    }
  }, [])

  const syncQueue = useCallback(async () => {
    const queue = getQueue()
    if (queue.length === 0 || !navigator.onLine) return

    setSyncing(true)

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_QUEUE',
        items: queue,
      })
    } else {
      // Fallback: sync directly
      const successIds: string[] = []
      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body,
          })
          if (res.ok) successIds.push(item.id)
        } catch {
          // Keep in queue
        }
      }
      const remaining = queue.filter((item) => !successIds.includes(item.id))
      setQueue(remaining)
      setPendingCount(remaining.length)
      setSyncing(false)
    }
  }, [])

  return { isOnline, pendingCount, syncing, syncQueue }
}
