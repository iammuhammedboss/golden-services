'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScheduleEntryType, ScheduleEntryStatus } from '@prisma/client'
import { ScheduleEvent, User } from '@/types/schedule'
import { ScheduleDetailView } from '@/components/schedule/schedule-detail-view'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { ScheduleForm } from '@/components/schedule/schedule-form'

const localizer = momentLocalizer(moment)
type TView = 'calendar' | 'list'

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH)
  const [activeView, setActiveView] = useState<TView>('calendar')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState({ employeeId: 'all', type: 'all', status: 'all' })

  useEffect(() => {
    fetch('/api/users').then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {})
  }, [])

  const fetchScheduleEntries = useCallback(async (start: Date, end: Date) => {
    try {
      const q: Record<string, string> = { start: start.toISOString(), end: end.toISOString() }
      if (filters.employeeId !== 'all') q.employeeId = filters.employeeId
      if (filters.type !== 'all') q.type = filters.type
      if (filters.status !== 'all') q.status = filters.status

      const res = await fetch(`/api/schedule?${new URLSearchParams(q)}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.map((entry: any) => {
          let title = ''
          if (entry.jobOrder) title = `JOB: ${entry.jobOrder.jobNumber} - ${entry.client?.name || ''}`
          else if (entry.siteVisit) title = `VISIT: ${entry.siteVisit.requiredService || 'Site Visit'} - ${entry.client?.name || ''}`
          else title = `${entry.type.replace(/_/g, ' ')} - ${entry.client?.name || 'No client'}`
          return { id: entry.id, title, start: new Date(entry.startDateTime), end: new Date(entry.endDateTime), resource: entry }
        }))
      } else { setEvents([]) }
    } catch { setEvents([]) }
  }, [filters])

  const onNavigate = useCallback((d: Date) => setDate(d), [])
  const onRangeChange = useCallback((range: any) => {
    let start, end
    if (Array.isArray(range)) { start = range[0]; end = range[range.length - 1]; if (range.length === 1) end = start }
    else { start = range.start; end = range.end }
    end.setDate(end.getDate() + 1)
    fetchScheduleEntries(start, end)
  }, [fetchScheduleEntries])

  useEffect(() => { onRangeChange({ start: date, end: date }) }, [filters, onRangeChange, date])

  const handleSelectEvent = useCallback((e: ScheduleEvent) => setSelectedEvent(e), [])
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => setSelectedSlot({ start, end }), [])
  const handleSave = () => { onRangeChange({ start: date, end: date }) }

  const { defaultDate, scrollToTime } = useMemo(() => ({
    defaultDate: new Date(), scrollToTime: new Date(1970, 1, 1, 6),
  }), [])

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-8">
      <ScheduleDetailView event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <ScheduleForm slot={selectedSlot} onClose={() => setSelectedSlot(null)} onSave={handleSave} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schedule</h1>
          <p className="text-xs text-gray-400">{events.length} entries</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('calendar')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeView === 'calendar' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeView === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            List
          </button>
          <button
            onClick={() => setSelectedSlot({ start: new Date(), end: moment().add(1, 'hour').toDate() })}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-sm active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={filters.employeeId} onValueChange={v => setFilters({ ...filters, employeeId: v })}>
          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Employee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={v => setFilters({ ...filters, type: v })}>
          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(ScheduleEntryType).map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={v => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="rounded-xl text-xs h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(ScheduleEntryStatus).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {activeView === 'calendar' ? (
          <div className="h-[65vh] p-2">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ flex: 1 }}
              view={calendarView}
              onView={setCalendarView}
              date={date}
              onNavigate={onNavigate}
              onRangeChange={onRangeChange}
              defaultDate={defaultDate}
              scrollToTime={scrollToTime}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
            />
          </div>
        ) : (
          <div className="p-2">
            <ScheduleList events={events} onSelectEvent={handleSelectEvent} />
          </div>
        )}
      </div>
    </div>
  )
}
