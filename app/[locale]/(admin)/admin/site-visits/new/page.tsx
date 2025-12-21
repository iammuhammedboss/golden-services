'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { User, Client } from '@prisma/client'



export default function NewSiteVisitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdParam = searchParams.get('clientId')

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [openClientSelect, setOpenClientSelect] = useState(false)

  const [formData, setFormData] = useState({
    clientId: clientIdParam || '',
    scheduledAt: '',
    assignedToId: '',
    requiredService: '',
    locationText: '',
    googleMapsUrl: '',
    siteContactName: '',
    siteContactPhone: '',
    notes: '',
    remarks: '',
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          setUsers(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch users', error)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const searchClients = async () => {
        try {
          const response = await fetch(`/api/clients/search?q=${encodeURIComponent(searchQuery)}`)
          if (response.ok) {
            setClients(await response.json())
          }
        } catch (error) {
          console.error('Failed to search clients', error)
        }
      }
      const debounce = setTimeout(searchClients, 300)
      return () => clearTimeout(debounce)
    } else {
      setClients([])
    }
  }, [searchQuery])

  const selectedClient = clients.find((c) => c.id === formData.clientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientId) {
      alert('Please select a client.')
      return
    }
    if (!formData.scheduledAt) {
      alert('Please select a date and time for the site visit.')
      return
    }
    if (!formData.assignedToId) {
      alert('Please select an assigned user.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const siteVisit = await response.json()
        router.push(`/admin/site-visits/${siteVisit.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create site visit')
      }
    } catch (error) {
      console.error('Error creating site visit:', error)
      alert('Failed to create site visit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/site-visits">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Site Visit</h1>
            <p className="text-muted-foreground">
              Schedule a new site visit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/site-visits">Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Create Site Visit'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client & Schedule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 relative">
                <Label htmlFor="clientSearch">
                  Client <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clientSearch"
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {selectedClient && (
                  <div className="p-2 border rounded-md bg-muted">
                    <p className="font-medium text-sm">{selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
                  </div>
                )}
                {searchQuery.length >= 2 && clients.length > 0 && !selectedClient && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                        onClick={() => {
                          setFormData({ ...formData, clientId: client.id })
                          setSearchQuery('')
                        }}
                      >
                        <p className="font-medium text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.phone}
                          {client.email && ` • ${client.email}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && clients.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">No clients found</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">
                  Assigned To <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.assignedToId}
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
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
                  placeholder="e.g., Pest control, Cleaning"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locationText">Location</Label>
                <Input
                  id="locationText"
                  value={formData.locationText}
                  onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
                  placeholder="e.g., Al Khuwair, Muscat"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                <Input
                  id="googleMapsUrl"
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteContactName">Site Contact Name</Label>
                <Input
                  id="siteContactName"
                  value={formData.siteContactName}
                  onChange={(e) => setFormData({ ...formData, siteContactName: e.target.value })}
                  placeholder="On-site contact person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteContactPhone">Site Contact Phone</Label>
                <Input
                  id="siteContactPhone"
                  type="tel"
                  value={formData.siteContactPhone}
                  onChange={(e) => setFormData({ ...formData, siteContactPhone: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this visit..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional remarks..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
