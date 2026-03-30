'use client'

import { useOfflineSync } from '@/hooks/use-offline-sync'

export function OfflineIndicator() {
  const { isOnline, pendingCount, syncing, syncQueue } = useOfflineSync()

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto">
      <div
        className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
          !isOnline
            ? 'bg-red-500 text-white'
            : syncing
            ? 'bg-blue-500 text-white'
            : 'bg-amber-500 text-white'
        }`}
      >
        {!isOnline ? (
          <>
            <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            <span>Offline</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {pendingCount} pending
              </span>
            )}
          </>
        ) : syncing ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <span>{pendingCount} pending sync</span>
            <button
              onClick={syncQueue}
              className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
            >
              Sync Now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
