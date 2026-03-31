'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function NewSiteVisitPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const searchParams = useSearchParams()
  const clientIdParam = searchParams.get('clientId')

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    clientId: clientIdParam || '',
    scheduledAt: '',
    assignedToId: '',
    requiredService: '',
    locationText: '',
    googleMapsUrl: '',
    siteContactName: '',
    siteContactPhone: '',
    notes: '',
    remarks: '',
  })

  useEffect(() => {
    fetch('/api/users').then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const t = setTimeout(() => {
        fetch(`/api/clients/search?q=${encodeURIComponent(searchQuery)}`)
          .then(r => r.ok ? r.json() : []).then(setClients).catch(() => {})
      }, 300)
      return () => clearTimeout(t)
    } else { setClients([]) }
  }, [searchQuery])

  const selectedClient = clients.find((c) => c.id === formData.clientId)

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.scheduledAt || !formData.assignedToId) return
    setLoading(true)
    try {
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const sv = await res.json()
        router.push(`/${locale}/admin/site-visits/${sv.id}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create site visit')
      }
    } catch { alert('Failed to create site visit') }
    finally { setLoading(false) }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [field]: e.target.value })

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">New Site Visit</h1>
        <p className="text-xs text-gray-400">Schedule a new site visit</p>
      </div>

      <div className="space-y-4">
        {/* Client Search */}
        <Section title="Client & Schedule">
          <div className="space-y-1 relative">
            <Label className="text-xs text-gray-500">Client <span className="text-red-400">*</span></Label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedClient.name}</p>
                  <p className="text-xs text-gray-500">{selectedClient.phone}</p>
                </div>
                <button onClick={() => { setFormData({ ...formData, clientId: '' }); setSearchQuery('') }} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search client by name or phone..." className="pl-9 rounded-xl" />
                </div>
                {searchQuery.length >= 2 && clients.length > 0 && (
                  <div className="absolute z-10 left-4 right-4 mt-1 max-h-48 overflow-y-auto rounded-xl border bg-white shadow-lg">
                    {clients.map((c) => (
                      <button key={c.id} onClick={() => { setFormData({ ...formData, clientId: c.id }); setSearchQuery('') }}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date & Time" required>
              <Input type="datetime-local" value={formData.scheduledAt} onChange={set('scheduledAt')} className="rounded-xl" required />
            </FormField>
            <FormField label="Assigned To" required>
              <Select value={formData.assignedToId} onValueChange={(v) => setFormData({ ...formData, assignedToId: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Required Service">
            <Input value={formData.requiredService} onChange={set('requiredService')} placeholder="e.g., Deep cleaning, Pest control" className="rounded-xl" />
          </FormField>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Location">
              <Input value={formData.locationText} onChange={set('locationText')} placeholder="Area, City" className="rounded-xl" />
            </FormField>
            <FormField label="Maps URL">
              <Input type="url" value={formData.googleMapsUrl} onChange={set('googleMapsUrl')} placeholder="Google Maps link" className="rounded-xl" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Site Contact">
              <Input value={formData.siteContactName} onChange={set('siteContactName')} placeholder="Contact name" className="rounded-xl" />
            </FormField>
            <FormField label="Contact Phone">
              <Input type="tel" value={formData.siteContactPhone} onChange={set('siteContactPhone')} placeholder="+968 XXXX XXXX" className="rounded-xl" />
            </FormField>
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <Textarea value={formData.notes} onChange={set('notes')} placeholder="Internal notes..." rows={3} className="rounded-xl text-sm" />
          <Textarea value={formData.remarks} onChange={set('remarks')} placeholder="Additional remarks..." rows={2} className="rounded-xl text-sm" />
        </Section>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link href={`/${locale}/admin/site-visits`} className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-600 active:scale-[0.98]">Cancel</Link>
          <button onClick={handleSubmit} disabled={loading || !formData.clientId || !formData.scheduledAt || !formData.assignedToId}
            className="flex-[2] rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 active:scale-[0.98] disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Site Visit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-4 py-3"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3></div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-500">{label} {required && <span className="text-red-400">*</span>}</Label>
      {children}
    </div>
  )
}
