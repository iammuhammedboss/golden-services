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
import { formatDate, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'
import { ChevronLeft, Mail, Phone, MapPin } from 'lucide-react'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      sites: {
        orderBy: { createdAt: 'desc' },
      },
      quotations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          site: {
            select: { name: true },
          },
          items: {
            select: { total: true },
          },
        },
      },
      siteVisits: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: {
          site: {
            select: { name: true },
          },
          assignedTo: {
            select: { name: true },
          },
        },
      },
      jobOrders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          site: {
            select: { name: true },
          },
        },
      },
    },
  })

  if (!client) {
    notFound()
  }

  // Calculate quotation totals
  const quotationsWithTotals = client.quotations.map((q) => ({
    ...q,
    total: q.items.reduce((sum, item) => sum + Number(item.total), 0),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/clients">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">Client Details</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {enumToReadable(client.type)}
        </Badge>
      </div>

      {/* Contact Information */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Phone:</span>
              <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">
                {client.phone}
              </a>
            </div>
            {client.alternatePhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Alternate:</span>
                <a
                  href={`tel:${client.alternatePhone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {client.alternatePhone}
                </a>
              </div>
            )}
            {client.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">WhatsApp:</span>
                <a
                  href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline"
                >
                  {client.whatsapp}
                </a>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {client.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Created:</span>{' '}
              <span className="text-sm text-muted-foreground">
                {formatDate(client.createdAt, 'PPp')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Last Updated:</span>{' '}
              <span className="text-sm text-muted-foreground">
                {formatDate(client.updatedAt, 'PPp')}
              </span>
            </div>
            {client.notes && (
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sites */}
      <Card>
        <CardHeader>
          <CardTitle>Sites ({client.sites.length})</CardTitle>
          <CardDescription>All sites associated with this client</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.sites.length > 0 ? (
                  client.sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            {site.address || '-'}
                            {site.city && (
                              <div className="text-muted-foreground">{site.city}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {site.city || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{formatDate(site.createdAt, 'PP')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No sites found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quotations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotations ({client.quotations.length})</CardTitle>
          <CardDescription>Last 10 quotations for this client</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationsWithTotals.length > 0 ? (
                  quotationsWithTotals.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>
                        {quotation.site?.name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(quotation.status)}>
                          {enumToReadable(quotation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(quotation.total)}
                      </TableCell>
                      <TableCell>
                        {quotation.validUntil ? (
                          formatDate(quotation.validUntil, 'PP')
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(quotation.createdAt, 'PP')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No quotations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Site Visits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Site Visits ({client.siteVisits.length})</CardTitle>
          <CardDescription>Last 10 site visits for this client</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.siteVisits.length > 0 ? (
                  client.siteVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        {visit.site?.name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(visit.scheduledAt, 'PP')}</div>
                          <div className="text-muted-foreground">
                            {formatDate(visit.scheduledAt, 'p')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{visit.assignedTo.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(visit.status)}>
                          {enumToReadable(visit.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{enumToReadable(visit.visitType)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No site visits found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Job Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Job Orders ({client.jobOrders.length})</CardTitle>
          <CardDescription>Last 10 job orders for this client</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.jobOrders.length > 0 ? (
                  client.jobOrders.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.jobNumber}</TableCell>
                      <TableCell>
                        {job.site?.name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(job.status)}>
                          {enumToReadable(job.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.scheduledDate ? (
                          <div className="text-sm">
                            <div>{formatDate(job.scheduledDate, 'PP')}</div>
                            <div className="text-muted-foreground">
                              {formatDate(job.scheduledDate, 'p')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(job.createdAt, 'PP')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No job orders found
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
