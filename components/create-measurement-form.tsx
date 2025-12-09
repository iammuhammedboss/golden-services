'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, Site } from '@prisma/client'

export function CreateMeasurementForm() {
  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    siteId: '',
    notes: '',
    status: 'DRAFT',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  useEffect(() => {
    async function fetchSites() {
      if (!selectedClient) {
        setSites([])
        return
      }
      try {
        const response = await fetch(`/api/clients/${selectedClient}`)
        if (response.ok) {
          const data = await response.json()
          setSites(data.sites)
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error)
      }
    }
    fetchSites()
  }, [selectedClient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, clientId: selectedClient }),
      })
      if (response.ok) {
        const newMeasurement = await response.json()
        router.push(`/admin/measurements/${newMeasurement.id}`)
      }
    } catch (error) {
      console.error('Failed to create measurement:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold">New Measurement</h2>
      <div className="space-y-2">
        <Label htmlFor="client">Client *</Label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="site">Site</Label>
        <Select
          value={formData.siteId}
          onValueChange={(value) => setFormData({ ...formData, siteId: value })}
          disabled={!selectedClient || sites.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a site" />
          </SelectTrigger>
          <SelectContent>
            {sites.map(site => (
              <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
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
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create and Continue'}
        </Button>
      </div>
    </form>
  )
}
