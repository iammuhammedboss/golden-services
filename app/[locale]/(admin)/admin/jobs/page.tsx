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
import { prisma } from '@/lib/prisma'
import { formatDate, enumToReadable, getStatusColor } from '@/lib/utils'

export default async function JobsPage({ params }: { params: { locale: string } }) {
  const jobs = await prisma.jobOrder.findMany({
    orderBy: {
      scheduledDate: 'desc',
    },
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
          city: true,
        },
      },
      assignments: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
          roleInJob: true,
        },
      },
    },
  })

  const stats = {
    total: jobs.length,
    scheduled: jobs.filter((j) => j.status === 'SCHEDULED').length,
    inProgress: jobs.filter((j) => j.status === 'IN_PROGRESS').length,
    completed: jobs.filter((j) => j.status === 'COMPLETED').length,
    cancelled: jobs.filter((j) => j.status === 'CANCELLED').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Orders</h1>
          <p className="text-muted-foreground">Manage and track job orders</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${params.locale}/admin/jobs/calendar`}>
            <Button variant="outline">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Calendar View
            </Button>
          </Link>
          <Link href={`/${params.locale}/admin/jobs/new`}>
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
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
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

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Job Orders</CardTitle>
          <CardDescription>A list of all job orders and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Assigned Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.jobNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{job.client.name}</div>
                        <div className="text-muted-foreground">{job.client.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{job.site.name}</div>
                        {job.site.city && (
                          <div className="text-muted-foreground">{job.site.city}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(job.scheduledDate, 'PP')}</div>
                    </TableCell>
                    <TableCell>
                      {job.scheduledStartTime && job.scheduledEndTime ? (
                        <div className="text-sm">
                          <div>{formatDate(job.scheduledStartTime, 'p')}</div>
                          <div className="text-muted-foreground">
                            to {formatDate(job.scheduledEndTime, 'p')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.assignments.length > 0 ? (
                        <div className="text-sm">
                          <div>{job.assignments.length} members</div>
                          <div className="text-muted-foreground">
                            {job.assignments
                              .filter((a) => a.roleInJob === 'SUPERVISOR')
                              .map((a) => a.user.name)
                              .join(', ') || 'No supervisor'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {enumToReadable(job.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(job.createdAt, 'PP')}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No job orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
