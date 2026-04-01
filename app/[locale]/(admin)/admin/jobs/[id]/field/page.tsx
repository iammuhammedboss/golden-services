'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtimeEvents } from '@/hooks/use-realtime-events'
import { AudioRecorder, AudioPlayer } from '@/components/audio-recorder'
import { formatDate, formatTime } from '@/lib/utils'

const PROGRESS_STATUSES = [
  { value: 'AT_STORE', label: 'At Store', color: 'bg-gray-500' },
  { value: 'MATERIALS_TAKEN', label: 'Materials Taken', color: 'bg-yellow-500' },
  { value: 'DEPARTED_TO_SITE', label: 'Departed', color: 'bg-blue-500' },
  { value: 'ARRIVED_AT_SITE', label: 'Arrived', color: 'bg-indigo-500' },
  { value: 'IN_PROGRESS', label: 'Working', color: 'bg-orange-500' },
  { value: 'COMPLETION_REQUESTED', label: 'Done', color: 'bg-green-500' },
]

const PHOTO_PHASES = [
  { value: 'BEFORE', label: 'Before', icon: '1' },
  { value: 'DURING', label: 'During', icon: '2' },
  { value: 'AFTER', label: 'After', icon: '3' },
]

export default function FieldJobPage() {
  const [job, setJob] = useState<any>(null)
  const [statusUpdates, setStatusUpdates] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [adjustments, setAdjustments] = useState<any>({ adjustments: [], summary: { additions: 0, deductions: 0, net: 0 } })
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [activeTab, setActiveTab] = useState<'feed' | 'photos' | 'checklist' | 'adjust'>('feed')
  const [submitting, setSubmitting] = useState(false)
  const [adjForm, setAdjForm] = useState({ type: 'ADDITION', description: '', quantity: '1', unitPrice: '', reason: '' })
  const [payments, setPayments] = useState<any>({ payments: [], totalPaid: 0 })
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', paymentSubOption: '', receiptUrl: '', notes: '' })
  const params = useParams()
  const jobId = params.id as string

  const fetchJob = useCallback(async () => {
    try {
      const [jobRes, updatesRes, photosRes, adjRes, payRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/jobs/${jobId}/status-updates`),
        fetch(`/api/jobs/${jobId}/photos`),
        fetch(`/api/jobs/${jobId}/adjustments`),
        fetch(`/api/jobs/${jobId}/payments`),
      ])
      if (jobRes.ok) setJob(await jobRes.json())
      if (updatesRes.ok) setStatusUpdates(await updatesRes.json())
      if (photosRes.ok) setPhotos(await photosRes.json())
      if (adjRes.ok) setAdjustments(await adjRes.json())
      if (payRes.ok) setPayments(await payRes.json())
    } catch (error) {
      console.error('Failed to fetch job:', error)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { fetchJob() }, [fetchJob])

  // Fetch payment methods
  useEffect(() => {
    fetch('/api/payment-methods').then(r => r.ok ? r.json() : []).then(setPaymentMethods).catch(() => {})
  }, [])

  // Real-time updates for this job
  useRealtimeEvents({
    onJobStatusChanged: useCallback((e: any) => {
      if (e.jobId === jobId) fetchJob()
    }, [jobId, fetchJob]),
    onJobProgressUpdated: useCallback((e: any) => {
      if (e.jobId === jobId) fetchJob()
    }, [jobId, fetchJob]),
    onPhotoUploaded: useCallback((e: any) => {
      if (e.jobId === jobId) fetchJob()
    }, [jobId, fetchJob]),
  })

  const handleStatusUpdate = async (status: string) => {
    setSubmitting(true)
    try {
      await fetch(`/api/jobs/${jobId}/status-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          progressPercent,
          note: note || undefined,
        }),
      })
      setNote('')
      await fetchJob()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoUpload = async (phase: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.capture = 'environment'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setSubmitting(true)
      try {
        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'golden_services')
        formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '')

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          { method: 'POST', body: formData }
        )

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json()
          await fetch(`/api/jobs/${jobId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: cloudData.secure_url,
              phase,
            }),
          })
          await fetchJob()
        }
      } catch (error) {
        console.error('Failed to upload photo:', error)
      } finally {
        setSubmitting(false)
      }
    }
    input.click()
  }

  const handleChecklistToggle = async (itemId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      })
      await fetchJob()
    } catch (error) {
      console.error('Failed to update checklist:', error)
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
    return <div className="p-4 text-center">Job not found</div>
  }

  const latestStatus = statusUpdates[0]?.status || 'AT_STORE'

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Job Header Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-mono">{job.jobNumber}</p>
              <h2 className="text-lg font-bold">{job.client?.name}</h2>
              <p className="text-sm text-muted-foreground">{job.location || 'No location'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={job.status === 'COMPLETED' ? 'outline' : 'default'}>
                {job.status}
              </Badge>
              <Badge variant={
                job.paymentStatus === 'PAID' ? 'outline' :
                job.paymentStatus === 'PARTIALLY_PAID' ? 'secondary' :
                'destructive'
              } className="text-xs">
                {job.paymentStatus?.replace('_', ' ') || 'UNPAID'}
              </Badge>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
            <span>{formatDate(job.scheduledDate)}</span>
            {job.scheduledStartTime && <span>{formatTime(job.scheduledStartTime)}</span>}
          </div>
          {/* Assigned team */}
          {job.assignments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.assignments.map((a: any) => (
                <span key={a.id} className="rounded-full bg-accent px-2 py-0.5 text-xs">
                  {a.user?.name} ({a.roleInJob})
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Slider */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold text-primary">{progressPercent}%</span>
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
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex rounded-lg border bg-muted p-1">
        {(['feed', 'photos', 'checklist', 'adjust'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors sm:text-sm ${
              activeTab === tab
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {tab === 'feed' ? 'Status' : tab === 'photos' ? 'Photos' : tab === 'checklist' ? 'Tasks' : 'Adjust'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Status Buttons - WhatsApp style */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {PROGRESS_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusUpdate(s.value)}
                    disabled={submitting}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all active:scale-95 ${
                      latestStatus === s.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Note input + Voice note */}
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note (optional)..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="flex-1 text-sm"
                  />
                  <div className="flex items-end">
                    <AudioRecorder
                      onRecorded={async (url) => {
                        // Save voice note as a photo record with DURING phase
                        await fetch(`/api/jobs/${jobId}/photos`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url, phase: 'DURING', caption: 'Voice note' }),
                        })
                        await fetchJob()
                      }}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">Timeline</p>
              {statusUpdates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No updates yet</p>
              ) : (
                <div className="space-y-3">
                  {statusUpdates.map((update: any) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <div className="w-px flex-1 bg-border" />
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {update.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(update.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by {update.createdBy?.name}
                          {update.progressPercent > 0 && ` - ${update.progressPercent}%`}
                        </p>
                        {update.note && (
                          <p className="mt-1 rounded bg-accent p-2 text-xs">{update.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-4">
          {/* Photo Upload Buttons */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">Upload Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {PHOTO_PHASES.map((phase) => {
                  const count = photos.filter((p: any) => p.phase === phase.value).length
                  return (
                    <button
                      key={phase.value}
                      onClick={() => handlePhotoUpload(phase.value)}
                      disabled={submitting}
                      className="flex flex-col items-center gap-1 rounded-lg border border-dashed p-4 text-sm transition-colors hover:bg-accent active:scale-95"
                    >
                      <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{phase.label}</span>
                      {count > 0 && (
                        <span className="text-xs text-muted-foreground">{count} photos</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Photo Gallery by Phase */}
          {PHOTO_PHASES.map((phase) => {
            const phasePhotos = photos.filter((p: any) => p.phase === phase.value)
            if (phasePhotos.length === 0) return null
            return (
              <Card key={phase.value}>
                <CardContent className="p-4">
                  <p className="mb-2 text-sm font-medium">{phase.label} Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {phasePhotos.map((photo: any) => (
                      <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={photo.url}
                          alt={`${phase.label} photo`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {photos.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No photos uploaded yet
            </p>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium">
              Checklist ({job.checklistItems?.filter((i: any) => i.isCompleted).length || 0}/{job.checklistItems?.length || 0})
            </p>
            {job.checklistItems?.length > 0 ? (
              <div className="space-y-2">
                {job.checklistItems.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => !item.isCompleted && handleChecklistToggle(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      item.isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      item.isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                    }`}>
                      {item.isCompleted && (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${item.isCompleted ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                        {item.description}
                      </p>
                      {item.isCompleted && item.completedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {item.completedBy.name}
                        </p>
                      )}
                    </div>
                    {item.photoRequired && !item.photoUrl && !item.isCompleted && (
                      <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No checklist items</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'adjust' && (
        <div className="space-y-4">
          {/* Add/Deduct Form */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Add or Deduct Item</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjForm({ ...adjForm, type: 'ADDITION' })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                    adjForm.type === 'ADDITION' ? 'border-green-500 bg-green-50 text-green-700' : ''
                  }`}
                >
                  + Add
                </button>
                <button
                  onClick={() => setAdjForm({ ...adjForm, type: 'DEDUCTION' })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                    adjForm.type === 'DEDUCTION' ? 'border-red-500 bg-red-50 text-red-700' : ''
                  }`}
                >
                  - Deduct
                </button>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={adjForm.description}
                  onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
                  placeholder="e.g., Extra carpet cleaning"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price (OMR)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={adjForm.unitPrice}
                    onChange={(e) => setAdjForm({ ...adjForm, unitPrice: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              {adjForm.type === 'DEDUCTION' && (
                <div>
                  <Label className="text-xs">Reason <span className="text-red-500">*</span></Label>
                  <Select
                    value={adjForm.reason}
                    onValueChange={(value) => setAdjForm({ ...adjForm, reason: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer cancelled">Customer cancelled</SelectItem>
                      <SelectItem value="Not accessible">Not accessible</SelectItem>
                      <SelectItem value="Already clean">Already clean</SelectItem>
                      <SelectItem value="Not needed">Not needed</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                className="w-full"
                disabled={submitting || !adjForm.description || !adjForm.unitPrice || (adjForm.type === 'DEDUCTION' && !adjForm.reason)}
                onClick={async () => {
                  setSubmitting(true)
                  try {
                    await fetch(`/api/jobs/${jobId}/adjustments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(adjForm),
                    })
                    setAdjForm({ type: 'ADDITION', description: '', quantity: '1', unitPrice: '', reason: '' })
                    await fetchJob()
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                {adjForm.type === 'ADDITION' ? 'Add Item' : 'Deduct Item'}
              </Button>
            </CardContent>
          </Card>

          {/* Adjustments Summary */}
          {adjustments.adjustments.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">Additions</span>
                  <span className="font-medium text-green-600">+{adjustments.summary.additions.toFixed(3)} OMR</span>
                </div>
                <div className="flex justify-between border-b py-2 text-sm">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="font-medium text-red-600">-{adjustments.summary.deductions.toFixed(3)} OMR</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold">
                  <span>Net Adjustment</span>
                  <span className={adjustments.summary.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {adjustments.summary.net >= 0 ? '+' : ''}{adjustments.summary.net.toFixed(3)} OMR
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adjustments List */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">History</p>
              {adjustments.adjustments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No adjustments yet</p>
              ) : (
                <div className="space-y-2">
                  {adjustments.adjustments.map((adj: any) => (
                    <div
                      key={adj.id}
                      className={`rounded-lg border p-3 ${
                        adj.type === 'ADDITION' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{adj.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {adj.quantity} x {Number(adj.unitPrice).toFixed(3)} OMR
                          </p>
                          {adj.reason && (
                            <p className="mt-1 text-xs text-muted-foreground">Reason: {adj.reason}</p>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${adj.type === 'ADDITION' ? 'text-green-600' : 'text-red-600'}`}>
                          {adj.type === 'ADDITION' ? '+' : '-'}{Number(adj.total).toFixed(3)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        by {adj.createdBy?.name} - {formatDate(adj.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Finish Job Button */}
      {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
        <Button
          className="w-full py-6 text-base"
          variant={progressPercent === 100 ? 'default' : 'outline'}
          onClick={() => handleStatusUpdate('COMPLETION_REQUESTED')}
          disabled={submitting}
        >
          {progressPercent < 100 ? 'Request Completion (not 100%)' : 'Finish Job'}
        </Button>
      )}
    </div>
  )
}
