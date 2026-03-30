'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeEvent } from '@/lib/events/types'

type EventHandler<T extends RealtimeEvent['type']> = (
  event: Extract<RealtimeEvent, { type: T }>
) => void

interface UseRealtimeEventsOptions {
  onJobStatusChanged?: EventHandler<'JOB_STATUS_CHANGED'>
  onJobProgressUpdated?: EventHandler<'JOB_PROGRESS_UPDATED'>
  onPhotoUploaded?: EventHandler<'PHOTO_UPLOADED'>
  onChecklistUpdated?: EventHandler<'CHECKLIST_UPDATED'>
  onAmcVisitCompleted?: EventHandler<'AMC_VISIT_COMPLETED'>
  onPaymentReceived?: EventHandler<'PAYMENT_RECEIVED'>
  onNotificationCreated?: EventHandler<'NOTIFICATION_CREATED'>
  onAnyEvent?: (event: RealtimeEvent) => void
  enabled?: boolean
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const { enabled = true } = options
  const optionsRef = useRef(options)
  optionsRef.current = options

  const handleEvent = useCallback((event: RealtimeEvent) => {
    const opts = optionsRef.current
    opts.onAnyEvent?.(event)

    switch (event.type) {
      case 'JOB_STATUS_CHANGED':
        opts.onJobStatusChanged?.(event)
        break
      case 'JOB_PROGRESS_UPDATED':
        opts.onJobProgressUpdated?.(event)
        break
      case 'PHOTO_UPLOADED':
        opts.onPhotoUploaded?.(event)
        break
      case 'CHECKLIST_UPDATED':
        opts.onChecklistUpdated?.(event)
        break
      case 'AMC_VISIT_COMPLETED':
        opts.onAmcVisitCompleted?.(event)
        break
      case 'PAYMENT_RECEIVED':
        opts.onPaymentReceived?.(event)
        break
      case 'NOTIFICATION_CREATED':
        opts.onNotificationCreated?.(event)
        break
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let eventSource: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0
    const maxRetry = 5

    function connect() {
      eventSource = new EventSource('/api/events/stream')

      eventSource.onopen = () => {
        retryCount = 0
      }

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'CONNECTED') return
          handleEvent(data as RealtimeEvent)
        } catch {
          // Ignore parse errors (heartbeats, etc.)
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        if (retryCount < maxRetry) {
          retryCount++
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
          retryTimeout = setTimeout(connect, delay)
        }
      }
    }

    connect()

    return () => {
      eventSource?.close()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [enabled, handleEvent])
}
