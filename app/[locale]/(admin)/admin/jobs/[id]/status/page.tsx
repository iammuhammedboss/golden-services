'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { formatDate, formatTime, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'
import { useRealtimeEvents } from '@/hooks/use-realtime-events'

const JOB_STATUSES = [
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' },
]

const PROGRESS_STATUSES = [
  { value: 'AT_STORE', label: 'At Store', color: 'bg-gray-500', icon: '🏪' },
  { value: 'MATERIALS_TAKEN', label: 'Materials Taken', color: 'bg-yellow-500', icon: '📦' },
  { value: 'DEPARTED_TO_SITE', label: 'Departed to Site', color: 'bg-blue-500', icon: '🚗' },
  { value: 'ARRIVED_AT_SITE', label: 'Arrived at Site', color: 'bg-indigo-500', icon: '📍' },
  { value: 'IN_PROGRESS', label: 'Work in Progress', color: 'bg-orange-500', icon: '🔧' },
  { value: 'COMPLETION_REQUESTED', label: 'Completion Requested', color: 'bg-green-500', icon: '✅' },
  { value: 'VERIFIED', label: 'Verified', color: 'bg-emerald-600', icon: '✔️' },
  { value: 'DEPARTED_SITE', label: 'Departed Site', color: 'bg-purple-500', icon: '🚗' },
  { value: 'ARRIVED_OFFICE', label: 'Arrived Office', color: 'bg-teal-500', icon: '🏢' },
]

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-800 border-red-200',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
}

