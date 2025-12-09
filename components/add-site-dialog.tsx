'use client'

import { useState } from 'react'
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
import { SiteType } from '@prisma/client'

interface AddSiteDialogProps {
  children: React.ReactNode
  clientId: string
  onSiteCreated?: () => void
}

export function AddSiteDialog({ children, clientId, onSiteCreated }: AddSiteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    address: string
    city: string
    locationUrl: string
    type: SiteType
    personInCharge: string
    personPhone: string
  }>({
    name: '',
    address: '',
    city: '',
    locationUrl: '',
    type: SiteType.HOUSE,
    personInCharge: '',
    personPhone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, clientId }),
      })
      if (response.ok) {
        setOpen(false)
        onSiteCreated?.()
        setFormData({
            name: '',
            address: '',
            city: '',
            locationUrl: '',
            type: SiteType.HOUSE,
            personInCharge: '',
            personPhone: '',
        })
      }
    } catch (error) {
      console.error('Failed to create site:', error)
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
          <DialogTitle>Add New Site</DialogTitle>
          <DialogDescription>
            Create a new site for the selected client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site Name / Label *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationUrl">Google Maps Link</Label>
            <Input
              id="locationUrl"
              value={formData.locationUrl}
              onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: SiteType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SiteType).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="personInCharge">Person in Charge</Label>
            <Input
              id="personInCharge"
              value={formData.personInCharge}
              onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personPhone">Person's Phone</Label>
            <Input
              id="personPhone"
              value={formData.personPhone}
              onChange={(e) => setFormData({ ...formData, personPhone: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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