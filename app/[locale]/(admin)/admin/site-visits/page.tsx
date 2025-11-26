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
import { prisma } from '@/lib/prisma'
import { formatDate, formatDateTime, enumToReadable, getStatusColor } from '@/lib/utils'

export default async function SiteVisitsPage() {
  const siteVisits = await prisma.siteVisit.findMany({
    orderBy: {
      scheduledAt: 'desc',
    },
    include: {
      lead: {
        select: {
          name: true,
          phone: true,
        },
      },
      client: {
        select: {
          name: true,
          phone: true,
        },
      },
      site: {
        select: {
          name: true,
        },
      },
      assignedTo: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  const stats = {
    total: siteVisits.length,
    scheduled: siteVisits.filter((sv) => sv.status === 'SCHEDULED').length,
    completed: siteVisits.filter((sv) => sv.status === 'COMPLETED').length,
    cancelled: siteVisits.filter((sv) => sv.status === 'CANCELLED').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Visits</h1>
          <p className="text-muted-foreground">Manage site visit schedules and measurements</p>
        </div>
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
          New Site Visit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Site Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Site Visits</CardTitle>
          <CardDescription>A list of all scheduled and completed site visits</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client/Lead</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteVisits.length > 0 ? (
                siteVisits.map((visit) => {
                  const clientName = visit.client?.name || visit.lead?.name || 'Unknown'
                  const clientPhone = visit.client?.phone || visit.lead?.phone || '-'
                  const isLead = !visit.client && visit.lead

                  return (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {clientName}
                            {isLead && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Lead
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground">{clientPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {visit.site ? (
                          <span className="text-sm">{visit.site.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(visit.scheduledAt, 'PP')}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(visit.scheduledAt, 'p')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{visit.assignedTo.name}</div>
                          <div className="text-muted-foreground">{visit.assignedTo.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(visit.status)}>
                          {enumToReadable(visit.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(visit.createdAt, 'PP')}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No site visits found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
