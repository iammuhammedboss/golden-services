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
import { ChevronLeft, MapPin, Building, Phone, Mail } from 'lucide-react'

export default async function SiteDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const site = await prisma.site.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          whatsapp: true,
        },
      },
      siteVisits: {
        orderBy: { scheduledAt: 'desc' },
        include: {
          assignedTo: {
            select: { name: true },
          },
        },
      },
      quotations: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: { total: true },
          },
        },
      },
      jobOrders: {
        orderBy: { scheduledDate: 'desc' },
      },
    },
  })

  if (!site) {
    notFound()
  }

  // Calculate quotation totals
  const quotationsWithTotals = site.quotations.map((q) => ({
    ...q,
    total: q.items.reduce((sum, item) => sum + Number(item.total), 0),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${params.locale}/admin/sites`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{site.name}</h1>
            <p className="text-muted-foreground">Site Details</p>
          </div>
        </div>
        {site.city && (
          <Badge variant="outline" className="text-sm">
            {site.city}
          </Badge>
        )}
      </div>

      {/* Site & Client Information */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Address:</span>
                <p className="text-sm text-muted-foreground">{site.address || '-'}</p>
                {site.city && <p className="text-sm text-muted-foreground">{site.city}</p>}
              </div>
            </div>
            {site.locationUrl && (
              <div>
                <a
                  href={site.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View on Map →
                </a>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Created:</span>{' '}
              <span className="text-sm text-muted-foreground">
                {formatDate(site.createdAt, 'PPp')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Name:</span>{' '}
              <Link
                href={`/${params.locale}/admin/clients/${site.client.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {site.client.name}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${site.client.phone}`} className="text-sm text-blue-600 hover:underline">
                {site.client.phone}
              </a>
            </div>
            {site.client.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">WhatsApp:</span>
                <a
                  href={`https://wa.me/${site.client.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline"
                >
                  {site.client.whatsapp}
                </a>
              </div>
            )}
            {site.client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${site.client.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {site.client.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Site Visits */}
      <Card>
        <CardHeader>
          <CardTitle>Site Visits ({site.siteVisits.length})</CardTitle>
          <CardDescription>All site visits for this location</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {site.siteVisits.length > 0 ? (
                  site.siteVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(visit.scheduledAt, 'PP')}</div>
                          <div className="text-muted-foreground">
                            {formatDate(visit.scheduledAt, 'p')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{enumToReadable(visit.visitType)}</Badge>
                      </TableCell>
                      <TableCell>{visit.assignedTo.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(visit.status)}>
                          {enumToReadable(visit.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(visit.createdAt, 'PP')}</TableCell>
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

      {/* Quotations */}
      <Card>
        <CardHeader>
          <CardTitle>Quotations ({site.quotations.length})</CardTitle>
          <CardDescription>All quotations for this site</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No quotations found
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
          <CardTitle>Job Orders ({site.jobOrders.length})</CardTitle>
          <CardDescription>All job orders for this site</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {site.jobOrders.length > 0 ? (
                  site.jobOrders.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.jobNumber}</TableCell>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
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
