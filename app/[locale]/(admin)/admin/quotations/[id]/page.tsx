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
import { ChevronLeft } from 'lucide-react'

export default async function QuotationDetailPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const quotation = await prisma.quotation.findUnique({
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
        },
      },
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!quotation) {
    notFound()
  }

  const total = quotation.items.reduce((sum, item) => sum + Number(item.total), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${params.locale}/admin/quotations`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Quotation</h1>
            <p className="text-muted-foreground">#{quotation.id.substring(0, 8)}</p>
          </div>
        </div>
        <Badge className={getStatusColor(quotation.status)}>
          {enumToReadable(quotation.status)}
        </Badge>
      </div>

      {/* Quotation Info */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Name:</span>{' '}
              {quotation.client ? (
                <Link
                  href={`/${params.locale}/admin/clients/${quotation.client.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {quotation.client.name}
                </Link>
              ) : quotation.lead ? (
                <span className="text-sm">{quotation.lead.name} (Lead)</span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <span className="text-sm font-medium">Phone:</span>{' '}
              <span className="text-sm">
                {quotation.client?.phone || quotation.lead?.phone || '-'}
              </span>
            </div>
            {quotation.client?.email && (
              <div>
                <span className="text-sm font-medium">Email:</span>{' '}
                <span className="text-sm">{quotation.client.email}</span>
              </div>
            )}
            {quotation.site && (
              <div>
                <span className="text-sm font-medium">Site:</span>{' '}
                <Link
                  href={`/${params.locale}/admin/sites/${quotation.site.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {quotation.site.name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Created:</span>{' '}
              <span className="text-sm text-muted-foreground">
                {formatDate(quotation.createdAt, 'PPp')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Created By:</span>{' '}
              <span className="text-sm">{quotation.createdBy.name}</span>
            </div>
            {quotation.validUntil && (
              <div>
                <span className="text-sm font-medium">Valid Until:</span>{' '}
                <span className="text-sm">{formatDate(quotation.validUntil, 'PP')}</span>
              </div>
            )}
            {quotation.notes && (
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>{quotation.items.length} items in this quotation</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{Number(item.quantity)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.total))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="text-right font-bold">
                    Grand Total:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
