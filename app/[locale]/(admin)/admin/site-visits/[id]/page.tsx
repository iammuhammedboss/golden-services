'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, MapPin, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type SiteVisit = {
  id: string
  scheduledAt: string
  startedAt: string | null
  completedAt: string | null
  status: string
  locationText: string | null
  googleMapsUrl: string | null
  siteContactName: string | null
  siteContactPhone: string | null
  notes: string | null
  remarks: string | null
  requiredService: string | null
  client: {
    id: string
    name: string
    phone: string
    email: string | null
  }
  assignedTo: {
    id: string
    name: string
    email: string | null
  }
}

export default function SiteVisitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [siteVisit, setSiteVisit] = useState<SiteVisit | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchSiteVisit = useCallback(async () => {
    try {
      const response = await fetch(`/api/site-visits/${params.id}`)
      if (response.ok) {
        setSiteVisit(await response.json())
      } else {
        alert('Failed to load site visit')
      }
    } catch (error) {
      console.error('Failed to fetch site visit:', error)
      alert('Failed to load site visit')
    } finally {
      setLoading(false)
    }
  }, [params.id]);

  useEffect(() => {
    fetchSiteVisit()
  }, [fetchSiteVisit])

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus.replace(/_/g, ' ')}?`)) {
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/site-visits/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchSiteVisit()
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this site visit?')) {
      return
    }

    try {
      const response = await fetch(`/api/site-visits/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/site-visits')
      } else {
        alert('Failed to delete site visit')
      }
    } catch (error) {
      console.error('Failed to delete site visit:', error)
      alert('Failed to delete site visit')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!siteVisit) {
    return <div className="flex items-center justify-center h-64">Site visit not found</div>
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
            <h1 className="text-3xl font-bold">Site Visit Details</h1>
            <p className="text-muted-foreground">
              {siteVisit.client.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/site-visits/${params.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="font-medium">{siteVisit.client.name}</p>
                <p className="text-sm text-muted-foreground">{siteVisit.client.phone}</p>
                {siteVisit.client.email && (
                  <p className="text-sm text-muted-foreground">{siteVisit.client.email}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                <p className="font-medium">{siteVisit.assignedTo.name}</p>
                {siteVisit.assignedTo.email && (
                  <p className="text-sm text-muted-foreground">{siteVisit.assignedTo.email}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled Date & Time</p>
                <p className="font-medium">{formatDate(new Date(siteVisit.scheduledAt), 'PPpp')}</p>
              </div>

              {siteVisit.startedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started At</p>
                  <p className="font-medium">{formatDate(new Date(siteVisit.startedAt), 'PPpp')}</p>
                </div>
              )}

              {siteVisit.completedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                  <p className="font-medium">{formatDate(new Date(siteVisit.completedAt), 'PPpp')}</p>
                </div>
              )}

              {siteVisit.requiredService && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Required Service</p>
                  <p>{siteVisit.requiredService}</p>
                </div>
              )}
            </div>

            {(siteVisit.locationText || siteVisit.googleMapsUrl) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Location</p>
                {siteVisit.locationText && (
                  <p>{siteVisit.locationText}</p>
                )}
                {siteVisit.googleMapsUrl && (
                  <a
                    href={siteVisit.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </a>
                )}
              </div>
            )}

            {(siteVisit.siteContactName || siteVisit.siteContactPhone) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Site Contact</p>
                {siteVisit.siteContactName && (
                  <p className="font-medium">{siteVisit.siteContactName}</p>
                )}
                {siteVisit.siteContactPhone && (
                  <p className="text-muted-foreground">{siteVisit.siteContactPhone}</p>
                )}
              </div>
            )}

            {siteVisit.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <p className="whitespace-pre-wrap">{siteVisit.notes}</p>
              </div>
            )}

            {siteVisit.remarks && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Remarks</p>
                <p className="whitespace-pre-wrap">{siteVisit.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Current Status</p>
                <Badge className={getStatusColor(siteVisit.status)}>
                  {siteVisit.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Change Status</p>
                <Select
                  value={siteVisit.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/clients/${siteVisit.client.id}`}>
                  View Client
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/measurements/new?siteVisitId=${siteVisit.id}`}>
                  Create Measurement
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}