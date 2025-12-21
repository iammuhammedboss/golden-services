'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScheduleEntryType, ScheduleEntryStatus } from '@prisma/client'
import { ScheduleEvent, User } from '@/types/schedule'
import { ScheduleDetailView } from '@/components/schedule/schedule-detail-view'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { ScheduleForm } from '@/components/schedule/schedule-form'

const localizer = momentLocalizer(moment)

type TView = 'calendar' | 'list';

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH)
  const [activeView, setActiveView] = useState<TView>('calendar');
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null)
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({ employeeId: 'all', type: 'all', status: 'all' });

  useEffect(() => {
    const fetchUsers = async () => {
        try { 
          const res = await fetch('/api/users'); 
          if (res.ok) setUsers(await res.json()); 
        } 
        catch (error) { 
          console.error("Failed to fetch users", error); 
        }
    };
    fetchUsers();
  }, []);

  const fetchScheduleEntries = useCallback(async (start: Date, end: Date) => {
    try {
      const queryParams: Record<string, string> = {
        start: start.toISOString(),
        end: end.toISOString(),
      };

      if (filters.employeeId && filters.employeeId !== 'all') {
        queryParams.employeeId = filters.employeeId;
      }
      if (filters.type && filters.type !== 'all') {
        queryParams.type = filters.type;
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.status = filters.status;
      }

      const params = new URLSearchParams(queryParams);
      const response = await fetch(`/api/schedule?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const formattedEvents: ScheduleEvent[] = data.map((entry: any) => {
          let title = '';
          if (entry.jobOrder) {
            title = `JOB: ${entry.jobOrder.jobNumber} - ${entry.client?.name || ''}`;
          } else if (entry.siteVisit) {
            title = `VISIT: ${entry.siteVisit.requiredService || 'Site Visit'} - ${entry.client?.name || ''}`;
          } else {
            title = `${entry.type.replace(/_/g, ' ')} - ${entry.client?.name || 'No client'}`;
          }
          return {
            id: entry.id,
            title,
            start: new Date(entry.startDateTime),
            end: new Date(entry.endDateTime),
            resource: entry,
          };
        });
        setEvents(formattedEvents);
      } else { 
        console.error('Failed to fetch schedule entries'); 
        setEvents([]);
      }
    } catch (error) { 
      console.error('Error fetching schedule entries:', error); 
      setEvents([]);
    }
  }, [filters]);

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);

  const onRangeChange = useCallback((range: any) => {
      let start, end;
      if (Array.isArray(range)) {
        start = range[0];
        end = range[range.length - 1];
        if (range.length === 1) end = start;
      } else { start = range.start; end = range.end; }
      end.setDate(end.getDate() + 1);
      fetchScheduleEntries(start, end);
    }, [fetchScheduleEntries]
  );
  
  useEffect(() => { 
    onRangeChange({start: date, end: date}); 
  }, [filters, onRangeChange, date]);

  const handleSelectEvent = useCallback((event: ScheduleEvent) => { 
    setSelectedEvent(event); 
  }, []);
  
  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => { 
    setSelectedSlot({ start, end }); 
  }, []);
  
  const handleSave = () => {
    onRangeChange({ start: date, end: date }); 
  };

  const { defaultDate, scrollToTime } = useMemo(() => ({ 
    defaultDate: new Date(), 
    scrollToTime: new Date(1970, 1, 1, 6) 
  }), []);

  return (
    <div className="space-y-6 h-full flex flex-col">
        <ScheduleDetailView event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        <ScheduleForm slot={selectedSlot} onClose={() => setSelectedSlot(null)} onSave={handleSave} />
        
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Schedule Calendar</h1>
          <p className="text-muted-foreground">Manage all jobs, visits, and tasks in one place.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant={activeView === 'calendar' ? 'default' : 'outline'} onClick={() => setActiveView('calendar')}>Calendar</Button>
            <Button variant={activeView === 'list' ? 'default' : 'outline'} onClick={() => setActiveView('list')}>List</Button>
            <Button onClick={() => setSelectedSlot({start: new Date(), end: moment().add(1, 'hour').toDate()})}>+ New</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={filters.employeeId} onValueChange={value => setFilters({...filters, employeeId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Employee..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={value => setFilters({...filters, type: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(ScheduleEntryType).map(type => <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={value => setFilters({...filters, status: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(ScheduleEntryStatus).map(status => <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-grow">
        <CardContent className="p-2 h-full">
            {activeView === 'calendar' ? (
                <div className="h-[65vh]">
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
                <ScheduleList events={events} onSelectEvent={handleSelectEvent} />
            )}
        </CardContent>
      </Card>
    </div>
  )
}
