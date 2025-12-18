'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Client, Site, SiteVisit } from '@prisma/client'
import { Info } from 'lucide-react'

type SiteVisitWithDetails = SiteVisit & {
  client: Client
  site: Site | null
}

export function EnhancedMeasurementForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Data lists
  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [siteVisits, setSiteVisits] = useState<SiteVisitWithDetails[]>([])
  const [allSiteVisits, setAllSiteVisits] = useState<SiteVisitWithDetails[]>([])

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedSiteVisitId, setSelectedSiteVisitId] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Auto-filled data
  const [autoFilledClient, setAutoFilledClient] = useState<Client | null>(null)

  // Fetch clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      }
    }
    fetchClients()
  }, [])

  // Fetch all site visits on mount
  useEffect(() => {
    async function fetchSiteVisits() {
      try {
        const response = await fetch('/api/site-visits')
        if (response.ok) {
          const data = await response.json()
          setAllSiteVisits(data)
        }
      } catch (error) {
        console.error('Failed to fetch site visits:', error)
      }
    }
    fetchSiteVisits()
  }, [])

  // When client is selected, fetch their sites and filter site visits
  useEffect(() => {
    async function fetchSitesForClient() {
      if (!selectedClientId) {
        setSites([])
        setSiteVisits([])
        setAutoFilledClient(null)
        return
      }

      try {
        const response = await fetch(`/api/clients/${selectedClientId}`)
        if (response.ok) {
          const clientData = await response.json()
          setAutoFilledClient(clientData)

          // Filter site visits for this client
          const filtered = allSiteVisits.filter(sv => sv.clientId === selectedClientId)
          setSiteVisits(filtered)
        }
      } catch (error) {
        console.error('Failed to fetch client sites:', error)
      }
    }
    fetchSitesForClient()
  }, [selectedClientId, allSiteVisits])

  // When site visit is selected, auto-fill client and location
  useEffect(() => {
    if (!selectedSiteVisitId) {
      // Don't clear if user manually selected
      return
    }

    const selectedSiteVisit = allSiteVisits.find(sv => sv.id === selectedSiteVisitId)
    if (selectedSiteVisit) {
      // Auto-fill client
      setSelectedClientId(selectedSiteVisit.clientId)
      setAutoFilledClient(selectedSiteVisit.client)

      // Auto-fill location if site exists
      if (selectedSiteVisit.site) {
        const siteDetails = []
        if (selectedSiteVisit.site.name) siteDetails.push(selectedSiteVisit.site.name)
        if (selectedSiteVisit.site.address) siteDetails.push(selectedSiteVisit.site.address)
        if (selectedSiteVisit.site.city) siteDetails.push(selectedSiteVisit.site.city)
        setLocation(siteDetails.join(', '))
      }
    }
  }, [selectedSiteVisitId, allSiteVisits])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      alert('Please select a client')
      return
    }

    if (!title.trim()) {
      alert('Please provide a title for the measurement')
      return
    }

    setLoading(true)

    try {
      const payload = {
        clientId: selectedClientId,
        siteVisitId: selectedSiteVisitId || null,
        location: location.trim() || null,
        title: title.trim(),
        notes: notes.trim() || null,
        status: 'DRAFT',
      }

      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newMeasurement = await response.json()
        router.push(`/admin/measurements/${newMeasurement.id}`)
      } else {
        const error = await response.json()
        alert(`Failed to create measurement: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create measurement:', error)
      alert('Failed to create measurement. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Measurement</CardTitle>
          <CardDescription>
            Select a client and optionally a site visit. Site visit is not required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <div className="flex gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              You can select either a <strong>Client</strong> first or a <strong>Site Visit</strong> first.
              When you select a site visit, the client and site will be automatically filled.
            </p>
          </div>

          {/* Site Visit Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="siteVisit">Site Visit (Optional)</Label>
            <Select
              value={selectedSiteVisitId || 'none'}
              onValueChange={(value) => {
                setSelectedSiteVisitId(value === 'none' ? '' : value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a site visit (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - Create without site visit</SelectItem>
                {allSiteVisits.map(sv => (
                  <SelectItem key={sv.id} value={sv.id}>
                    {sv.client.name} - {sv.site?.name || 'No site'} - {new Date(sv.scheduledAt).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Selecting a site visit will auto-fill client and location details
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={selectedClientId}
              onValueChange={(value) => {
                setSelectedClientId(value)
                // Clear site visit if manually selecting client
                setSelectedSiteVisitId('')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSiteVisitId && (
              <p className="text-sm text-blue-600">
                Auto-filled from selected site visit
              </p>
            )}
          </div>

          {/* Show client details if auto-filled */}
          {autoFilledClient && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm"><strong>Name:</strong> {autoFilledClient.name}</p>
                <p className="text-sm"><strong>Phone:</strong> {autoFilledClient.phone}</p>
                {autoFilledClient.email && (
                  <p className="text-sm"><strong>Email:</strong> {autoFilledClient.email}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Input (Optional) */}
          {selectedClientId && (
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location details (e.g., address, building name, etc.)"
              />
              {selectedSiteVisitId && location && (
                <p className="text-sm text-blue-600">
                  Auto-filled from selected site visit
                </p>
              )}
            </div>
          )}

          {/* Available Site Visits for selected client */}
          {selectedClientId && !selectedSiteVisitId && siteVisits.length > 0 && (
            <div className="space-y-2">
              <Label>Available Site Visits for this Client</Label>
              <Select
                value={selectedSiteVisitId || 'none'}
                onValueChange={(value) => setSelectedSiteVisitId(value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a site visit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {siteVisits.map(sv => (
                    <SelectItem key={sv.id} value={sv.id}>
                      {sv.site?.name || 'No site'} - {new Date(sv.scheduledAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Measurement Details</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Living Room Deep Clean Measurement"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about this measurement..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Measurement'}
        </Button>
      </div>
    </form>
  )
}
