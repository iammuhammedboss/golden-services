'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatCurrency, getInitials, enumToReadable, getStatusColor } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ClientData = Record<string, any>

export default function ClientDetailsPage() {
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'jobs' | 'payments'>('info')
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    jobId: '',
    amount: '',
    paymentMethod: '',
    paymentSubOption: '',
    referenceNumber: '',
    notes: '',
  })
  const [paymentError, setPaymentError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const id = params.id as string

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${id}`)
      if (response.ok) setClient(await response.json())
    } catch (error) {
      console.error('Failed to fetch client:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchClient() }, [fetchClient])
  useEffect(() => {
    fetch('/api/payment-methods').then(r => r.ok ? r.json() : []).then(setPaymentMethods).catch(() => {})
  }, [])

  const handleDelete = async () => {
    if (!client) return
    if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (res.ok) router.push(`/${locale}/admin/clients`)
      else alert('Failed to delete client')
    } catch {
      alert('Failed to delete client')
    }
  }

  const handlePayment = async () => {
    setPaymentError('')
    if (!paymentForm.amount || !paymentForm.paymentMethod || !paymentForm.jobId) {
      setPaymentError('Job, amount and payment method are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/jobs/${paymentForm.jobId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          paymentSubOption: paymentForm.paymentSubOption || undefined,
          referenceNumber: paymentForm.referenceNumber || undefined,
          notes: paymentForm.notes || undefined,
        }),
      })
      if (res.ok) {
        setPaymentForm({ jobId: '', amount: '', paymentMethod: '', paymentSubOption: '', referenceNumber: '', notes: '' })
        setShowPaymentForm(false)
        await fetchClient()
      } else {
        const err = await res.json()
        setPaymentError(err.error || 'Failed to record payment')
      }
    } catch {
      setPaymentError('Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!client) {
    return <div className="flex flex-col items-center justify-center py-20"><p className="text-sm text-gray-400">Client not found</p></div>
  }

  const jobs = client.jobOrders || []
  const payments = client.payments || []
  const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const selectedMethod = paymentMethods.find((m: any) => m.name === paymentForm.paymentMethod)

  // Action tiles
  const actionTiles = [
    { label: 'Edit', href: `/${locale}/admin/clients/${id}/edit`, color: 'from-blue-500 to-blue-600', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
    { label: 'Ledger', href: `/${locale}/admin/clients/${id}/ledger`, color: 'from-emerald-500 to-emerald-600', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg> },
    { label: 'Quotation', href: `/${locale}/admin/quotations?clientId=${id}`, color: 'from-orange-500 to-orange-600', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'New Job', href: `/${locale}/admin/jobs/new?clientId=${id}`, color: 'from-cyan-500 to-cyan-600', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg> },
    { label: 'Invoice', href: `/${locale}/admin/invoices?clientId=${id}`, color: 'from-pink-500 to-pink-600', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { label: 'Site Visit', href: `/${locale}/admin/site-visits?clientId=${id}`, color: 'from-violet-500 to-violet-600', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md ${
            client.type === 'CORPORATE' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {getInitials(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-gray-900">{client.name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                client.type === 'CORPORATE' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
              }`}>{enumToReadable(client.type)}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                client.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : client.status === 'BLACKLISTED' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
              }`}>{enumToReadable(client.status)}</span>
            </div>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <a href={`tel:${client.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 py-2.5 text-xs font-semibold text-green-700 active:scale-95">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Call
          </a>
          <a href={`https://wa.me/${(client.whatsapp || client.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-700 active:scale-95">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            WhatsApp
          </a>
          {client.email ? (
            <a href={`mailto:${client.email}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-semibold text-blue-700 active:scale-95">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-xs text-gray-400">No email</div>
          )}
        </div>
      </div>

      {/* Action Tiles */}
      <div className="grid grid-cols-3 gap-2">
        {actionTiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition-all hover:shadow-md active:scale-95">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tile.color} text-white shadow-sm transition-transform group-hover:scale-110`}>{tile.icon}</div>
            <span className="mt-1.5 text-[11px] font-semibold text-gray-600">{tile.label}</span>
          </Link>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1">
        {(['info', 'jobs', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}
          >
            {tab === 'info' ? 'Info' : tab === 'jobs' ? `Jobs (${jobs.length})` : `Payments (${payments.length})`}
          </button>
        ))}
      </div>

      {/* ===== INFO TAB ===== */}
      {activeTab === 'info' && (
        <div className="space-y-3">
          <InfoSection title="Contact Info">
            <InfoRow label="Phone" value={client.phone} />
            {client.alternatePhone && <InfoRow label="Alt Phone" value={client.alternatePhone} />}
            {client.whatsapp && client.whatsapp !== client.phone && <InfoRow label="WhatsApp" value={client.whatsapp} />}
            {client.email && <InfoRow label="Email" value={client.email} />}
          </InfoSection>
          {client.notes && (
            <InfoSection title="Notes">
              <div className="px-4 py-3"><p className="whitespace-pre-wrap text-sm text-gray-700">{client.notes}</p></div>
            </InfoSection>
          )}
          <InfoSection title="Meta">
            <InfoRow label="Source" value={enumToReadable(client.source)} />
            <InfoRow label="Created" value={formatDate(client.createdAt, 'PPP')} />
          </InfoSection>
          <button onClick={handleDelete} className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 active:scale-[0.98]">
            Delete Client
          </button>
        </div>
      )}

      {/* ===== JOBS TAB ===== */}
      {activeTab === 'jobs' && (
        <div className="space-y-2">
          {jobs.length > 0 ? (
            jobs.map((job: any) => {
              const jobTotal = job.quotation?.items?.reduce((s: number, i: any) => s + Number(i.total), 0) || 0
              return (
                <Link
                  key={job.id}
                  href={`/${locale}/admin/jobs/${job.id}/status`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm active:scale-[0.98]"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.jobNumber}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(job.scheduledDate, 'PP')}
                      {job.location && ` - ${job.location}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(job.status)}`}>
                      {enumToReadable(job.status)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(job.paymentStatus || 'UNPAID')}`}>
                      {enumToReadable(job.paymentStatus || 'UNPAID')}
                    </span>
                    {jobTotal > 0 && <span className="text-[10px] text-gray-400">{formatCurrency(jobTotal)}</span>}
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No jobs yet</p>
              <Link href={`/${locale}/admin/jobs/new?clientId=${id}`} className="mt-2 inline-block text-xs font-medium text-primary">
                Create first job
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ===== PAYMENTS TAB ===== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Total Paid Summary */}
          <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Total Paid</p>
            <p className="mt-0.5 text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
          </div>

          {/* Add Payment Button */}
          {!showPaymentForm && jobs.length > 0 && (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 active:scale-[0.98]"
            >
              + Record Payment
            </button>
          )}

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Record Payment</h3>
                <button onClick={() => { setShowPaymentForm(false); setPaymentError('') }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>

              {paymentError && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{paymentError}</div>
              )}

              {/* Select Job */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Job <span className="text-red-400">*</span></Label>
                <Select value={paymentForm.jobId} onValueChange={(v) => setPaymentForm({ ...paymentForm, jobId: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select job..." /></SelectTrigger>
                  <SelectContent>
                    {jobs.map((job: any) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.jobNumber} - {enumToReadable(job.status)} ({enumToReadable(job.paymentStatus || 'UNPAID')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Amount (OMR) <span className="text-red-400">*</span></Label>
                  <Input type="number" step="0.001" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.000" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Method <span className="text-red-400">*</span></Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v, paymentSubOption: '' })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Method..." /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m: any) => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedMethod?.subOptions?.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Transfer To</Label>
                  <Select value={paymentForm.paymentSubOption} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentSubOption: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {selectedMethod.subOptions.map((s: any) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Reference</Label>
                <Input value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} placeholder="Transaction ref..." className="rounded-xl" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Notes</Label>
                <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Optional notes..." rows={2} className="rounded-xl text-sm" />
              </div>

              <button
                onClick={handlePayment}
                disabled={submitting || !paymentForm.jobId || !paymentForm.amount || !paymentForm.paymentMethod}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3 text-sm font-semibold text-white shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          )}

          {/* Payment History */}
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((payment: any) => (
                <div key={payment.id} className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{payment.paymentMethod}</span>
                        {payment.paymentSubOption && <span className="text-xs text-gray-400">({payment.paymentSubOption})</span>}
                      </div>
                      {payment.invoice?.invoiceNumber && (
                        <p className="text-xs text-gray-400">Inv: {payment.invoice.invoiceNumber}</p>
                      )}
                      {payment.referenceNumber && (
                        <p className="text-xs text-gray-400">Ref: {payment.referenceNumber}</p>
                      )}
                      {payment.notes && <p className="text-xs text-gray-400">{payment.notes}</p>}
                      <p className="mt-1 text-[10px] text-gray-300">
                        {payment.recordedBy?.name} &middot; {formatDate(payment.createdAt, 'PP')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{formatCurrency(Number(payment.amount))}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : !showPaymentForm && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">No payments recorded</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}
