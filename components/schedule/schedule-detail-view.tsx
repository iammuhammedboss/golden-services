
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import { ScheduleEvent } from '@/types/schedule';

export function ScheduleDetailView({
  event,
  onClose,
}: {
  event: ScheduleEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>
            From: {moment(event.start).format('lll')} To:{' '}
            {moment(event.end).format('lll')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            <span className="font-semibold">Type:</span> {event.resource.type}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{' '}
            {event.resource.status}
          </p>
          <p>
            <span className="font-semibold">Location:</span>{' '}
            {event.resource.locationText}
          </p>
          <h4 className="font-semibold">Assignees:</h4>
          <ul>
            {event.resource.assignees.map((assignee) => (
              <li key={assignee.employee.id}>
                {assignee.employee.name} ({assignee.roleInVisit})
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
