'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
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

export default function EditClientPage() {
  const t = useTranslations('Clients')
  const tc = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const clientId = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    whatsapp: '',
    email: '',
    company: '',
    vatTrn: '',
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CORPORATE',
    source: 'PHONE' as const,
    status: 'NEW' as const,
    area: '',
    street: '',
    building: '',
    city: '',
    locationPin: '',
    primaryContactName: '',
    primaryContactPhone: '',
    alternateContactName: '',
    alternateContactPhone: '',
    notes: '',
  })

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((client) => {
        if (client) {
          setFormData({
            name: client.name || '',
            phone: client.phone || '',
            alternatePhone: client.alternatePhone || '',
            whatsapp: client.whatsapp || '',
            email: client.email || '',
            company: client.company || '',
            vatTrn: client.vatTrn || '',
            type: client.type || 'INDIVIDUAL',
            source: client.source || 'PHONE',
            status: client.status || 'NEW',
            area: client.area || '',
            street: client.street || '',
            building: client.building || '',
            city: client.city || '',
            locationPin: client.locationPin || '',
            primaryContactName: client.primaryContactName || '',
            primaryContactPhone: client.primaryContactPhone || '',
            alternateContactName: client.alternateContactName || '',
            alternateContactPhone: client.alternateContactPhone || '',
            notes: client.notes || '',
          })
        }
      })
      .catch(() => alert('Failed to fetch client'))
      .finally(() => setFetching(false))
  }, [clientId])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.name || !formData.phone) return
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        router.push(`/${locale}/admin/clients/${clientId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update client')
      }
    } catch {
      alert('Failed to update client')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [field]: e.target.value })

  if (fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">{t('editClient')}</h1>
        <p className="text-xs text-gray-400">{t('updateInfo')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <Section title={t('basicInfo')}>
          <FormField label={t('clientName')} required>
            <Input value={formData.name} onChange={set('name')} placeholder="Full name" className="rounded-xl" required />
          </FormField>
          <FormField label={tc('company')}>
            <Input value={formData.company} onChange={set('company')} placeholder="Company name (optional)" className="rounded-xl" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={tc('type')}>
              <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="CORPORATE">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('vatTrn')}>
              <Input value={formData.vatTrn} onChange={set('vatTrn')} placeholder="Tax number" className="rounded-xl" />
            </FormField>
          </div>
        </Section>

        {/* Contact */}
        <Section title={t('contactDetails')}>
          <FormField label={tc('phone')} required>
            <Input type="tel" value={formData.phone} onChange={set('phone')} placeholder="+968 XXXX XXXX" className="rounded-xl" required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={tc('altPhone')}>
              <Input type="tel" value={formData.alternatePhone} onChange={set('alternatePhone')} placeholder="+968 XXXX XXXX" className="rounded-xl" />
            </FormField>
            <FormField label={tc('whatsapp')}>
              <Input type="tel" value={formData.whatsapp} onChange={set('whatsapp')} placeholder="+968 XXXX XXXX" className="rounded-xl" />
            </FormField>
          </div>
          <FormField label={tc('email')}>
            <Input type="email" value={formData.email} onChange={set('email')} placeholder="email@example.com" className="rounded-xl" />
          </FormField>
        </Section>

        {/* Address */}
        <Section title={t('address')}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('area')}>
              <Input value={formData.area} onChange={set('area')} placeholder="Area/District" className="rounded-xl" />
            </FormField>
            <FormField label={t('city')}>
              <Input value={formData.city} onChange={set('city')} placeholder="City" className="rounded-xl" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('street')}>
              <Input value={formData.street} onChange={set('street')} placeholder="Street name" className="rounded-xl" />
            </FormField>
            <FormField label={t('building')}>
              <Input value={formData.building} onChange={set('building')} placeholder="Building/Villa" className="rounded-xl" />
            </FormField>
          </div>
          <FormField label={t('locationPin')}>
            <Input value={formData.locationPin} onChange={set('locationPin')} placeholder="Google Maps link or coordinates" className="rounded-xl" />
          </FormField>
        </Section>

        {/* Contacts */}
        <Section title={t('contactPersons')}>
          <div className="rounded-xl bg-blue-50/50 p-3 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">{t('primaryContact')}</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={tc('name')}>
                <Input value={formData.primaryContactName} onChange={set('primaryContactName')} placeholder="Contact name" className="rounded-xl" />
              </FormField>
              <FormField label={tc('phone')}>
                <Input type="tel" value={formData.primaryContactPhone} onChange={set('primaryContactPhone')} placeholder="+968 XXXX XXXX" className="rounded-xl" />
              </FormField>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50/50 p-3 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t('alternateContact')}</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={tc('name')}>
                <Input value={formData.alternateContactName} onChange={set('alternateContactName')} placeholder="Contact name" className="rounded-xl" />
              </FormField>
              <FormField label={tc('phone')}>
                <Input type="tel" value={formData.alternateContactPhone} onChange={set('alternateContactPhone')} placeholder="+968 XXXX XXXX" className="rounded-xl" />
              </FormField>
            </div>
          </div>
        </Section>

        {/* Notes */}
        <Section title={tc('notes')}>
          <Textarea
            value={formData.notes}
            onChange={set('notes')}
            placeholder="Internal notes about this client..."
            rows={3}
            className="rounded-xl text-sm"
          />
        </Section>
      </form>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link
            href={`/${locale}/admin/clients/${clientId}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-600 transition-all active:scale-[0.98]"
          >
            {tc('cancel')}
          </Link>
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !formData.name || !formData.phone}
            className="flex-[2] rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? tc('saving') : t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-500">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      {children}
    </div>
  )
}
