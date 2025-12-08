import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusColor, enumToReadable } from '@/lib/utils'
import { MeasurementSection } from '@/components/measurement-section'

export default async function SiteVisitDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const siteVisit = await prisma.siteVisit.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      assignedTo: true,
      lead: true,
      rooms: {
        include: {
          items: {
            include: {
              itemMaster: true,
            },
          },
          photos: true,
        },
      },
      measurementItems: {
        include: {
          itemType: true,
          roomType: true,
        },
      },
    },
  })

  if (!siteVisit) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Site Visit Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusColor(siteVisit.status)}>
                  {enumToReadable(siteVisit.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled For</span>
                <span>{formatDate(siteVisit.scheduledAt, 'PPpp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned To</span>
                <span>{siteVisit.assignedTo.name}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{siteVisit.client?.name}</p>
              <p className="text-muted-foreground">{siteVisit.client?.phone}</p>
              {siteVisit.client?.email && (
                <p className="text-sm text-muted-foreground">{siteVisit.client.email}</p>
              )}
            </CardContent>
          </Card>
          {siteVisit.lead && (
            <Card>
              <CardHeader>
                <CardTitle>Originating Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{siteVisit.lead.name}</p>
                <p className="text-muted-foreground">{siteVisit.lead.phone}</p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Data</CardTitle>
            </CardHeader>
            <CardContent>
              <MeasurementSection siteVisit={siteVisit} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}