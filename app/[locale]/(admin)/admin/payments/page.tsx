import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency, enumToReadable } from '@/lib/utils'
import Link from 'next/link'

export default async function PaymentsPage({ params, searchParams }: { params: { locale: string }; searchParams: { clientId?: string } }) {
  const locale = params.locale || 'en'
  const clientId = searchParams.clientId

  const where: any = { deletedAt: null }
  if (clientId) where.clientId = clientId

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    where,
    include: {
      client: { select: { name: true, phone: true } },
      invoice: { select: { invoiceNumber: true } },
      recordedBy: { select: { name: true } },
      jobOrder: { select: { jobNumber: true } },
    },
  })

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const filterClient = clientId && payments.length > 0 ? payments[0].client?.name : null

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {filterClient ? `${filterClient} — Payments` : 'Payments'}
        </h1>
        <p className="text-xs text-gray-400">
          {payments.length} {filterClient ? 'payments for this client' : 'total payments'}
          {clientId && (
            <> &middot; <a href={`/${locale}/admin/payments`} className="text-primary underline">View all</a></>
          )}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-800">{payments.length}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Transactions</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-center shadow-sm">
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalAmount)}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Total Paid</p>
        </div>
      </div>

      {/* Payment Cards */}
      <div className="space-y-2">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{payment.paymentMethod}</span>
                      {payment.paymentSubOption && (
                        <span className="text-xs text-gray-400">({payment.paymentSubOption})</span>
                      )}
                    </div>
                    {!clientId && payment.client && (
                      <p className="text-xs text-gray-500">{payment.client.name}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {payment.invoice?.invoiceNumber && `Inv: ${payment.invoice.invoiceNumber}`}
                      {payment.jobOrder?.jobNumber && ` · Job: ${payment.jobOrder.jobNumber}`}
                    </p>
                    {payment.referenceNumber && (
                      <p className="text-xs text-gray-400">Ref: {payment.referenceNumber}</p>
                    )}
                    {payment.notes && (
                      <p className="text-xs text-gray-400">{payment.notes}</p>
                    )}
                    <p className="mt-1 text-[10px] text-gray-300">
                      {payment.recordedBy?.name} &middot; {formatDate(payment.createdAt, 'PP')}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  +{formatCurrency(Number(payment.amount))}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">No payments recorded</p>
          </div>
        )}
      </div>
    </div>
  )
}
