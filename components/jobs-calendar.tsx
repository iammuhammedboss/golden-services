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

interface JobEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    jobNumber: string
    status: string
    clientName: string
    siteName: string
  }
}

interface JobsCalendarProps {
  jobs: any[]
  onSelectEvent?: (event: JobEvent) => void
}

export function JobsCalendar({ jobs, onSelectEvent }: JobsCalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  // Handle event drag and drop
  const handleEventDrop = async ({
    event,
    start,
    end,
  }: {
    event: JobEvent
    start: Date
    end: Date
  }) => {
    try {
      // Update job scheduled date via API
      const response = await fetch(`/api/jobs/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: start.toISOString().split('T')[0],
          scheduledStartTime: start.toISOString(),
          scheduledEndTime: end.toISOString(),
        }),
      })

      if (response.ok) {
        // Refresh page to show updated event
        window.location.reload()
      } else {
        alert('Failed to reschedule job')
      }
    } catch (error) {
      console.error('Error rescheduling job:', error)
      alert('Failed to reschedule job')
    }
  }

  // Transform jobs into calendar events
  const events: JobEvent[] = jobs.map((job) => {
    const startDate = new Date(job.scheduledDate)

    // If we have start time, use it
    if (job.scheduledStartTime) {
      const startTime = new Date(job.scheduledStartTime)
      startDate.setHours(startTime.getHours(), startTime.getMinutes())
    }

    const endDate = new Date(job.scheduledDate)

    // If we have end time, use it; otherwise add 2 hours to start
    if (job.scheduledEndTime) {
      const endTime = new Date(job.scheduledEndTime)
      endDate.setHours(endTime.getHours(), endTime.getMinutes())
    } else if (job.scheduledStartTime) {
      const startTime = new Date(job.scheduledStartTime)
      endDate.setHours(startTime.getHours() + 2, startTime.getMinutes())
    } else {
      endDate.setHours(23, 59)
    }

    return {
      id: job.id,
      title: `${job.jobNumber} - ${job.client.name}`,
      start: startDate,
      end: endDate,
      resource: {
        jobNumber: job.jobNumber,
        status: job.status,
        clientName: job.client.name,
        siteName: job.site.name,
      },
    }
  })

  // Style events based on status
  const eventStyleGetter = (event: JobEvent) => {
    let backgroundColor = '#3174ad'

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
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-orange-500"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  )
}
