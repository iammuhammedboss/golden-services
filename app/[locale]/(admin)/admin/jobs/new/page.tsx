'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewJobPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'

  const [clients, setClients] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
    siteId: '',
    quotationId: '',
    scheduledDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    status: 'SCHEDULED',
    notes: '',
  })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (formData.clientId) {
      fetchSites(formData.clientId)
      fetchQuotations(formData.clientId)
    } else {
      setSites([])
      setQuotations([])
    }
  }, [formData.clientId])

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

  const fetchSites = async (clientId: string) => {
    try {
      const response = await fetch(`/api/sites?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setSites(data)
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchQuotations = async (clientId: string) => {
    try {
      const response = await fetch(`/api/quotations?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      }
    } catch (error) {
      console.error('Error fetching quotations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId || !formData.siteId || !formData.scheduledDate) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quotationId: formData.quotationId || null,
          scheduledStartTime: formData.scheduledStartTime || null,
          scheduledEndTime: formData.scheduledEndTime || null,
        }),
      })

      if (response.ok) {
        const job = await response.json()
        router.push(`/${locale}/admin/jobs`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create job order')
      }
    } catch (error) {
      console.error('Error creating job order:', error)
      alert('Failed to create job order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Job Order</h1>
          <p className="text-muted-foreground">Schedule a new job for your client</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/jobs`)}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        clientId: value,
                        siteId: '',
                        quotationId: '',
                      })
                    }}
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
                  <Label htmlFor="siteId">Site *</Label>
                  <Select
                    value={formData.siteId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, siteId: value })
                    }
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name} - {site.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotationId">Quotation (Optional)</Label>
                <Select
                  value={formData.quotationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quotationId: value })
                  }
                  disabled={!formData.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quotation" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotations.map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.client.name} - {quotation.site?.name || 'No site'} ({quotation.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledStartTime">Start Time (Optional)</Label>
                  <Input
                    id="scheduledStartTime"
                    type="time"
                    value={formData.scheduledStartTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledStartTime: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledEndTime">End Time (Optional)</Label>
                  <Input
                    id="scheduledEndTime"
                    type="time"
                    value={formData.scheduledEndTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledEndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional notes or special instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/jobs`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job Order'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
