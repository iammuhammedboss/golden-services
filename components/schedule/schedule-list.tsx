
import moment from 'moment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleEvent } from '@/types/schedule';

export function ScheduleList({
  events,
  onSelectEvent,
}: {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
}) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card
          key={event.id}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => onSelectEvent(event)}
        >
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start">
            <div className="flex-grow">
              <p className="font-bold text-lg">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {moment(event.start).format('lll')} -{' '}
                {moment(event.end).format('lll')}
              </p>
              <p className="text-sm mt-2">
                Location: {event.resource.locationText}
              </p>
              <div className="text-sm mt-1">
                Assignees:{' '}
                {event.resource.assignees
                  .map((a) => a.employee.name)
                  .join(', ')}
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0">
              <Badge>{event.resource.status.replace('_', ' ')}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
