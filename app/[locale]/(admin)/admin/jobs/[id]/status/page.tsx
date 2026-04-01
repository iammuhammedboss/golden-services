'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, formatTime, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'
import { useRealtimeEvents } from '@/hooks/use-realtime-events'
import { useConfirm } from '@/components/confirm-dialog'

export default function JobStatusPaymentPage() {
  const [job, setJob] = useState<any>(null)
  const [statusUpdates, setStatusUpdates] = useState<any[]>([])
  const [payments, setPayments] = useState<any>({ payments: [], totalPaid: 0 })
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [activeTab, setActiveTab] = useState<'status' | 'payment' | 'timeline'>('status')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', paymentSubOption: '', referenceNumber: '', notes: '' })
  const [paymentError, setPaymentError] = useState('')

  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const jobId = params.id as string
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchData = useCallback(async () => {
    try {
      const [jobRes, updatesRes, payRes, methodsRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`), fetch(`/api/jobs/${jobId}/status-updates`),
        fetch(`/api/jobs/${jobId}/payments`), fetch('/api/payment-methods'),
      ])
      if (jobRes.ok) {
        const d = await jobRes.json(); setJob(d)
        if (d.statusUpdates?.[0]?.progressPercent) setProgressPercent(d.statusUpdates[0].progressPercent)
      }
      if (updatesRes.ok) setStatusUpdates(await updatesRes.json())
      if (payRes.ok) setPayments(await payRes.json())
      if (methodsRes.ok) setPaymentMethods(await methodsRes.json())
    } catch { } finally { setLoading(false) }
  }, [jobId])

  useEffect(() => { fetchData() }, [fetchData])

  useRealtimeEvents({
    onJobStatusChanged: useCallback((e: any) => { if (e.jobId === jobId) fetchData() }, [jobId, fetchData]),
    onJobProgressUpdated: useCallback((e: any) => { if (e.jobId === jobId) fetchData() }, [jobId, fetchData]),
    onPaymentReceived: useCallback((e: any) => { if (e.jobId === jobId) fetchData() }, [jobId, fetchData]),
  })

  const postStatus = async (status: string) => {
    setSubmitting(true)
    try {
      await fetch(`/api/jobs/${jobId}/status-updates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, progressPercent, note: statusNote || undefined }),
      })
      setStatusNote('')
      await fetchData()
    } catch { } finally { setSubmitting(false) }
  }

  const cancelVisit = async () => {
    const ok = await confirm({ title: 'Cancel Visit', description: 'Cancel this visit? The job will remain open but this trip will be marked as cancelled.', variant: 'danger', confirmLabel: 'Cancel Visit' })
    if (ok) await postStatus('CANCELLED')
  }

  const cancelJob = async () => {
    const ok = await confirm({ title: 'Cancel Job', description: 'Cancel the entire job? This will mark the job as cancelled.', variant: 'danger', confirmLabel: 'Cancel Job' })
    if (!ok) return
    setSubmitting(true)
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...job, status: 'CANCELLED' }) })
      await fetchData()
    } catch { } finally { setSubmitting(false) }
  }

  const handlePayment = async () => {
    setPaymentError('')
    if (!paymentForm.amount || !paymentForm.paymentMethod) { setPaymentError('Amount and method required'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(paymentForm.amount), paymentMethod: paymentForm.paymentMethod, paymentSubOption: paymentForm.paymentSubOption || undefined, referenceNumber: paymentForm.referenceNumber || undefined, notes: paymentForm.notes || undefined }),
      })
      if (res.ok) { setPaymentForm({ amount: '', paymentMethod: '', paymentSubOption: '', referenceNumber: '', notes: '' }); setShowPaymentForm(false); await fetchData() }
      else { const err = await res.json(); setPaymentError(err.error || 'Failed') }
    } catch { setPaymentError('Failed') } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  if (!job) return <div className="py-20 text-center text-sm text-gray-400">Job not found</div>

  const latest = statusUpdates[0]?.status || null
  const isOnWay = latest === 'DEPARTED_TO_SITE'
  const isArrived = latest === 'ARRIVED_AT_SITE'
  const isWorking = latest === 'IN_PROGRESS'
  const isDone = latest === 'COMPLETION_REQUESTED' || latest === 'VERIFIED'
  const isCompleted = job.status === 'COMPLETED'
  const isCancelled = job.status === 'CANCELLED'
  const hasStarted = isOnWay || isArrived || isWorking || isDone
  const selectedMethod = paymentMethods.find((m: any) => m.name === paymentForm.paymentMethod)
  const quotationTotal = job.quotation?.items?.reduce((s: number, i: any) => s + Number(i.total), 0) || 0
  const jobTotal = quotationTotal || Number(job.amount || 0)
  const hasJobTotal = jobTotal > 0
  const amountDue = hasJobTotal ? Math.max(0, jobTotal - payments.totalPaid) : 0

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {ConfirmDialog}

      {/* Job Header */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-mono text-gray-400">{job.jobNumber}</p>
            <h2 className="text-lg font-bold text-gray-900">{job.client?.name}</h2>
            <p className="text-xs text-gray-400">{job.location || 'No location'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(job.status)}`}>{enumToReadable(job.status)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(job.paymentStatus || 'UNPAID')}`}>{enumToReadable(job.paymentStatus || 'UNPAID')}</span>
          </div>
        </div>
        <div className="mt-2 flex gap-3 text-xs text-gray-400">
          <span>{formatDate(job.scheduledDate)}</span>
          {job.scheduledStartTime && <span>{formatTime(job.scheduledStartTime)}</span>}
        </div>
        {job.assignments?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.assignments.map((a: any) => (
              <span key={a.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{a.user?.name} ({a.roleInJob})</span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Nav */}
      <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1">
        {(['status', 'payment', 'timeline'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
            {t === 'status' ? 'Status' : t === 'payment' ? 'Payment' : 'Timeline'}
          </button>
        ))}
      </div>

      {/* ===== STATUS TAB ===== */}
      {activeTab === 'status' && !isCompleted && !isCancelled && (
        <div className="space-y-4">
          {/* Progressive Action Buttons */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
            {/* Phase 1: Not started — show On the Way + Start */}
            {!hasStarted && !isDone && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => postStatus('DEPARTED_TO_SITE')} disabled={submitting}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-blue-200 bg-blue-50 py-5 text-blue-700 transition-all active:scale-95 disabled:opacity-50">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  <span className="text-sm font-bold">On the Way</span>
                </button>
                <button onClick={() => postStatus('IN_PROGRESS')} disabled={submitting}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 py-5 text-green-700 transition-all active:scale-95 disabled:opacity-50">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm font-bold">Start Job</span>
                </button>
              </div>
            )}

            {/* Phase 2: On the Way — show Arrived + Cancel Visit */}
            {isOnWay && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-blue-700">On the way to site...</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => postStatus('ARRIVED_AT_SITE')} disabled={submitting}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50 py-5 text-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-bold">Arrived</span>
                  </button>
                  <button onClick={cancelVisit} disabled={submitting}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 py-5 text-red-600 transition-all active:scale-95 disabled:opacity-50">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="text-sm font-bold">Cancel Visit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Phase 3: Arrived — show Start Work + Cancel Visit */}
            {isArrived && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-700">Arrived at site</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => postStatus('IN_PROGRESS')} disabled={submitting}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-orange-200 bg-orange-50 py-5 text-orange-700 transition-all active:scale-95 disabled:opacity-50">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm font-bold">Start Work</span>
                  </button>
                  <button onClick={cancelVisit} disabled={submitting}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 py-5 text-red-600 transition-all active:scale-95 disabled:opacity-50">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="text-sm font-bold">Cancel Visit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Phase 4: Working — show progress + finish + cancel visit */}
            {isWorking && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                  <span className="text-xs font-semibold text-orange-700">Work in progress...</span>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-bold text-primary">{progressPercent}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={progressPercent} onChange={(e) => setProgressPercent(parseInt(e.target.value))} className="mt-1 w-full accent-primary" />
                </div>

                {/* Note */}
                <Textarea placeholder="Add note (optional)..." value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} className="rounded-xl text-sm" />

                <button onClick={() => postStatus('COMPLETION_REQUESTED')} disabled={submitting}
                  className={`w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 ${
                    progressPercent === 100 ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-200/40' : 'bg-gray-400'
                  }`}>
                  {progressPercent < 100 ? `Finish Job (${progressPercent}%)` : 'Finish Job'}
                </button>

                <button onClick={cancelVisit} disabled={submitting} className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-medium text-red-600 active:scale-[0.98]">
                  Cancel Visit
                </button>
              </div>
            )}

            {/* Phase 5: Done / Completion Requested */}
            {isDone && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs font-semibold text-green-700">Job completed - awaiting verification</span>
                </div>

                {/* Payment prompt — show right after job finishes */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                    <span className="text-xs font-semibold text-amber-700">
                      Payment: {!hasJobTotal ? 'No amount set' : amountDue > 0 ? `${formatCurrency(amountDue)} due` : 'Fully paid'}
                    </span>
                  </div>
                  {(amountDue > 0 || !hasJobTotal) && (
                    <button onClick={() => setActiveTab('payment')} className="mt-2 w-full rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white active:scale-[0.98]">
                      Collect Payment
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => postStatus('DEPARTED_SITE')} disabled={submitting}
                    className="rounded-2xl border-2 border-purple-200 bg-purple-50 py-4 text-sm font-bold text-purple-700 active:scale-95 disabled:opacity-50">
                    Left Site
                  </button>
                  <button onClick={() => postStatus('ARRIVED_OFFICE')} disabled={submitting}
                    className="rounded-2xl border-2 border-teal-200 bg-teal-50 py-4 text-sm font-bold text-teal-700 active:scale-95 disabled:opacity-50">
                    At Office
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cancel Job — always available */}
          {!isCompleted && !isCancelled && (
            <button onClick={cancelJob} disabled={submitting} className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-xs font-medium text-red-500 active:scale-[0.98]">
              Cancel Entire Job
            </button>
          )}
        </div>
      )}

      {/* Completed/Cancelled State — show status + payment inline */}
      {activeTab === 'status' && (isCompleted || isCancelled) && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isCompleted ? 'bg-green-50' : 'bg-red-50'}`}>
              {isCompleted ? (
                <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold text-gray-900">{isCompleted ? 'Job Completed' : 'Job Cancelled'}</h3>
          </div>

          {/* Payment Status Card — always visible after job ends */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Status</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div className={`grid gap-2 ${hasJobTotal ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-center">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Total</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-800">{hasJobTotal ? formatCurrency(jobTotal) : 'Not set'}</p>
                </div>
                <div className="rounded-xl border border-green-100 bg-green-50 p-2 text-center">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Paid</p>
                  <p className="mt-0.5 text-sm font-bold text-green-700">{formatCurrency(payments.totalPaid)}</p>
                </div>
                {hasJobTotal && (
                  <div className={`rounded-xl border p-2 text-center ${amountDue > 0 ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                    <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Due</p>
                    <p className={`mt-0.5 text-sm font-bold ${amountDue > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(amountDue)}</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {jobTotal > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Payment progress</span>
                    <span>{Math.min(100, Math.round((payments.totalPaid / jobTotal) * 100))}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (payments.totalPaid / jobTotal) * 100)}%` }} />
                  </div>
                </div>
              )}

              {/* Paid badge or Add Payment */}
              {hasJobTotal && amountDue <= 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm font-semibold text-green-700">Fully Paid</span>
                </div>
              ) : !showPaymentForm ? (
                <button onClick={() => setShowPaymentForm(true)} className="w-full rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 active:scale-[0.98]">
                  + Record Payment
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Record Payment</span>
                    <button onClick={() => { setShowPaymentForm(false); setPaymentError('') }} className="text-[10px] text-gray-400">Cancel</button>
                  </div>
                  {paymentError && <div className="rounded-lg bg-red-50 px-2 py-1.5 text-[10px] text-red-600">{paymentError}</div>}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5"><Label className="text-[10px] text-gray-400">Amount *</Label><Input type="number" step="0.001" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.000" className="rounded-lg h-9 text-sm" /></div>
                    <div className="space-y-0.5"><Label className="text-[10px] text-gray-400">Method *</Label>
                      <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v, paymentSubOption: '' })}>
                        <SelectTrigger className="rounded-lg h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{paymentMethods.map((m: any) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedMethod?.subOptions?.length > 0 && (
                    <Select value={paymentForm.paymentSubOption} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentSubOption: v })}>
                      <SelectTrigger className="rounded-lg h-9 text-sm"><SelectValue placeholder="Transfer to..." /></SelectTrigger>
                      <SelectContent>{selectedMethod.subOptions.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {amountDue > 0 && (
                    <div className="flex gap-1.5">
                      <button onClick={() => setPaymentForm({ ...paymentForm, amount: amountDue.toFixed(3) })} className="rounded-md border bg-white px-2 py-1 text-[10px] font-medium text-gray-600 active:scale-95">Full ({formatCurrency(amountDue)})</button>
                    </div>
                  )}
                  <button onClick={handlePayment} disabled={submitting || !paymentForm.amount || !paymentForm.paymentMethod}
                    className="w-full rounded-lg bg-green-600 py-2.5 text-xs font-semibold text-white active:scale-[0.98] disabled:opacity-50">
                    {submitting ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              )}

              {/* Recent payments */}
              {payments.payments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">History</p>
                  {payments.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-2">
                      <div>
                        <span className="text-xs font-medium text-gray-700">{p.paymentMethod}</span>
                        {p.paymentSubOption && <span className="text-[10px] text-gray-400"> ({p.paymentSubOption})</span>}
                        <p className="text-[10px] text-gray-300">{p.recordedBy?.name} &middot; {formatDate(p.createdAt, 'PP')}</p>
                      </div>
                      <span className="text-xs font-bold text-green-600">+{formatCurrency(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== PAYMENT TAB ===== */}
      {activeTab === 'payment' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className={`grid gap-2 ${hasJobTotal ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Total</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">{hasJobTotal ? formatCurrency(jobTotal) : 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-2.5 text-center shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Paid</p>
              <p className="mt-0.5 text-sm font-bold text-green-700">{formatCurrency(payments.totalPaid)}</p>
            </div>
            {hasJobTotal && (
              <div className={`rounded-xl border p-2.5 text-center shadow-sm ${amountDue > 0 ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'}`}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Due</p>
                <p className={`mt-0.5 text-sm font-bold ${amountDue > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(amountDue)}</p>
              </div>
            )}
          </div>

          {/* Add Payment */}
          {!showPaymentForm ? (
            <button onClick={() => setShowPaymentForm(true)} className="w-full rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 active:scale-[0.98]">
              + Record Payment
            </button>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Record Payment</h3>
                <button onClick={() => { setShowPaymentForm(false); setPaymentError('') }} className="text-xs text-gray-400">Cancel</button>
              </div>
              {paymentError && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{paymentError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs text-gray-500">Amount *</Label><Input type="number" step="0.001" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.000" className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs text-gray-500">Method *</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v, paymentSubOption: '' })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{paymentMethods.map((m: any) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {selectedMethod?.subOptions?.length > 0 && (
                <div className="space-y-1"><Label className="text-xs text-gray-500">Transfer To</Label>
                  <Select value={paymentForm.paymentSubOption} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentSubOption: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{selectedMethod.subOptions.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {amountDue > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => setPaymentForm({ ...paymentForm, amount: amountDue.toFixed(3) })} className="rounded-lg border bg-gray-50 px-3 py-1 text-[10px] font-medium text-gray-600 active:scale-95">Full ({formatCurrency(amountDue)})</button>
                  {amountDue > 1 && <button onClick={() => setPaymentForm({ ...paymentForm, amount: (amountDue / 2).toFixed(3) })} className="rounded-lg border bg-gray-50 px-3 py-1 text-[10px] font-medium text-gray-600 active:scale-95">Half</button>}
                </div>
              )}
              <button onClick={handlePayment} disabled={submitting || !paymentForm.amount || !paymentForm.paymentMethod}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3 text-sm font-semibold text-white shadow-md active:scale-[0.98] disabled:opacity-50">
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          )}

          {/* Payment History */}
          {payments.payments.length > 0 && (
            <div className="space-y-2">
              {payments.payments.map((p: any) => (
                <div key={p.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{p.paymentMethod}</span>
                      {p.paymentSubOption && <span className="text-xs text-gray-400"> ({p.paymentSubOption})</span>}
                      {p.referenceNumber && <p className="text-xs text-gray-400">Ref: {p.referenceNumber}</p>}
                      <p className="mt-0.5 text-[10px] text-gray-300">{p.recordedBy?.name} &middot; {formatDate(p.createdAt, 'PP')}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{formatCurrency(Number(p.amount))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TIMELINE TAB ===== */}
      {activeTab === 'timeline' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          {statusUpdates.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No updates yet</p>
          ) : (
            <div className="space-y-0">
              {statusUpdates.map((u: any, i: number) => (
                <div key={u.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${
                      u.status === 'CANCELLED' ? 'bg-red-500' :
                      u.status === 'COMPLETION_REQUESTED' || u.status === 'VERIFIED' ? 'bg-green-500' :
                      u.status === 'IN_PROGRESS' ? 'bg-orange-500' :
                      u.status === 'DEPARTED_TO_SITE' ? 'bg-blue-500' :
                      u.status === 'ARRIVED_AT_SITE' ? 'bg-indigo-500' :
                      'bg-gray-400'
                    }`} />
                    {i < statusUpdates.length - 1 && <div className="w-px flex-1 bg-gray-100" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{enumToReadable(u.status)}</span>
                      <span className="text-[10px] text-gray-300">{formatTime(u.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {u.createdBy?.name}{u.progressPercent > 0 && ` — ${u.progressPercent}%`}
                    </p>
                    {u.note && <p className="mt-1 rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-600">{u.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
