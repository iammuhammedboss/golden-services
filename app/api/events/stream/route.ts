import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eventBus } from '@/lib/events/event-bus'
import type { RealtimeEvent } from '@/lib/events/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = session.user as any
  const userId = user.id
  const userRoles: string[] = user.roles || []

  // Managers/owners see all events; field workers see filtered events
  const isManager = userRoles.some((r: string) =>
    ['OWNER', 'OPERATIONS_MANAGER', 'ACCOUNTANT', 'AUDITOR'].includes(r)
  )

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', userId })}\n\n`)
      )

      // Heartbeat every 30s to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          // Stream closed
        }
      }, 30000)

      // Subscribe to events
      unsubscribe = eventBus.onRealtimeEvent((event: RealtimeEvent) => {
        // Filter events for non-manager users
        if (!isManager) {
          // Notifications: only send if targeted to this user or their role
          if (event.type === 'NOTIFICATION_CREATED') {
            if (
              event.recipientUserId !== userId &&
              (!event.recipientRole || !userRoles.includes(event.recipientRole))
            ) {
              return
            }
          }
        }

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          )
        } catch {
          // Stream closed, cleanup will handle
        }
      })
    },
    cancel() {
      if (unsubscribe) unsubscribe()
      if (heartbeatInterval) clearInterval(heartbeatInterval)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
