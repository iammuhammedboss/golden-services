'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getStatusColor, enumToReadable } from '@/lib/utils'

export default function SiteVisitsPage() {
  const [siteVisits, setSiteVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    fetch('/api/site-visits')
      .then((r) => (r.ok ? r.json() : []))
      .then(setSiteVisits)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    ALL: siteVisits.length,
    PENDING: siteVisits.filter((v) => v.status === 'PENDING').length,
    IN_PROGRESS: siteVisits.filter((v) => v.status === 'IN_PROGRESS').length,
    COMPLETED: siteVisits.filter((v) => v.status === 'COMPLETED').length,
  }

  const filtered = filter === 'ALL' ? siteVisits : siteVisits.filter((v) => v.status === filter)

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Site Visits</h1>
        <p className="text-xs text-gray-400">{counts.ALL} total visits</p>
      </div>

      {/* Filter Strip */}
      <div className="grid grid-cols-4 gap-2">
        {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl border p-2 text-center transition-all ${
              filter === s ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-gray-100 bg-white'
            }`}
          >
            <p className="text-base font-bold text-gray-800">{counts[s as keyof typeof counts]}</p>
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
              {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'Active' : s.charAt(0) + s.slice(1).toLowerCase()}
            </p>
          </button>
        ))}
      </div>

      {/* Visit Cards */}
      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((visit) => (
            <Link
              key={visit.id}
              href={`/${locale}/admin/site-visits/${visit.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                visit.status === 'COMPLETED' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                visit.status === 'IN_PROGRESS' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                visit.status === 'CANCELLED' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                'bg-gradient-to-br from-yellow-500 to-yellow-600'
              }`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{visit.client?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(visit.scheduledAt, 'PP')} &middot; {visit.locationText || 'No location'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(visit.status)}`}>
                  {enumToReadable(visit.status)}
                </span>
                <svg className="h-4 w-4 text-gray-300 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No site visits found</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href={`/${locale}/admin/site-visits/new`}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
