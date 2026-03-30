import { EventEmitter } from 'events'
import type { RealtimeEvent } from './types'

class AppEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  emitRealtimeEvent(event: RealtimeEvent) {
    this.emit('realtime', event)
  }

  onRealtimeEvent(callback: (event: RealtimeEvent) => void) {
    this.on('realtime', callback)
    return () => this.off('realtime', callback)
  }
}

// Singleton pattern (survives hot reload in dev)
const globalForEvents = globalThis as unknown as { eventBus: AppEventBus }

export const eventBus = globalForEvents.eventBus ?? new AppEventBus()

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.eventBus = eventBus
}
