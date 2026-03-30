import { eventBus } from './event-bus'
import type { RealtimeEvent } from './types'

export function emitEvent(event: RealtimeEvent) {
  eventBus.emitRealtimeEvent(event)
}
