import { notFound } from 'next/navigation'
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
import { ChevronLeft, Calendar, Users, MapPin } from 'lucide-react'

export default async function JobDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const job = await prisma.jobOrder.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      site: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
      quotation: {
        select: {
          id: true,
        },
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      statusUpdates: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!job) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/jobs">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{job.jobNumber}</h1>
            <p className="text-muted-foreground">Job Order Details</p>
          </div>
        </div>
        <Badge className={getStatusColor(job.status)}>
          {enumToReadable(job.status)}
        </Badge>
      </div>

      {/* Job Info */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Scheduled:</span>{' '}
                <span className="text-sm">{formatDate(job.scheduledDate, 'PP')}</span>
              </div>
            </div>
            {job.scheduledStartTime && job.scheduledEndTime && (
              <div>
                <span className="text-sm font-medium">Time:</span>{' '}
                <span className="text-sm">
                  {formatDate(job.scheduledStartTime, 'p')} -{' '}
                  {formatDate(job.scheduledEndTime, 'p')}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Created:</span>{' '}
              <span className="text-sm text-muted-foreground">
                {formatDate(job.createdAt, 'PPp')}
              </span>
            </div>
            {job.description && (
              <div>
                <span className="text-sm font-medium">Description:</span>
                <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client & Site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Client:</span>{' '}
              <Link
                href={`/admin/clients/${job.client.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {job.client.name}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">Phone:</span>{' '}
              <span className="text-sm">{job.client.phone}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <Link
                  href={`/admin/sites/${job.site.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {job.site.name}
                </Link>
                <p className="text-sm text-muted-foreground">{job.site.address}</p>
                {job.site.city && (
                  <p className="text-sm text-muted-foreground">{job.site.city}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Assigned Team ({job.assignments.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.assignments.length > 0 ? (
                  job.assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/users/${assignment.user.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {assignment.user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{assignment.user.email}</TableCell>
                      <TableCell className="text-sm">{assignment.user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{enumToReadable(assignment.roleInJob)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No team members assigned
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Status Updates ({job.statusUpdates.length})</CardTitle>
          <CardDescription>Activity timeline for this job</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Updated By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.statusUpdates.length > 0 ? (
                  job.statusUpdates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell>
                        <Badge className={getStatusColor(update.newStatus)}>
                          {enumToReadable(update.newStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {update.notes ? (
                          <span className="text-sm">{update.notes}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{update.createdBy.name}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(update.createdAt, 'PPp')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No status updates yet
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
