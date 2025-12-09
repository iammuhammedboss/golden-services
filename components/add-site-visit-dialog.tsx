'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User } from '@prisma/client'

interface AddSiteVisitDialogProps {
  children: React.ReactNode
  clientId: string
  siteId: string
  onSiteVisitCreated?: () => void
}

export function AddSiteVisitDialog({ children, clientId, siteId, onSiteVisitCreated }: AddSiteVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    scheduledAt: '',
    assignedToId: '',
    requiredService: '',
    notes: '',
  })

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, clientId, siteId }),
      })
      if (response.ok) {
        setOpen(false)
        onSiteVisitCreated?.()
        setFormData({
            scheduledAt: '',
            assignedToId: '',
            requiredService: '',
            notes: '',
        })
      }
    } catch (error) {
      console.error('Failed to create site visit:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Site Visit</DialogTitle>
          <DialogDescription>
            Schedule a new site visit for the selected site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled Date and Time *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assign To</Label>
            <Select
              value={formData.assignedToId}
              onValueChange={(value: string) =>
                setFormData({ ...formData, assignedToId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requiredService">Required Service</Label>
            <Input
              id="requiredService"
              value={formData.requiredService}
              onChange={(e) => setFormData({ ...formData, requiredService: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Site Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}