'use client'

import { useState, useEffect } from 'react'
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

export function AddSiteDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    address: '',
    city: '',
    locationUrl: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      fetchClients()
    }
  }, [open])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId || !formData.name) {
      alert('Client and site name are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          clientId: '',
          name: '',
          address: '',
          city: '',
          locationUrl: '',
          notes: '',
        })
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create site')
      }
    } catch (error) {
      console.error('Error creating site:', error)
      alert('Failed to create site')
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
          New Site
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
          <DialogDescription>
            Create a new site location for a client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Office, Villa 123, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Muscat, Salalah"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationUrl">Location URL (Optional)</Label>
            <Input
              id="locationUrl"
              type="url"
              value={formData.locationUrl}
              onChange={(e) =>
                setFormData({ ...formData, locationUrl: e.target.value })
              }
              placeholder="Google Maps link or coordinates"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional information about the site..."
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
              {loading ? 'Creating...' : 'Create Site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
