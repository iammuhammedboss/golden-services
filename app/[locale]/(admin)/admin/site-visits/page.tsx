'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { MapPin, Eye, Plus } from 'lucide-react'

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
  client: {
    id: string
    name: string
    phone: string
  }
  assignedTo: {
    id: string
    name: string
  }
}

export default function SiteVisitsPage() {
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const fetchSiteVisits = async (status?: string) => {
    try {
      const url = status ? `/api/site-visits?status=${status}` : '/api/site-visits'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSiteVisits(data)
      }
    } catch (error) {
      console.error('Failed to fetch site visits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'all') {
      fetchSiteVisits()
    } else {
      fetchSiteVisits(activeTab.toUpperCase())
    }
  }, [activeTab])

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

  const statusCounts = {
    all: siteVisits.length,
    pending: siteVisits.filter((v) => v.status === 'PENDING').length,
    inProgress: siteVisits.filter((v) => v.status === 'IN_PROGRESS').length,
    completed: siteVisits.filter((v) => v.status === 'COMPLETED').length,
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Visits</h1>
          <p className="text-muted-foreground">
            Schedule and track site visits
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/site-visits/new">
            <Plus className="h-4 w-4 mr-2" />
            New Site Visit
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({statusCounts.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({statusCounts.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Visits</CardTitle>
              <CardDescription>
                Browse and manage site visits
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Map</TableHead>
                      <TableHead>Site Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteVisits.length > 0 ? (
                      siteVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{formatDate(new Date(visit.scheduledAt), 'PP')}</div>
                              <div className="text-muted-foreground">
                                {formatDate(new Date(visit.scheduledAt), 'p')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{visit.client.name}</div>
                              <div className="text-muted-foreground">{visit.client.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {visit.locationText ? (
                              <span className="text-sm">{visit.locationText}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {visit.googleMapsUrl ? (
                              <a
                                href={visit.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <MapPin className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {visit.siteContactName || visit.siteContactPhone ? (
                              <div className="text-sm">
                                {visit.siteContactName && (
                                  <div>{visit.siteContactName}</div>
                                )}
                                {visit.siteContactPhone && (
                                  <div className="text-muted-foreground">
                                    {visit.siteContactPhone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(visit.status)}>
                              {visit.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {visit.notes || visit.remarks ? (
                              <div className="text-sm max-w-[200px] truncate" title={visit.notes || visit.remarks || ''}>
                                {visit.notes || visit.remarks}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/site-visits/${visit.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No site visits found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}