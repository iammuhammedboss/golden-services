'use client'

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useState } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

const DnDCalendar = withDragAndDrop(Calendar)

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export interface ScheduleEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    type: 'job' | 'site-visit'
    status: string
  }
}

interface ScheduleCalendarProps {
  events: ScheduleEvent[]
  onSelectEvent?: (event: ScheduleEvent) => void
}

export function ScheduleCalendar({ events, onSelectEvent }: ScheduleCalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  // Handle event drag and drop
  const handleEventDrop = async ({
    event,
    start,
    end,
  }: {
    event: ScheduleEvent
    start: Date
    end: Date
  }) => {
    try {
        const url = event.resource.type === 'job' ? `/api/jobs/${event.id}` : `/api/site-visits/${event.id}`
        const body = event.resource.type === 'job' 
            ? {
                scheduledDate: start.toISOString().split('T')[0],
                scheduledStartTime: start.toISOString(),
                scheduledEndTime: end.toISOString(),
              }
            : {
                scheduledAt: start.toISOString(),
            }

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Failed to reschedule event')
      }
    } catch (error) {
      console.error('Error rescheduling event:', error)
      alert('Failed to reschedule event')
    }
  }

  // Style events based on status
  const eventStyleGetter = (event: ScheduleEvent) => {
    let backgroundColor = '#3174ad'
    if(event.resource.type === 'job') {
        switch (event.resource.status) {
            case 'SCHEDULED':
              backgroundColor = '#3b82f6' // blue
              break
            case 'IN_PROGRESS':
              backgroundColor = '#f59e0b' // orange
              break
            case 'COMPLETED':
              backgroundColor = '#10b981' // green
              break
            case 'CANCELLED':
              backgroundColor = '#ef4444' // red
              break
          }
    } else {
        switch (event.resource.status) {
            case 'SCHEDULED':
              backgroundColor = '#8b5cf6' // purple
              break
            case 'COMPLETED':
              backgroundColor = '#10b981' // green
              break
            case 'CANCELLED':
              backgroundColor = '#ef4444' // red
              break
          }
    }
    

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  return (
    <div className="h-[700px] rounded-lg bg-white p-4">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor={(event: any) => event.start}
        endAccessor={(event: any) => event.end}
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter as any}
        onSelectEvent={onSelectEvent as any}
        onEventDrop={handleEventDrop as any}
        onEventResize={handleEventDrop as any}
        draggableAccessor={() => true}
        resizable
        popup
        views={['month', 'week', 'day']}
      />

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500"></div>
          <span>Job Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-purple-500"></div>
          <span>Site Visit</span>
        </div>
      </div>
    </div>
  )
}
