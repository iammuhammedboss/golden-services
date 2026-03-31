'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDate, enumToReadable, getStatusColor } from '@/lib/utils'
import { useConfirm } from '@/components/confirm-dialog'

const STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'from-yellow-500 to-yellow-600' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'from-blue-500 to-blue-600' },
  { value: 'COMPLETED', label: 'Completed', color: 'from-green-500 to-green-600' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'from-red-500 to-red-600' },
]

export default function SiteVisitDetailPage({ params: pageParams }: { params: { id: string } }) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [siteVisit, setSiteVisit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchSiteVisit = useCallback(async () => {
    try {
      const res = await fetch(`/api/site-visits/${pageParams.id}`)
      if (res.ok) setSiteVisit(await res.json())
    } catch (error) {
      console.error('Failed to fetch site visit:', error)
    } finally { setLoading(false) }
  }, [pageParams.id])

  useEffect(() => { fetchSiteVisit() }, [fetchSiteVisit])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/site-visits/${pageParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) await fetchSiteVisit()
    } catch { }
    finally { setUpdating(false) }
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: 'Delete Site Visit', description: 'This action cannot be undone.', variant: 'danger', confirmLabel: 'Delete' })
    if (!ok) return
    try {
      const res = await fetch(`/api/site-visits/${pageParams.id}`, { method: 'DELETE' })
      if (res.ok) router.push(`/${locale}/admin/site-visits`)
    } catch { alert('Failed to delete') }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }
  if (!siteVisit) {
    return <div className="py-20 text-center text-sm text-gray-400">Site visit not found</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {ConfirmDialog}

      {/* Header Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{siteVisit.client?.name}</h1>
            <p className="text-xs text-gray-400">{formatDate(siteVisit.scheduledAt, 'PPpp')}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusColor(siteVisit.status)}`}>
            {enumToReadable(siteVisit.status)}
          </span>
        </div>

        {/* Quick Contact */}
        {siteVisit.client && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`tel:${siteVisit.client.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 py-2 text-xs font-semibold text-green-700 active:scale-95">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call Client
            </a>
            <Link href={`/${locale}/admin/clients/${siteVisit.client.id}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700 active:scale-95">
              View Profile
            </Link>
          </div>
        )}
      </div>

      {/* Status Buttons */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-4 py-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</h3></div>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={updating || siteVisit.status === s.value}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                siteVisit.status === s.value ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${s.color}`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <InfoSection title="Visit Details">
        <InfoRow label="Assigned To" value={siteVisit.assignedTo?.name || '-'} />
        {siteVisit.requiredService && <InfoRow label="Service" value={siteVisit.requiredService} />}
        {siteVisit.startedAt && <InfoRow label="Started" value={formatDate(siteVisit.startedAt, 'PPpp')} />}
        {siteVisit.completedAt && <InfoRow label="Completed" value={formatDate(siteVisit.completedAt, 'PPpp')} />}
      </InfoSection>

      {(siteVisit.locationText || siteVisit.googleMapsUrl) && (
        <InfoSection title="Location">
          {siteVisit.locationText && <InfoRow label="Address" value={siteVisit.locationText} />}
          {siteVisit.googleMapsUrl && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-400">Map</span>
              <a href={siteVisit.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600">Open in Maps</a>
            </div>
          )}
        </InfoSection>
      )}

      {(siteVisit.siteContactName || siteVisit.siteContactPhone) && (
        <InfoSection title="Site Contact">
          {siteVisit.siteContactName && <InfoRow label="Name" value={siteVisit.siteContactName} />}
          {siteVisit.siteContactPhone && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-400">Phone</span>
              <a href={`tel:${siteVisit.siteContactPhone}`} className="text-sm font-medium text-green-600">{siteVisit.siteContactPhone}</a>
            </div>
          )}
        </InfoSection>
      )}

      {(siteVisit.notes || siteVisit.remarks) && (
        <InfoSection title="Notes">
          {siteVisit.notes && <div className="px-4 py-3"><p className="whitespace-pre-wrap text-sm text-gray-700">{siteVisit.notes}</p></div>}
          {siteVisit.remarks && <div className="border-t border-gray-50 px-4 py-3"><p className="whitespace-pre-wrap text-sm text-gray-500">{siteVisit.remarks}</p></div>}
        </InfoSection>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/${locale}/admin/measurements/new?siteVisitId=${pageParams.id}`} className="rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-700 active:scale-[0.98]">
          Create Measurement
        </Link>
        <button onClick={handleDelete} className="rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 active:scale-[0.98]">
          Delete Visit
        </button>
      </div>
    </div>
  )
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-4 py-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3></div>
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
