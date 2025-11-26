import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { prisma } from '@/lib/prisma'
import { formatDate, getStatusColor, enumToReadable } from '@/lib/utils'
import { Calendar, MapPin, FileText, Briefcase, Clock } from 'lucide-react'

export default async function SchedulePage() {
  // Get today's date at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get upcoming site visits
  const upcomingSiteVisits = await prisma.siteVisit.findMany({
    where: {
      scheduledAt: {
        gte: today,
      },
      deletedAt: null,
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 20,
    include: {
      client: {
        select: {
          name: true,
          phone: true,
        },
      },
      site: {
        select: {
          name: true,
          address: true,
          city: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
        },
      },
    },
  })

  // Get upcoming job orders
  const upcomingJobs = await prisma.jobOrder.findMany({
    where: {
      scheduledDate: {
        gte: today,
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS'],
      },
      deletedAt: null,
    },
    orderBy: {
      scheduledDate: 'asc',
    },
    take: 20,
    include: {
      client: {
        select: {
          name: true,
          phone: true,
        },
      },
      site: {
        select: {
          name: true,
          address: true,
          city: true,
        },
      },
      quotation: {
        select: {
          id: true,
          items: {
            select: {
              total: true,
            },
          },
        },
      },
    },
  })

  // Get pending quotations
  const pendingQuotations = await prisma.quotation.findMany({
    where: {
      status: {
        in: ['DRAFT', 'SENT'],
      },
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
    include: {
      client: {
        select: {
          name: true,
          phone: true,
        },
      },
      site: {
        select: {
          name: true,
          address: true,
        },
      },
      items: {
        select: {
          total: true,
        },
      },
    },
  })

  // Get today's activities
  const todaySiteVisits = upcomingSiteVisits.filter((visit) => {
    const visitDate = new Date(visit.scheduledAt)
    return visitDate.toDateString() === today.toDateString()
  })

  const todayJobs = upcomingJobs.filter((job) => {
    const jobDate = new Date(job.scheduledDate)
    return jobDate.toDateString() === today.toDateString()
  })

  const stats = {
    todaySiteVisits: todaySiteVisits.length,
    todayJobs: todayJobs.length,
    upcomingSiteVisits: upcomingSiteVisits.length,
    upcomingJobs: upcomingJobs.length,
    pendingQuotations: pendingQuotations.length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule & Activities</h1>
          <p className="text-muted-foreground">
            View all upcoming site visits, jobs, and pending quotations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/jobs/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Site Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.todaySiteVisits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Today's Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Site Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.upcomingSiteVisits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.upcomingJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Quotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingQuotations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="site-visits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="site-visits">
            Site Visits ({upcomingSiteVisits.length})
          </TabsTrigger>
          <TabsTrigger value="jobs">
            Jobs ({upcomingJobs.length})
          </TabsTrigger>
          <TabsTrigger value="quotations">
            Quotations ({pendingQuotations.length})
          </TabsTrigger>
        </TabsList>

        {/* Site Visits Tab */}
        <TabsContent value="site-visits">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Site Visits</CardTitle>
              <CardDescription>Scheduled site visits and assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingSiteVisits.length > 0 ? (
                    upcomingSiteVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {formatDate(visit.scheduledAt, 'PPP')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(visit.scheduledAt, 'p')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{visit.client?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{visit.client?.phone || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{visit.site?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {visit.site?.city || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{visit.assignedTo?.name || 'Unassigned'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(visit.status)}>
                            {enumToReadable(visit.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/site-visits/${visit.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No upcoming site visits
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Jobs</CardTitle>
              <CardDescription>Scheduled job orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingJobs.length > 0 ? (
                    upcomingJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.jobNumber}</TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(job.scheduledDate, 'PPP')}</div>
                          {job.isMultiDay && job.endDate && (
                            <div className="text-xs text-muted-foreground">
                              to {formatDate(job.endDate, 'PPP')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{job.client?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{job.client?.phone || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{job.site?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.site?.city || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.quotation && (
                            <div className="text-sm font-medium">
                              {job.quotation.items.reduce((sum, item) => sum + Number(item.total), 0).toFixed(3)} OMR
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(job.status)}>
                            {enumToReadable(job.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No upcoming jobs
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Quotations</CardTitle>
              <CardDescription>Quotations awaiting customer response</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingQuotations.length > 0 ? (
                    pendingQuotations.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">
                          QT-{quotation.id.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(quotation.createdAt, 'PP')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{quotation.client?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {quotation.client?.phone || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{quotation.site?.name || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {quotation.items.reduce((sum, item) => sum + Number(item.total), 0).toFixed(3)} OMR
                          </div>
                        </TableCell>
                        <TableCell>
                          {quotation.validUntil && (
                            <div className="text-sm">
                              {formatDate(quotation.validUntil, 'PP')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(quotation.status)}>
                            {enumToReadable(quotation.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/quotations/${quotation.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No pending quotations
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
