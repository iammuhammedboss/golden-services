import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { addWeeks } from 'date-fns'

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE': return 'default'
    case 'PAUSED': return 'secondary'
    case 'CANCELLED': return 'destructive'
    case 'COMPLETED': return 'outline'
    default: return 'secondary'
  }
}

function getFrequencyLabel(freq: string) {
  switch (freq) {
    case 'WEEKLY': return 'Weekly'
    case 'BI_WEEKLY': return 'Bi-Weekly'
    case 'MONTHLY': return 'Monthly'
    case 'QUARTERLY': return 'Quarterly'
    default: return freq
  }
}

export default async function AmcContractsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [contracts, stats] = await Promise.all([
    prisma.amcContract.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, phone: true } },
        quotation: {
          select: {
            quotationNumber: true,
            items: { where: { deletedAt: null }, select: { quantity: true, unitPrice: true } },
          },
        },
        visits: {
          select: { id: true, status: true, scheduledDate: true },
          orderBy: { scheduledDate: 'asc' },
        },
      },
    }),
    Promise.all([
      prisma.amcContract.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.amcContract.count({ where: { status: 'PAUSED', deletedAt: null } }),
      prisma.amcVisit.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: today, lte: addWeeks(today, 1) },
          amcContract: { deletedAt: null },
        },
      }),
      prisma.amcVisit.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { lt: today },
          amcContract: { deletedAt: null },
        },
      }),
    ]),
  ])

  const [active, paused, upcoming, overdue] = stats

  // Enrich contracts with computed fields
  const enrichedContracts = contracts.map((c) => {
    const totalVisits = c.visits.length
    const completedVisits = c.visits.filter((v) => v.status === 'COMPLETED').length
    const nextVisit = c.visits.find(
      (v) => v.status === 'SCHEDULED' && new Date(v.scheduledDate) >= today
    )
    const overdueCount = c.visits.filter(
      (v) => v.status === 'SCHEDULED' && new Date(v.scheduledDate) < today
    ).length

    // Calculate contract value
    const contractValue = c.quotation.items.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.unitPrice)
    }, 0)

    return {
      ...c,
      totalVisits,
      completedVisits,
      overdueCount,
      nextVisitDate: nextVisit?.scheduledDate,
      contractValue,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">AMC Contracts</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paused</p>
            <p className="text-2xl font-bold text-yellow-600">{paused}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Upcoming (7d)</p>
            <p className="text-2xl font-bold text-blue-600">{upcoming}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          {enrichedContracts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No AMC contracts yet. Create one by marking a quotation as AMC and accepting it.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Frequency</TableHead>
                    <TableHead className="hidden md:table-cell">Period</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="hidden md:table-cell">Next Visit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono text-sm">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.client.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {getFrequencyLabel(contract.frequency)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getFrequencyLabel(contract.frequency)}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-green-500"
                              style={{
                                width: `${contract.totalVisits > 0 ? (contract.completedVisits / contract.totalVisits) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {contract.completedVisits}/{contract.totalVisits}
                          </span>
                        </div>
                        {contract.overdueCount > 0 && (
                          <span className="text-xs text-red-500">{contract.overdueCount} overdue</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {contract.nextVisitDate ? formatDate(contract.nextVisitDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(contract.status) as any}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`amc/${contract.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
