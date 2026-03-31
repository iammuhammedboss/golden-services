import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewInvoices, type UserWithRoles } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'

export default async function InvoicesPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/${params.locale}/login`)
  const user = session.user as UserWithRoles
  if (!canViewInvoices(user)) redirect(`/${params.locale}/admin/dashboard`)

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true, phone: true } },
      jobOrder: { select: { jobNumber: true } },
      createdBy: { select: { name: true } },
    },
  })

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'DRAFT').length,
    sent: invoices.filter((i) => i.status === 'SENT').length,
    paid: invoices.filter((i) => i.status === 'PAID').length,
  }

  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0)

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <p className="text-xs text-gray-400">{stats.total} total &middot; Revenue: {formatCurrency(totalRevenue)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'All', value: stats.total, color: 'text-gray-800' },
          { label: 'Draft', value: stats.draft, color: 'text-gray-500' },
          { label: 'Sent', value: stats.sent, color: 'text-blue-600' },
          { label: 'Paid', value: stats.paid, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invoice Cards */}
      <div className="space-y-2">
        {invoices.length > 0 ? (
          invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/${params.locale}/admin/invoices/${inv.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                inv.status === 'PAID' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                inv.status === 'SENT' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                inv.status === 'OVERDUE' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                  <span className="text-xs text-gray-400">{inv.client.name}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(inv.issueDate, 'PP')}
                  {inv.jobOrder && ` · ${inv.jobOrder.jobNumber}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-bold text-gray-800">{formatCurrency(Number(inv.total))}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(inv.status)}`}>
                  {enumToReadable(inv.status)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center"><p className="text-sm text-gray-400">No invoices yet</p></div>
        )}
      </div>

      {/* FAB */}
      <Link
        href={`/${params.locale}/admin/invoices/new`}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
