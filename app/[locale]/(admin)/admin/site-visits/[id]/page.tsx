import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatDate, enumToReadable, getStatusColor } from '@/lib/utils'
import { ChevronLeft, Calendar, User, MapPin } from 'lucide-react'

export default async function SiteVisitDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const siteVisit = await prisma.siteVisit.findUnique({
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
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
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
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  if (!siteVisit) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/site-visits">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Site Visit</h1>
            <p className="text-muted-foreground">#{siteVisit.id.substring(0, 8)}</p>
          </div>
        </div>
        <Badge className={getStatusColor(siteVisit.status)}>
          {enumToReadable(siteVisit.status)}
        </Badge>
      </div>

      {/* Visit Info */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Scheduled:</span>{' '}
                <span className="text-sm">{formatDate(siteVisit.scheduledAt, 'PPp')}</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Visit Type:</span>{' '}
              <Badge variant="outline">{enumToReadable(siteVisit.visitType)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Assigned To:</span>{' '}
                <Link
                  href={`/admin/users/${siteVisit.assignedTo.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {siteVisit.assignedTo.name}
                </Link>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Created:</span>{' '}
              <span className="text-sm text-muted-foreground">
                {formatDate(siteVisit.createdAt, 'PPp')}
              </span>
            </div>
            {siteVisit.notes && (
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{siteVisit.notes}</p>
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
              {siteVisit.client ? (
                <Link
                  href={`/admin/clients/${siteVisit.client.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {siteVisit.client.name}
                </Link>
              ) : siteVisit.lead ? (
                <span className="text-sm">
                  {siteVisit.lead.name} <Badge variant="outline" className="ml-2">Lead</Badge>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <span className="text-sm font-medium">Phone:</span>{' '}
              <span className="text-sm">
                {siteVisit.client?.phone || siteVisit.lead?.phone || '-'}
              </span>
            </div>
            {siteVisit.site && (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <Link
                      href={`/admin/sites/${siteVisit.site.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {siteVisit.site.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{siteVisit.site.address}</p>
                    {siteVisit.site.city && (
                      <p className="text-sm text-muted-foreground">{siteVisit.site.city}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion Details (if completed) */}
      {siteVisit.status === 'COMPLETED' && siteVisit.completedAt && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Completed At:</span>{' '}
              <span className="text-sm">{formatDate(siteVisit.completedAt, 'PPp')}</span>
            </div>
            {siteVisit.completionNotes && (
              <div>
                <span className="text-sm font-medium">Completion Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {siteVisit.completionNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
