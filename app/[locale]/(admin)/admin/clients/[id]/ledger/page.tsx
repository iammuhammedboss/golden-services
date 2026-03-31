import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency } from '@/lib/utils'
import { notFound } from 'next/navigation'

type LedgerEntry = {
  id: string
  date: Date
  reference: string
  description: string
  type: 'INVOICE' | 'PAYMENT'
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

  const client = await prisma.client.findUnique({ where: { id } })
  if (!client) notFound()

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId: id, deletedAt: null },
      orderBy: { issueDate: 'asc' },
    }),
    prisma.payment.findMany({
      where: { clientId: id, deletedAt: null },
      orderBy: { paymentDate: 'asc' },
      include: { invoice: { select: { invoiceNumber: true } } },
    }),
  ])

  const ledgerEntries: LedgerEntry[] = []
  let runningBalance = 0

  const allEntries = [
    ...invoices.map((inv) => ({ date: inv.issueDate, type: 'INVOICE' as const, data: inv })),
    ...payments.map((pay) => ({ date: pay.paymentDate, type: 'PAYMENT' as const, data: pay })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

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
    } else {
      const pay = entry.data as any
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
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
        <p className="text-xs text-gray-400">Ledger Statement</p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Invoiced</p>
          <p className="mt-0.5 text-base font-bold text-red-600">{totalDebit.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400">OMR</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Paid</p>
          <p className="mt-0.5 text-base font-bold text-green-600">{totalCredit.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400">OMR</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${
          currentBalance > 0 ? 'border-orange-100 bg-orange-50' : 'border-green-100 bg-green-50'
        }`}>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Balance</p>
          <p className={`mt-0.5 text-base font-bold ${currentBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {currentBalance.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-400">OMR</p>
        </div>
      </div>

      {/* Payment Progress */}
      {totalDebit > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Payment Progress</span>
            <span>{Math.min(100, Math.round((totalCredit / totalDebit) * 100))}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
              style={{ width: `${Math.min(100, (totalCredit / totalDebit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Transaction Cards */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Transactions ({ledgerEntries.length})
        </h3>
        {ledgerEntries.length > 0 ? (
          <div className="space-y-2">
            {ledgerEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      entry.type === 'INVOICE'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-green-50 text-green-500'
                    }`}>
                      {entry.type === 'INVOICE' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{entry.description}</p>
                      <p className="text-xs text-gray-400">
                        {entry.reference} &middot; {formatDate(entry.date, 'PP')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {entry.type === 'INVOICE' ? (
                      <p className="text-sm font-bold text-red-600">+{entry.debit.toFixed(3)}</p>
                    ) : (
                      <p className="text-sm font-bold text-green-600">-{entry.credit.toFixed(3)}</p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      Bal: {entry.balance.toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
