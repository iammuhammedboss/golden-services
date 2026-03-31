'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
// Client type extended with optional fields from API
type ClientData = Record<string, any>
import Link from 'next/link'
import { formatDate, getInitials, enumToReadable } from '@/lib/utils'

export default function ClientDetailsPage() {
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const { id } = params

  const fetchClient = useCallback(async () => {
    if (!id) return
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

  const handleDelete = async () => {
    if (!client) return
    if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (res.ok) router.push(`/${locale}/admin/clients`)
    } catch {
      alert('Failed to delete client')
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
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-400">Client not found</p>
      </div>
    )
  }

  const actionTiles = [
    {
      label: 'Edit',
      href: `/${locale}/admin/clients/${id}/edit`,
      color: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Ledger',
      href: `/${locale}/admin/clients/${id}/ledger`,
      color: 'from-emerald-500 to-emerald-600',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      ),
    },
    {
      label: 'Quotation',
      href: `/${locale}/admin/quotations?clientId=${id}`,
      color: 'from-orange-500 to-orange-600',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Job',
      href: `/${locale}/admin/jobs?clientId=${id}`,
      color: 'from-cyan-500 to-cyan-600',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Invoice',
      href: `/${locale}/admin/invoices?clientId=${id}`,
      color: 'from-pink-500 to-pink-600',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: 'Site Visit',
      href: `/${locale}/admin/site-visits?clientId=${id}`,
      color: 'from-violet-500 to-violet-600',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md ${
            client.type === 'CORPORATE'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {getInitials(client.name)}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-gray-900">{client.name}</h1>
            {client.company && (
              <p className="truncate text-sm text-gray-500">{client.company}</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                client.type === 'CORPORATE' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {enumToReadable(client.type)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                client.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                client.status === 'BLACKLISTED' ? 'bg-red-50 text-red-600' :
                'bg-gray-50 text-gray-600'
              }`}>
                {enumToReadable(client.status)}
              </span>
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                {enumToReadable(client.source)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <a
            href={`tel:${client.phone}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 py-2.5 text-xs font-semibold text-green-700 transition-all active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </a>
          <a
            href={`https://wa.me/${(client.whatsapp || client.phone).replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-700 transition-all active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          {client.email ? (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-semibold text-blue-700 transition-all active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 py-2.5 text-xs text-gray-400">
              No email
            </div>
          )}
        </div>
      </div>

      {/* Action Tiles */}
      <div className="grid grid-cols-3 gap-2">
        {actionTiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tile.color} text-white shadow-sm transition-transform group-hover:scale-110`}>
              {tile.icon}
            </div>
            <span className="mt-1.5 text-[11px] font-semibold text-gray-600">{tile.label}</span>
          </Link>
        ))}
      </div>

      {/* Client Details */}
      <div className="space-y-3">
        {/* Contact Info */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact Info</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <InfoRow label="Phone" value={client.phone} />
            {client.alternatePhone && <InfoRow label="Alt Phone" value={client.alternatePhone} />}
            {client.whatsapp && client.whatsapp !== client.phone && (
              <InfoRow label="WhatsApp" value={client.whatsapp} />
            )}
            {client.email && <InfoRow label="Email" value={client.email} />}
            {client.vatTrn && <InfoRow label="VAT/TRN" value={client.vatTrn} />}
          </div>
        </div>

        {/* Address */}
        {(client.area || client.city || client.street || client.building) && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Address</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {client.building && <InfoRow label="Building" value={client.building} />}
              {client.street && <InfoRow label="Street" value={client.street} />}
              {client.area && <InfoRow label="Area" value={client.area} />}
              {client.city && <InfoRow label="City" value={client.city} />}
              {client.locationPin && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-gray-400">Location</span>
                  <a
                    href={client.locationPin.startsWith('http') ? client.locationPin : `https://maps.google.com/?q=${client.locationPin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600"
                  >
                    Open in Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts */}
        {(client.primaryContactName || client.alternateContactName) && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contacts</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {client.primaryContactName && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400">Primary</p>
                    <p className="text-sm font-medium text-gray-800">{client.primaryContactName}</p>
                  </div>
                  {client.primaryContactPhone && (
                    <a href={`tel:${client.primaryContactPhone}`} className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      {client.primaryContactPhone}
                    </a>
                  )}
                </div>
              )}
              {client.alternateContactName && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400">Alternate</p>
                    <p className="text-sm font-medium text-gray-800">{client.alternateContactName}</p>
                  </div>
                  {client.alternateContactPhone && (
                    <a href={`tel:${client.alternateContactPhone}`} className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      {client.alternateContactPhone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</h3>
            </div>
            <div className="px-4 py-3">
              <p className="whitespace-pre-wrap text-sm text-gray-700">{client.notes}</p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="divide-y divide-gray-50">
            <InfoRow label="Created" value={formatDate(client.createdAt, 'PPP')} />
            <InfoRow label="Updated" value={formatDate(client.updatedAt, 'PPP')} />
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 transition-all active:scale-[0.98]"
      >
        Delete Client
      </button>
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
