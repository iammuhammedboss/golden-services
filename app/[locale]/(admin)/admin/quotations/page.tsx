import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default async function QuotationsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || 'en'

  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true, phone: true } },
      createdBy: { select: { name: true } },
      items: { select: { total: true } },
    },
    where: { deletedAt: null },
  })

  const withTotals = quotations.map((q) => ({
    ...q,
    total: q.items.reduce((sum, item) => sum + item.total.toNumber(), 0),
  }))

  const stats = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === 'DRAFT').length,
    sent: quotations.filter((q) => q.status === 'SENT').length,
    accepted: quotations.filter((q) => q.status === 'ACCEPTED').length,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Quotations</h1>
        <p className="text-xs text-gray-400">{stats.total} total quotations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'All', value: stats.total, color: 'text-gray-800' },
          { label: 'Draft', value: stats.draft, color: 'text-gray-500' },
          { label: 'Sent', value: stats.sent, color: 'text-blue-600' },
          { label: 'Accepted', value: stats.accepted, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quotation Cards */}
      <div className="space-y-2">
        {withTotals.length > 0 ? (
          withTotals.map((q) => (
            <Link
              key={q.id}
              href={`/${locale}/admin/quotations/${q.id}/view`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                q.status === 'ACCEPTED' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                q.status === 'SENT' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                q.status === 'REJECTED' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{q.client?.name || 'Unknown'}</p>
                  {q.isAmc && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">AMC</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(q.createdAt, 'PP')} &middot; by {q.createdBy.name}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-bold text-gray-800">{formatCurrency(q.total)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(q.status)}`}>
                  {enumToReadable(q.status)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center"><p className="text-sm text-gray-400">No quotations yet</p></div>
        )}
      </div>

      {/* FAB */}
      <Link
        href={`/${locale}/admin/quotations/new`}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
