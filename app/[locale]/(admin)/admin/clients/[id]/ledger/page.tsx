import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type LedgerEntry = {
  id: string
  date: Date
  reference: string
  description: string
  type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'ADJUSTMENT'
  debit: number
  credit: number
  balance: number
}

export default async function ClientLedgerPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params

  // Fetch client
  const client = await prisma.client.findUnique({
    where: { id },
  })

  if (!client) {
    notFound()
  }

  // Fetch all financial transactions
  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        clientId: id,
        deletedAt: null,
      },
      orderBy: {
        issueDate: 'asc',
      },
    }),
    prisma.payment.findMany({
      where: {
        clientId: id,
        deletedAt: null,
      },
      orderBy: {
        paymentDate: 'asc',
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    }),
  ])

  // Build ledger entries
  const ledgerEntries: LedgerEntry[] = []
  let runningBalance = 0

  // Combine and sort all entries
  const allEntries: Array<{
    date: Date
    type: 'INVOICE' | 'PAYMENT'
    data: any
  }> = [
    ...invoices.map((inv) => ({
      date: inv.issueDate,
      type: 'INVOICE' as const,
      data: inv,
    })),
    ...payments.map((pay) => ({
      date: pay.paymentDate,
      type: 'PAYMENT' as const,
      data: pay,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Process entries
  for (const entry of allEntries) {
    if (entry.type === 'INVOICE') {
      const inv = entry.data
      const debit = Number(inv.total)
      runningBalance += debit

      ledgerEntries.push({
        id: inv.id,
        date: inv.issueDate,
        reference: inv.invoiceNumber,
        description: inv.isProforma ? 'Proforma Invoice' : 'Invoice',
        type: 'INVOICE',
        debit,
        credit: 0,
        balance: runningBalance,
      })
    } else if (entry.type === 'PAYMENT') {
      const pay = entry.data
      const credit = Number(pay.amount)
      runningBalance -= credit

      ledgerEntries.push({
        id: pay.id,
        date: pay.paymentDate,
        reference: pay.invoice?.invoiceNumber || pay.referenceNumber || 'N/A',
        description: `Payment - ${pay.paymentMethod}`,
        type: 'PAYMENT',
        debit: 0,
        credit,
        balance: runningBalance,
      })
    }
  }

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0)
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0)
  const currentBalance = totalDebit - totalCredit

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/clients/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Client
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{client.name}</h1>
        <p className="text-muted-foreground">Ledger Statement</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">OMR {totalDebit.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">OMR {totalCredit.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              OMR {currentBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ledgerEntries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All financial transactions for this client</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="text-sm">{formatDate(entry.date, 'PP')}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.date, 'p')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.type === 'INVOICE' ? 'destructive' : 'default'}
                        >
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? (
                          <span className="text-red-600 font-medium">
                            OMR {entry.debit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? (
                          <span className="text-green-600 font-medium">
                            OMR {entry.credit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${entry.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          OMR {entry.balance.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No transactions found
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
