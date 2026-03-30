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
import { Textarea } from '@/components/ui/textarea'
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
  onSiteVisitCreated?: () => void
}

export function AddSiteVisitDialog({ children, clientId, onSiteVisitCreated }: AddSiteVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    scheduledAt: '',
    assignedToId: '',
    visitType: 'FULL_HOUSE',
    requiredService: '',
    locationText: '',
    googleMapsUrl: '',
    siteContactName: '',
    siteContactPhone: '',
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
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.scheduledAt) {
      setError('Scheduled date is required')
      return
    }
    if (!formData.assignedToId) {
      setError('Please assign a team member')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, clientId }),
      })
      if (response.ok) {
        setOpen(false)
        onSiteVisitCreated?.()
        setFormData({
          scheduledAt: '',
          assignedToId: '',
          visitType: 'FULL_HOUSE',
          requiredService: '',
          locationText: '',
          googleMapsUrl: '',
          siteContactName: '',
          siteContactPhone: '',
          notes: '',
        })
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create site visit')
      }
    } catch (err) {
      console.error('Failed to create site visit:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Site Visit</DialogTitle>
          <DialogDescription>
            Schedule a new site visit for the customer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date & Time <span className="text-red-500">*</span></Label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To <span className="text-red-500">*</span></Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visit Type</Label>
            <Select
              value={formData.visitType}
              onValueChange={(value) => setFormData({ ...formData, visitType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_HOUSE">Full House</SelectItem>
                <SelectItem value="SPECIFIC_SERVICE">Specific Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Required Service</Label>
            <Input
              value={formData.requiredService}
              onChange={(e) => setFormData({ ...formData, requiredService: e.target.value })}
              placeholder="e.g., Deep Cleaning, Pest Control"
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.locationText}
              onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
              placeholder="Address or location description"
            />
          </div>

          <div className="space-y-2">
            <Label>Google Maps URL</Label>
            <Input
              value={formData.googleMapsUrl}
              onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
              placeholder="Paste Google Maps link"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Site Contact Name</Label>
              <Input
                value={formData.siteContactName}
                onChange={(e) => setFormData({ ...formData, siteContactName: e.target.value })}
                placeholder="Person on site"
              />
            </div>
            <div className="space-y-2">
              <Label>Site Contact Phone</Label>
              <Input
                type="tel"
                value={formData.siteContactPhone}
                onChange={(e) => setFormData({ ...formData, siteContactPhone: e.target.value })}
                placeholder="+968 XXXX XXXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
