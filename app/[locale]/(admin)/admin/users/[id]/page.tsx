import { notFound, redirect } from 'next/navigation'
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
import { ChevronLeft, Mail, Phone, Shield } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function UserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Check authentication
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  // Check if user has OWNER or OPERATIONS_MANAGER role
  const userRoles = currentUser?.roles.map((r) => r.role.name) || []
  const hasAccess = userRoles.includes('OWNER') || userRoles.includes('OPERATIONS_MANAGER')

  if (!hasAccess) {
    redirect('/admin/dashboard')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      roles: {
        include: {
          role: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      },
      leads: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      siteVisits: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: {
          client: {
            select: { name: true },
          },
          site: {
            select: { name: true },
          },
        },
      },
      jobAssignments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          jobOrder: {
            select: {
              id: true,
              jobNumber: true,
              status: true,
              scheduledDate: true,
              client: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">User Details</p>
          </div>
        </div>
        {user.isActive ? (
          <Badge className="bg-green-100 text-green-800">Active</Badge>
        ) : (
          <Badge className="bg-red-100 text-red-800">Inactive</Badge>
        )}
      </div>

      {/* User Info */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <a href={`mailto:${user.email}`} className="text-sm text-blue-600 hover:underline">
                {user.email}
              </a>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone:</span>
                <a href={`tel:${user.phone}`} className="text-sm text-blue-600 hover:underline">
                  {user.phone}
                </a>
              </div>
            )}
            {user.whatsapp && user.whatsapp !== user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">WhatsApp:</span>
                <a
                  href={`https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline"
                >
                  {user.whatsapp}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Roles & Permissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((userRole) => (
                  <Badge key={userRole.role.name} variant="outline">
                    {enumToReadable(userRole.role.name)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              <span className="font-medium">Created:</span>{' '}
              {formatDate(user.createdAt, 'PPp')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads ({user.leads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.leads.length > 0 ? (
                  user.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-sm">{lead.phone}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status)}>
                          {enumToReadable(lead.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(lead.createdAt, 'PP')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No leads created
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Site Visits ({user.siteVisits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.siteVisits.length > 0 ? (
                  user.siteVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="text-sm">{visit.client?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{visit.site?.name || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(visit.scheduledAt, 'PPp')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(visit.status)}>
                          {enumToReadable(visit.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No site visits assigned
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Job Assignments ({user.jobAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.jobAssignments.length > 0 ? (
                  user.jobAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/jobs/${assignment.jobOrder.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {assignment.jobOrder.jobNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {assignment.jobOrder.client.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{enumToReadable(assignment.roleInJob)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.jobOrder.status)}>
                          {enumToReadable(assignment.jobOrder.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(assignment.jobOrder.scheduledDate, 'PP')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No job assignments
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
