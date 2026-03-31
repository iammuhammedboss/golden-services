'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
type ClientData = Record<string, any>
import { formatDate, getInitials, enumToReadable } from '@/lib/utils'

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'INDIVIDUAL' | 'CORPORATE'>('ALL')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'ALL' || c.type === filter
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: clients.length,
    individual: clients.filter((c) => c.type === 'INDIVIDUAL').length,
    corporate: clients.filter((c) => c.type === 'CORPORATE').length,
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-400">{stats.total} total clients</p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-xl border p-2.5 text-center transition-all ${
            filter === 'ALL' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-gray-100 bg-white'
          }`}
        >
          <p className="text-lg font-bold text-gray-800">{stats.total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">All</p>
        </button>
        <button
          onClick={() => setFilter('INDIVIDUAL')}
          className={`rounded-xl border p-2.5 text-center transition-all ${
            filter === 'INDIVIDUAL' ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-100 bg-white'
          }`}
        >
          <p className="text-lg font-bold text-blue-600">{stats.individual}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Individual</p>
        </button>
        <button
          onClick={() => setFilter('CORPORATE')}
          className={`rounded-xl border p-2.5 text-center transition-all ${
            filter === 'CORPORATE' ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-200' : 'border-gray-100 bg-white'
          }`}
        >
          <p className="text-lg font-bold text-purple-600">{stats.corporate}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Corporate</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Client Cards */}
      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((client) => (
            <Link
              key={client.id}
              href={`/${locale}/admin/clients/${client.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {/* Avatar */}
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
                client.type === 'CORPORATE'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                {getInitials(client.name)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900">{client.name}</p>
                  {client.company && (
                    <span className="hidden truncate text-xs text-gray-400 sm:inline">{client.company}</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {client.phone}
                  </span>
                  {client.email && (
                    <span className="hidden truncate sm:inline">{client.email}</span>
                  )}
                </div>
              </div>

              {/* Right side */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  client.type === 'CORPORATE'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {client.type === 'CORPORATE' ? 'Corp' : 'Ind'}
                </span>
                <svg className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href={`/${locale}/admin/clients/new`}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
