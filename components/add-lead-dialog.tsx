'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

export function AddLeadDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    source: 'PHONE_CALL',
    serviceInterest: '',
    notes: '',
    status: 'NEW',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      alert('Name and phone are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          whatsapp: formData.whatsapp || formData.phone,
          message: formData.notes, // API expects 'message' field
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          name: '',
          phone: '',
          whatsapp: '',
          email: '',
          source: 'PHONE_CALL',
          serviceInterest: '',
          notes: '',
          status: 'NEW',
        })
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create lead')
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      alert('Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead entry for potential customer inquiries
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+968 1234 5678"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+968 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Lead Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="SITE_VISIT_SCHEDULED">Site Visit Scheduled</SelectItem>
                  <SelectItem value="QUOTED">Quoted</SelectItem>
                  <SelectItem value="WON">Won</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceInterest">Service Interest (Optional)</Label>
            <Input
              id="serviceInterest"
              value={formData.serviceInterest}
              onChange={(e) =>
                setFormData({ ...formData, serviceInterest: e.target.value })
              }
              placeholder="e.g., Deep Cleaning, Pest Control"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
