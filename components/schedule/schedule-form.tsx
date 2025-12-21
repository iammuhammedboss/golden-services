
import { useState, useEffect } from 'react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScheduleEntryType } from '@prisma/client';
import { ScheduleClient, User } from '@/types/schedule';

export function ScheduleForm({
  slot,
  onClose,
  onSave,
}: {
  slot: { start: Date; end: Date } | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    type: ScheduleEntryType.JOB_EXECUTION as ScheduleEntryType,
    startDateTime: '',
    endDateTime: '',
    clientId: '',
    locationText: '',
    notes: '',
    assigneeIds: [] as string[],
  });
  const [clients, setClients] = useState<ScheduleClient[]>([]);
  const [formUsers, setFormUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, usersRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/users'),
        ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (usersRes.ok) setFormUsers(await usersRes.json());
      } catch (error) {
        console.error('Failed to fetch form data', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (slot) {
      setFormData({
        type: ScheduleEntryType.JOB_EXECUTION as ScheduleEntryType,
        startDateTime: moment(slot.start).format('YYYY-MM-DDTHH:mm'),
        endDateTime: moment(slot.end).format('YYYY-MM-DDTHH:mm'),
        clientId: '',
        locationText: '',
        notes: '',
        assigneeIds: [] as string[],
      });
    }
  }, [slot]);

  if (!slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save entry'}`);
      }
    } catch (error) {
      console.error('Failed to submit form', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelectChange = (employeeId: string) => {
    setFormData((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(employeeId)
        ? prev.assigneeIds.filter((id) => id !== employeeId)
        : [...prev.assigneeIds, employeeId],
    }));
  };

  return (
    <Dialog open={!!slot} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Schedule Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type as string}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as ScheduleEntryType })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ScheduleEntryType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-time" className="text-right">
                Start
              </Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) =>
                  setFormData({ ...formData, startDateTime: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-time" className="text-right">
                End
              </Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) =>
                  setFormData({ ...formData, endDateTime: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignees" className="text-right">
                Assignees
              </Label>
              <div className="col-span-3 max-h-32 overflow-y-auto border rounded-md p-2">
                {formUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={formData.assigneeIds.includes(user.id)}
                      onChange={() => handleMultiSelectChange(user.id)}
                    />
                    <label htmlFor={`user-${user.id}`}>{user.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.locationText}
                onChange={(e) =>
                  setFormData({ ...formData, locationText: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
