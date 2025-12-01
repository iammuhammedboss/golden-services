'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScheduleEntryType, ScheduleEntryStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'

const localizer = momentLocalizer(moment)

// --- Types ---
interface ScheduleEvent { id: string; title: string; start: Date; end: Date; resource: any; }
interface Client { id: string; name: string; }
interface User { id: string; name: string; }
type TView = 'calendar' | 'list';


// --- Dialog Components ---
function ScheduleDetailView({ event, onClose }: { event: ScheduleEvent | null, onClose: () => void }) {
    if (!event) return null;
    return (
        <Dialog open={!!event} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{event.title}</DialogTitle>
                    <DialogDescription>From: {moment(event.start).format('lll')} To: {moment(event.end).format('lll')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <p><span className="font-semibold">Type:</span> {event.resource.type}</p>
                    <p><span className="font-semibold">Status:</span> {event.resource.status}</p>
                    <p><span className="font-semibold">Location:</span> {event.resource.locationText}</p>
                    <h4 className="font-semibold">Assignees:</h4>
                    <ul>{event.resource.assignees.map((assignee: any) => (<li key={assignee.employee.id}>{assignee.employee.name} ({assignee.roleInVisit})</li>))}</ul>
                </div>
                <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button>Edit</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ScheduleForm({ slot, onClose, onSave }: { slot: { start: Date, end: Date } | null; onClose: () => void; onSave: () => void; }) {
  if (!slot) return null;
  const [formData, setFormData] = useState({ type: ScheduleEntryType.JOB_EXECUTION, startDateTime: moment(slot.start).format('YYYY-MM-DDTHH:mm'), endDateTime: moment(slot.end).format('YYYY-MM-DDTHH:mm'), clientId: '', locationText: '', notes: '', assigneeIds: [] as string[] });
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, usersRes] = await Promise.all([ fetch('/api/clients'), fetch('/api/users') ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (error) { console.error("Failed to fetch form data", error); }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (response.ok) { onSave(); onClose(); } 
        else { const error = await response.json(); alert(`Error: ${error.error || 'Failed to save entry'}`); }
    } catch (error) { console.error("Failed to submit form", error); alert('An unexpected error occurred.'); } 
    finally { setIsSubmitting(false); }
  };
  
  const handleMultiSelectChange = (employeeId: string) => setFormData(prev => ({ ...prev, assigneeIds: prev.assigneeIds.includes(employeeId) ? prev.assigneeIds.filter(id => id !== employeeId) : [...prev.assigneeIds, employeeId] }));

  return (
    <Dialog open={!!slot} onOpenChange={onClose}><DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader><DialogTitle>Create Schedule Entry</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="type" className="text-right">Type</Label><Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as ScheduleEntryType})}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{Object.values(ScheduleEntryType).map(type => (<SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>))}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="client" className="text-right">Client</Label><Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="start-time" className="text-right">Start</Label><Input id="start-time" type="datetime-local" value={formData.startDateTime} onChange={e => setFormData({...formData, startDateTime: e.target.value})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="end-time" className="text-right">End</Label><Input id="end-time" type="datetime-local" value={formData.endDateTime} onChange={e => setFormData({...formData, endDateTime: e.target.value})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="assignees" className="text-right">Assignees</Label><div className="col-span-3 max-h-32 overflow-y-auto border rounded-md p-2">{users.map(user => (<div key={user.id} className="flex items-center space-x-2"><input type="checkbox" id={`user-${user.id}`} checked={formData.assigneeIds.includes(user.id)} onChange={() => handleMultiSelectChange(user.id)} /><label htmlFor={`user-${user.id}`}>{user.name}</label></div>))}</div></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="location" className="text-right">Location</Label><Input id="location" value={formData.locationText} onChange={e => setFormData({...formData, locationText: e.target.value})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="notes" className="text-right">Notes</Label><Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="col-span-3" /></div>
            </div>
            <DialogFooter><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
        </form>
    </DialogContent></Dialog>
  );
}

// --- List View Component ---
function ScheduleList({ events, onSelectEvent }: { events: ScheduleEvent[], onSelectEvent: (event: ScheduleEvent) => void }) {
    return (
        <div className="space-y-4">
            {events.map(event => (
                <Card key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectEvent(event)}>
                    <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start">
                        <div className="flex-grow">
                            <p className="font-bold text-lg">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{moment(event.start).format('lll')} - {moment(event.end).format('lll')}</p>
                            <p className="text-sm mt-2">Location: {event.resource.locationText}</p>
                            <div className="text-sm mt-1">Assignees: {event.resource.assignees.map((a:any) => a.employee.name).join(', ')}</div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0">
                             <Badge>{event.resource.status.replace('_', ' ')}</Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// --- Main Page Component ---
export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH)
  const [activeView, setActiveView] = useState<TView>('calendar');
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null)
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({ employeeId: '', type: '', status: '' });

  useEffect(() => {
    const fetchUsers = async () => {
        try { const res = await fetch('/api/users'); if (res.ok) setUsers(await res.json()); } 
        catch (error) { console.error("Failed to fetch users", error); }
    };
    fetchUsers();
  }, []);

  const fetchScheduleEntries = useCallback(async (start: Date, end: Date) => {
    try {
      const params = new URLSearchParams({ start: start.toISOString(), end: end.toISOString(), ...filters });
      const response = await fetch(`/api/schedule?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const formattedEvents = data.map((entry: any) => ({
          id: entry.id,
          title: `${entry.jobOrder?.jobNumber || entry.type} - ${entry.client?.name || ''}`,
          start: new Date(entry.startDateTime),
          end: new Date(entry.endDateTime),
          resource: entry,
        }));
        setEvents(formattedEvents);
      } else { console.error('Failed to fetch schedule entries'); }
    } catch (error) { console.error('Error fetching schedule entries:', error); }
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
  
  useEffect(() => { onRangeChange({start: date, end: date}); }, [filters, onRangeChange, date]);

  const handleSelectEvent = useCallback((event: ScheduleEvent) => { setSelectedEvent(event); }, []);
  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => { setSelectedSlot({ start, end }); }, []);
  const handleSave = () => { onRangeChange({ start: date, end: date }); };

  const { defaultDate, scrollToTime } = useMemo(() => ({ defaultDate: new Date(), scrollToTime: new Date(1970, 1, 1, 6) }), []);

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
        <Select value={filters.employeeId} onValueChange={value => setFilters({...filters, employeeId: value})}><SelectTrigger><SelectValue placeholder="Filter by Employee..." /></SelectTrigger><SelectContent><SelectItem value="">All Employees</SelectItem>{users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.type} onValueChange={value => setFilters({...filters, type: value})}><SelectTrigger><SelectValue placeholder="Filter by Type..." /></SelectTrigger><SelectContent><SelectItem value="">All Types</SelectItem>{Object.values(ScheduleEntryType).map(type => <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.status} onValueChange={value => setFilters({...filters, status: value})}><SelectTrigger><SelectValue placeholder="Filter by Status..." /></SelectTrigger><SelectContent><SelectItem value="">All Statuses</SelectItem>{Object.values(ScheduleEntryStatus).map(status => <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select>
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