export default function JobStatusPaymentPage() {
  const [job, setJob] = useState<any>(null)
  const [statusUpdates, setStatusUpdates] = useState<any[]>([])
  const [payments, setPayments] = useState<any>({ payments: [], totalPaid: 0 })
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [activeSection, setActiveSection] = useState<'status' | 'payment'>('status')

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    paymentSubOption: '',
    referenceNumber: '',
    receiptUrl: '',
    notes: '',
  })
  const [paymentError, setPaymentError] = useState('')

  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const fetchData = useCallback(async () => {
    try {
      const [jobRes, updatesRes, payRes, methodsRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/jobs/${jobId}/status-updates`),
        fetch(`/api/jobs/${jobId}/payments`),
        fetch('/api/payment-methods'),
      ])
      if (jobRes.ok) {
        const jobData = await jobRes.json()
        setJob(jobData)
        // Set progress from latest status update
        if (jobData.statusUpdates?.length > 0) {
          const latest = jobData.statusUpdates[0]
          if (latest.progressPercent) setProgressPercent(latest.progressPercent)
        }
      }
      if (updatesRes.ok) setStatusUpdates(await updatesRes.json())
      if (payRes.ok) setPayments(await payRes.json())
      if (methodsRes.ok) setPaymentMethods(await methodsRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { fetchData() }, [fetchData])

  // Real-time updates
  useRealtimeEvents({
    onJobStatusChanged: useCallback((e: any) => {
      if (e.jobId === jobId) fetchData()
    }, [jobId, fetchData]),
    onJobProgressUpdated: useCallback((e: any) => {
      if (e.jobId === jobId) fetchData()
    }, [jobId, fetchData]),
    onPaymentReceived: useCallback((e: any) => {
      if (e.jobId === jobId) fetchData()
    }, [jobId, fetchData]),
  })

  const handleProgressStatusUpdate = async (status: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/status-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          progressPercent,
          note: statusNote || undefined,
        }),
      })
      if (res.ok) {
        setStatusNote('')
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleJobStatusChange = async (newStatus: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status: newStatus }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Failed to update job status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSubmit = async () => {
    setPaymentError('')
    if (!paymentForm.amount || !paymentForm.paymentMethod) {
      setPaymentError('Amount and payment method are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          paymentSubOption: paymentForm.paymentSubOption || undefined,
          referenceNumber: paymentForm.referenceNumber || undefined,
          receiptUrl: paymentForm.receiptUrl || undefined,
          notes: paymentForm.notes || undefined,
        }),
      })
      if (res.ok) {
        setPaymentForm({ amount: '', paymentMethod: '', paymentSubOption: '', referenceNumber: '', receiptUrl: '', notes: '' })
        await fetchData()
      } else {
        const err = await res.json()
        setPaymentError(err.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Failed to record payment:', error)
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

  if (!job) {
    return <div className="p-8 text-center text-muted-foreground">Job not found</div>
  }

  const latestProgressStatus = statusUpdates[0]?.status || null
  const selectedMethod = paymentMethods.find((m: any) => m.name === paymentForm.paymentMethod)
  const quotationTotal = job.quotation?.items?.reduce(
    (sum: number, item: any) => sum + Number(item.total), 0
  ) || 0
  const amountDue = Math.max(0, quotationTotal - payments.totalPaid)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Job {job.jobNumber}</h1>
            <Badge className={getStatusColor(job.status)}>{enumToReadable(job.status)}</Badge>
            <Badge className={PAYMENT_STATUS_COLORS[job.paymentStatus] || 'bg-gray-100'}>
              {enumToReadable(job.paymentStatus || 'UNPAID')}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.client?.name} &middot; {formatDate(job.scheduledDate)}
            {job.scheduledStartTime && <> &middot; {formatTime(job.scheduledStartTime)}</>}
            {job.location && <> &middot; {job.location}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/jobs/${jobId}`)}>
            Edit Job
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/jobs/${jobId}/field`)}>
            Field View
          </Button>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex rounded-lg border bg-muted p-1">
        <button
          onClick={() => setActiveSection('status')}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
            activeSection === 'status' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Job Status
        </button>
        <button
          onClick={() => setActiveSection('payment')}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
            activeSection === 'payment' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Payments
        </button>
      </div>

      {/* ==================== JOB STATUS SECTION ==================== */}
      {activeSection === 'status' && (
        <div className="space-y-6">
          {/* Quick Job Status Change */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {JOB_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleJobStatusChange(s.value)}
                    disabled={submitting || job.status === s.value}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                      job.status === s.value
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Slider */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion</span>
                <span className="text-lg font-bold text-primary">{progressPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPercent}
                onChange={(e) => setProgressPercent(parseInt(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>

          {/* Progress Status Buttons */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progress Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROGRESS_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleProgressStatusUpdate(s.value)}
                    disabled={submitting}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                      latestProgressStatus === s.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <div>
                <Textarea
                  placeholder="Add a note with this update (optional)..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {statusUpdates.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No status updates yet</p>
              ) : (
                <div className="space-y-0">
                  {statusUpdates.map((update: any, idx: number) => {
                    const statusDef = PROGRESS_STATUSES.find(s => s.value === update.status)
                    return (
                      <div key={update.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full ${statusDef?.color || 'bg-primary'}`} />
                          {idx < statusUpdates.length - 1 && (
                            <div className="w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {statusDef?.label || enumToReadable(update.status)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(update.createdAt, 'PP')} {formatTime(update.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            by {update.createdBy?.name}
                            {update.progressPercent > 0 && ` — ${update.progressPercent}%`}
                          </p>
                          {update.note && (
                            <p className="mt-1 rounded bg-accent/50 px-2 py-1 text-xs">{update.note}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== PAYMENT SECTION ==================== */}
      {activeSection === 'payment' && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(quotationTotal)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="mt-1 text-lg font-bold text-green-700">{formatCurrency(payments.totalPaid)}</p>
                </div>
                <div className={`rounded-lg border p-3 ${amountDue > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className={`mt-1 text-lg font-bold ${amountDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatCurrency(amountDue)}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              {quotationTotal > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Payment Progress</span>
                    <span>{Math.min(100, Math.round((payments.totalPaid / quotationTotal) * 100))}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, (payments.totalPaid / quotationTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Record Payment Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Record Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {paymentError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (OMR) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder={amountDue > 0 ? amountDue.toFixed(3) : '0.000'}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Method <span className="text-red-500">*</span></Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value, paymentSubOption: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method: any) => (
                        <SelectItem key={method.id} value={method.name}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sub-options for selected payment method */}
              {selectedMethod?.subOptions?.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Transfer To</Label>
                  <Select
                    value={paymentForm.paymentSubOption}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentSubOption: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMethod.subOptions.map((sub: any) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Reference Number</Label>
                <Input
                  placeholder="Transaction reference..."
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  placeholder="Payment notes (optional)..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Quick amount buttons */}
              {amountDue > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPaymentForm({ ...paymentForm, amount: amountDue.toFixed(3) })}
                    className="rounded-md border bg-accent px-3 py-1.5 text-xs font-medium hover:bg-accent/80"
                  >
                    Full ({formatCurrency(amountDue)})
                  </button>
                  {amountDue > 1 && (
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: (amountDue / 2).toFixed(3) })}
                      className="rounded-md border bg-accent px-3 py-1.5 text-xs font-medium hover:bg-accent/80"
                    >
                      Half ({formatCurrency(amountDue / 2)})
                    </button>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                disabled={submitting || !paymentForm.amount || !paymentForm.paymentMethod}
                onClick={handlePaymentSubmit}
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-start justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{payment.paymentMethod}</span>
                          {payment.paymentSubOption && (
                            <span className="text-xs text-muted-foreground">({payment.paymentSubOption})</span>
                          )}
                          {payment.creditStatus === 'PENDING_APPROVAL' && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending Approval
                            </Badge>
                          )}
                        </div>
                        {payment.referenceNumber && (
                          <p className="text-xs text-muted-foreground">Ref: {payment.referenceNumber}</p>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground">{payment.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          by {payment.recordedBy?.name} &middot; {formatDate(payment.createdAt, 'PP')} {formatTime(payment.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-green-700">
                        +{formatCurrency(Number(payment.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
