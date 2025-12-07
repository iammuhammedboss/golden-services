import { prisma } from '@/lib/prisma'
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
import { formatDate, getStatusColor, enumToReadable } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SiteVisitsPage() {
  const siteVisits = await prisma.siteVisit.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      client: true,
      assignedTo: true,
      rooms: {
        include: {
          items: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Visits</h1>
          <p className="text-muted-foreground">
            A list of all scheduled and completed site visits.
          </p>
        </div>
        <Link href="/admin/site-visits/new">
          <Button>+ New Site Visit</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Site Visits</CardTitle>
          <CardDescription>
            Browse and manage all site visits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteVisits.length > 0 ? (
                siteVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">{visit.client?.name}</TableCell>
                    <TableCell>{formatDate(visit.scheduledAt, 'PPpp')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(visit.status)}>
                        {enumToReadable(visit.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{visit.rooms.length}</TableCell>
                    <TableCell>
                      {visit.rooms.reduce((acc, room) => acc + room.items.length, 0)}
                    </TableCell>
                    <TableCell>{visit.assignedTo.name}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/site-visits/${visit.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No site visits found.
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