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
import Link from 'next/link'

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: {
        select: {
          name: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          total: true,
        },
      },
    },
    where: {
      deletedAt: null,
    },
  })

  // Calculate totals for each quotation
  const quotationsWithTotals = quotations.map((q) => ({
    ...q,
    total: q.items.reduce((sum, item) => {
      return sum + item.total.toNumber()
    }, 0),
  }))

  const stats = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === 'DRAFT').length,
    sent: quotations.filter((q) => q.status === 'SENT').length,
    accepted: quotations.filter((q) => q.status === 'ACCEPTED').length,
    rejected: quotations.filter((q) => q.status === 'REJECTED').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground">Manage quotations and proposals</p>
        </div>
        <Button asChild>
            <Link href="/admin/quotations/new">+ New Quotation</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>A list of all quotations and their status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotationsWithTotals.length > 0 ? (
                quotationsWithTotals.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {quotation.client?.name || 'Unknown'}
                        </div>
                        <div className="text-muted-foreground">
                          {quotation.client?.phone || '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge className={getStatusColor(quotation.status)}>
                          {enumToReadable(quotation.status)}
                        </Badge>
                        {quotation.isAmc && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                            AMC
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatCurrency(quotation.total)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {quotation.validUntil ? (
                        <div className="text-sm">{formatDate(quotation.validUntil, 'PP')}</div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(quotation.createdAt, 'PP')}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(quotation.createdAt, 'p')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{quotation.createdBy.name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/quotations/${quotation.id}/view`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No quotations found
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
