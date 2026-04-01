'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'
import { useConfirm } from '@/components/confirm-dialog'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = params.locale as string
  const clientId = searchParams.get('clientId')
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchInvoices = async () => {
    try {
      const url = clientId ? `/api/invoices?clientId=${clientId}` : '/api/invoices'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setInvoices(Array.isArray(data) ? data : data.invoices || [])
      }
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchInvoices() }, [clientId])

  const filterClient = clientId && invoices.length > 0 ? invoices[0].client?.name : null

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i: any) => i.status === 'DRAFT').length,
    sent: invoices.filter((i: any) => i.status === 'SENT').length,
    paid: invoices.filter((i: any) => i.status === 'PAID').length,
  }

  const totalRevenue = invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + Number(i.total), 0)

  const handleDelete = async (id: string, number: string) => {
    const ok = await confirm({
      title: 'Delete Invoice',
      description: `Delete invoice "${number}"? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setActionMenuId(null)
        fetchInvoices()
      }
    } catch { alert('Failed to delete') }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        router.push(`/${locale}/admin/invoices/${data.id || data.invoice?.id}`)
      } else {
        alert('Failed to duplicate')
      }
    } catch { alert('Failed to duplicate') }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {ConfirmDialog}

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {filterClient ? `${filterClient} — Invoices` : 'Invoices'}
        </h1>
        <p className="text-xs text-gray-400">
          {stats.total} {filterClient ? 'invoices for this client' : 'total'} &middot; Revenue: {formatCurrency(totalRevenue)}
          {clientId && (
            <> &middot; <a href={`/${locale}/admin/invoices`} className="text-primary underline">View all</a></>
          )}
        </p>
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
          invoices.map((inv: any) => (
            <div key={inv.id} className="relative rounded-2xl border border-gray-100 bg-white shadow-sm">
              <Link
                href={`/${locale}/admin/invoices/${inv.id}`}
                className="flex items-center gap-3 p-3.5 active:scale-[0.98]"
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
                    {inv.isProforma && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">Proforma</span>}
                    <span className="text-xs text-gray-400">{inv.client?.name}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(inv.issueDate, 'PP')}
                    {inv.jobOrder?.jobNumber && ` · ${inv.jobOrder.jobNumber}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-bold text-gray-800">{formatCurrency(Number(inv.total))}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(inv.status)}`}>
                    {enumToReadable(inv.status)}
                  </span>
                </div>
              </Link>

              {/* Action button */}
              <button
                onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === inv.id ? null : inv.id) }}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>

              {/* Action dropdown */}
              {actionMenuId === inv.id && (
                <div className="absolute right-2 top-10 z-20 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg" onClick={() => setActionMenuId(null)}>
                  <Link href={`/${locale}/admin/invoices/${inv.id}`} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View / Edit
                  </Link>
                  <button onClick={() => handleDuplicate(inv.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Duplicate
                  </button>
                  <div className="my-1 border-t border-gray-50" />
                  <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center"><p className="text-sm text-gray-400">No invoices yet</p></div>
        )}
      </div>

      {/* Close action menus when clicking elsewhere */}
      {actionMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
      )}

      {/* New Invoice Type Selector */}
      {showNewMenu && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" onClick={() => setShowNewMenu(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative z-10 mx-4 mb-4 w-full max-w-sm animate-fadeIn rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl sm:mb-0" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center text-base font-bold text-gray-900">New Invoice</h3>
            <p className="mt-1 text-center text-xs text-gray-400">Choose invoice type</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href={`/${locale}/admin/invoices/new?type=proforma`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Proforma</span>
                <span className="text-[10px] text-gray-400">Draft / Quote</span>
              </Link>
              <Link
                href={`/${locale}/admin/invoices/new?type=tax`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Tax Invoice</span>
                <span className="text-[10px] text-gray-400">Official billing</span>
              </Link>
            </div>
            <button
              onClick={() => setShowNewMenu(false)}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowNewMenu(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
