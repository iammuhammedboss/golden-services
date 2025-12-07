'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientSelector } from '@/components/client-selector'
import { Client, User } from '@prisma/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RoomManager, RoomData } from '@/components/room-manager'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NewSiteVisitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId')

  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [assignedToId, setAssignedToId] = useState('')
  const [users, setUsers] = useState<User[]>([])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) {
      alert('Please select a client.')
      return
    }
    if (!scheduledAt) {
      alert('Please select a date and time for the site visit.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          leadId,
          scheduledAt,
          rooms,
          assignedToId: assignedToId || undefined,
        }),
      })

      if (response.ok) {
        router.push('/admin/site-visits')
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
        <div>
          <h1 className="text-3xl font-bold">New Site Visit</h1>
          <p className="text-muted-foreground">
            Create a new site visit to record measurements and details.
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client & Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <ClientSelector
                    onClientSelect={setSelectedClient}
                    initialClientId={leadId ? undefined : selectedClient?.id}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
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
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rooms & Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <RoomManager onChange={setRooms} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Site Visit'}
          </Button>
        </div>
      </form>
    </div>
  )
}
