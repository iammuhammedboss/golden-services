'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddClientDialog } from '@/components/add-client-dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function NewJobPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = (params.locale as string) || 'en'
  const clientIdParam = searchParams.get('clientId')
  const t = useTranslations('Jobs')
  const tc = useTranslations('Common')

  const [clients, setClients] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    clientId: clientIdParam || '',
    quotationId: '',
    scheduledDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    status: 'SCHEDULED',
    notes: '',
    location: '',
    durationDays: 0,
    durationHours: 0,
    durationMinutes: 0,
    assignments: [] as { userId: string; roleInJob: string }[],
    jobMaterials: [] as { materialId: string; quantity: number }[],
    equipment: [] as { equipmentId: string; quantity: number }[],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.ok ? r.json() : []),
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/masters/materials').then(r => r.ok ? r.json() : []),
      fetch('/api/masters/equipment').then(r => r.ok ? r.json() : []),
    ]).then(([c, u, m, e]) => { setClients(c); setUsers(u); setMaterials(m); setEquipment(e) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (formData.clientId) {
      fetch(`/api/quotations?clientId=${formData.clientId}`).then(r => r.ok ? r.json() : []).then(d => setQuotations(Array.isArray(d) ? d : d.quotations || [])).catch(() => {})
    } else { setQuotations([]) }
  }, [formData.clientId])

  // Auto-calculate end time
  useEffect(() => {
    if (formData.scheduledDate && formData.scheduledStartTime) {
      const start = new Date(`${formData.scheduledDate}T${formData.scheduledStartTime}`)
      const ms = (formData.durationDays * 86400 + formData.durationHours * 3600 + formData.durationMinutes * 60) * 1000
      if (ms > 0) {
        const end = new Date(start.getTime() + ms)
        setFormData(prev => ({ ...prev, scheduledEndTime: end.toTimeString().slice(0, 5) }))
      }
    }
  }, [formData.scheduledDate, formData.scheduledStartTime, formData.durationDays, formData.durationHours, formData.durationMinutes])

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.scheduledDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, quotationId: formData.quotationId || null }),
      })
      if (res.ok) { const job = await res.json(); router.push(`/${locale}/admin/jobs/${job.id}/status`) }
      else { const err = await res.json(); alert(err.error || 'Failed to create job') }
    } catch { alert('Failed to create job') }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">{t('newJob')}</h1>
        <p className="text-xs text-gray-400">{t('scheduleJob')}</p>
      </div>

      <div className="space-y-4">
        {/* Job Details */}
        <Section title={t('jobDetails')}>
          <FormField label={t('client')} required>
            <div className="flex gap-2">
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v, quotationId: '' })}>
                <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent>
              </Select>
              <AddClientDialog onClientCreated={() => fetch('/api/clients').then(r => r.ok ? r.json() : []).then(setClients)}>
                <Button type="button" variant="outline" className="rounded-xl shrink-0">New</Button>
              </AddClientDialog>
            </div>
          </FormField>
          <FormField label={t('quotation')}>
            <Select value={formData.quotationId || '__NONE__'} onValueChange={(v) => setFormData({ ...formData, quotationId: v === '__NONE__' ? '' : v })} disabled={!formData.clientId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select quotation..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">None</SelectItem>
                {quotations.map((q: any) => <SelectItem key={q.id} value={q.id}>{q.quotationNumber || q.id} ({q.status})</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={tc('location')}>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Job location" className="rounded-xl" />
            </FormField>
            <FormField label={tc('amountOMR')}>
              <Input type="number" step="0.001" value={(formData as any).amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value } as any)} placeholder="Optional" className="rounded-xl" />
            </FormField>
          </div>
        </Section>

        {/* Schedule */}
        <Section title={t('scheduleDuration')}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={tc('date')} required>
              <Input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="rounded-xl" required />
            </FormField>
            <FormField label={tc('startTime')}>
              <Input type="time" value={formData.scheduledStartTime} onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })} className="rounded-xl" />
            </FormField>
          </div>
          <div>
            <Label className="text-xs text-gray-500">{t('expectedDuration')}</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Input type="number" placeholder={t('days')} value={formData.durationDays || ''} onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              <Input type="number" placeholder={t('hours')} value={formData.durationHours || ''} onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              <Input type="number" placeholder={t('minutes')} value={formData.durationMinutes || ''} onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })} className="rounded-xl" />
            </div>
          </div>
          {formData.scheduledEndTime && (
            <p className="text-xs text-gray-400">End time: {formData.scheduledEndTime}</p>
          )}
        </Section>

        {/* Staff */}
        <Section title={`${t('staff')} (${formData.assignments.length})`}>
          {formData.assignments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
              <Select value={a.userId} onValueChange={(v) => { const n = [...formData.assignments]; n[i] = { ...n[i], userId: v }; setFormData({ ...formData, assignments: n }) }}>
                <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Staff..." /></SelectTrigger>
                <SelectContent>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={a.roleInJob} onValueChange={(v) => { const n = [...formData.assignments]; n[i] = { ...n[i], roleInJob: v }; setFormData({ ...formData, assignments: n }) }}>
                <SelectTrigger className="rounded-xl w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">{t('supervisor')}</SelectItem>
                  <SelectItem value="CLEANER">{t('cleaner')}</SelectItem>
                  <SelectItem value="TECHNICIAN">{t('technician')}</SelectItem>
                  <SelectItem value="DRIVER">{t('driver')}</SelectItem>
                  <SelectItem value="OTHER">{t('other')}</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => { const n = formData.assignments.filter((_, j) => j !== i); setFormData({ ...formData, assignments: n }) }} className="text-red-400 hover:text-red-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={() => setFormData({ ...formData, assignments: [...formData.assignments, { userId: '', roleInJob: 'CLEANER' }] })}
            className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98]">
            {t('addStaff')}
          </button>
        </Section>

        {/* Materials */}
        <Section title={`${t('materials')} (${formData.jobMaterials.length})`}>
          {formData.jobMaterials.map((m, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
              <Select value={m.materialId} onValueChange={(v) => { const n = [...formData.jobMaterials]; n[i] = { ...n[i], materialId: v }; setFormData({ ...formData, jobMaterials: n }) }}>
                <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Material..." /></SelectTrigger>
                <SelectContent>{materials.map((mat: any) => <SelectItem key={mat.id} value={mat.id}>{mat.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" className="rounded-xl w-20" value={m.quantity} onChange={(e) => { const n = [...formData.jobMaterials]; n[i] = { ...n[i], quantity: parseInt(e.target.value) || 0 }; setFormData({ ...formData, jobMaterials: n }) }} />
              <button onClick={() => setFormData({ ...formData, jobMaterials: formData.jobMaterials.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={() => setFormData({ ...formData, jobMaterials: [...formData.jobMaterials, { materialId: '', quantity: 1 }] })}
            className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98]">
            {t('addMaterial')}
          </button>
        </Section>

        {/* Equipment */}
        <Section title={`${t('equipment')} (${formData.equipment.length})`}>
          {formData.equipment.map((eq, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
              <Select value={eq.equipmentId} onValueChange={(v) => { const n = [...formData.equipment]; n[i] = { ...n[i], equipmentId: v }; setFormData({ ...formData, equipment: n }) }}>
                <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Equipment..." /></SelectTrigger>
                <SelectContent>{equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" className="rounded-xl w-20" value={eq.quantity} onChange={(e) => { const n = [...formData.equipment]; n[i] = { ...n[i], quantity: parseInt(e.target.value) || 0 }; setFormData({ ...formData, equipment: n }) }} />
              <button onClick={() => setFormData({ ...formData, equipment: formData.equipment.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={() => setFormData({ ...formData, equipment: [...formData.equipment, { equipmentId: '', quantity: 1 }] })}
            className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98]">
            {t('addEquipment')}
          </button>
        </Section>

        {/* Notes */}
        <Section title={tc('notes')}>
          <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Special instructions..." rows={3} className="rounded-xl text-sm" />
        </Section>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link href={`/${locale}/admin/jobs`} className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-600 active:scale-[0.98]">{tc('cancel')}</Link>
          <button onClick={handleSubmit} disabled={loading || !formData.clientId || !formData.scheduledDate}
            className="flex-[2] rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 active:scale-[0.98] disabled:opacity-50">
            {loading ? tc('creating') : t('createJob')}
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
