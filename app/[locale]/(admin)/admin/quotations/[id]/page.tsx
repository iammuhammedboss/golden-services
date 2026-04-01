'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function QuotationDetailsPage() {
  const t = useTranslations('Quotations')
  const tc = useTranslations('Common')
  const [quotation, setQuotation] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<any[]>([])
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null)
  const [salesExecutives, setSalesExecutives] = useState<any[]>([])
  const [termsTemplates, setTermsTemplates] = useState<any[]>([])
  const [bankTemplates, setBankTemplates] = useState<any[]>([])
  const [lineItems, setLineItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const id = params.id as string
  const clientIdParam = searchParams.get('clientId')

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.ok ? r.json() : []),
      fetch('/api/measurements').then(r => r.ok ? r.json() : []),
      fetch('/api/templates/terms').then(r => r.ok ? r.json() : []),
      fetch('/api/templates/bank-details').then(r => r.ok ? r.json() : []),
      fetch('/api/sales-executives').then(r => r.ok ? r.json() : []),
    ]).then(([c, m, tp, b, s]) => {
      setClients(c); setMeasurements(m); setTermsTemplates(tp); setBankTemplates(b); setSalesExecutives(s)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (id === 'new') {
      setQuotation({
        id: 'new', clientId: clientIdParam || '', items: [], vatEnabled: false, vatPercentage: 5,
        discountType: null, discountValue: null, termsTemplateId: '', termsSnapshot: '',
        bankDetailsTemplateId: '', bankDetailsSnapshot: '', isAmc: false, amcFrequency: null,
        amcDurationMonths: null, amcStartDate: null, notes: '',
      })
      setLoading(false)
      return
    }
    fetch(`/api/quotations/${id}`).then(r => r.ok ? r.json() : null).then(data => {
      if (data) { setQuotation(data); setLineItems(data.items || []) }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!quotation?.measurementId) { setSelectedMeasurement(null); return }
    fetch(`/api/measurements/${quotation.measurementId}`).then(r => r.ok ? r.json() : null).then(setSelectedMeasurement).catch(() => {})
  }, [quotation?.measurementId])

  const handleSave = async () => {
    setSaveError('')
    if (!quotation.clientId) { setSaveError(tc('selectClientError')); return }
    if (lineItems.length === 0) { setSaveError(tc('addItemError')); return }
    if (lineItems.some((i: any) => !i.description?.trim())) { setSaveError(tc('itemDescError')); return }
    if (quotation.isAmc && (!quotation.amcFrequency || !quotation.amcDurationMonths || !quotation.amcStartDate)) {
      setSaveError(tc('amcRequiredError')); return
    }

    setSaving(true)
    const method = id === 'new' ? 'POST' : 'PUT'
    const url = id === 'new' ? '/api/quotations' : `/api/quotations/${id}`
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quotation, items: lineItems }),
      })
      if (res.ok) router.push(`/${locale}/admin/quotations`)
      else { const data = await res.json(); setSaveError(data.error || tc('failedToSave')) }
    } catch { setSaveError(tc('networkError')) }
    finally { setSaving(false) }
  }

  const handleMeasurementItemToggle = (item: any, checked: boolean) => {
    if (checked) {
      setLineItems([...lineItems, { description: item.name, quantity: '1', unit: 'unit', unitPrice: '0', total: '0' }])
    } else {
      setLineItems(lineItems.filter((li: any) => li.description !== item.name))
    }
  }

  const handleTermsTemplateChange = (templateId: string) => {
    const tmpl = termsTemplates.find((x: any) => x.id === templateId)
    setQuotation({ ...quotation, termsTemplateId: templateId, termsSnapshot: tmpl?.content || '' })
  }

  const handleBankTemplateChange = (templateId: string) => {
    const tmpl = bankTemplates.find((x: any) => x.id === templateId)
    setQuotation({ ...quotation, bankDetailsTemplateId: templateId, bankDetailsSnapshot: tmpl?.content || '' })
  }

  const updateItem = (index: number, field: string, value: string) => {
    const items = [...lineItems]; items[index] = { ...items[index], [field]: value }; setLineItems(items)
  }

  const removeItem = (index: number) => { const items = [...lineItems]; items.splice(index, 1); setLineItems(items) }

  // Calculations
  const subtotal = lineItems.reduce((sum: number, i: any) => sum + (parseFloat(i.quantity || '0') * parseFloat(i.unitPrice || '0')), 0)
  const discount = !quotation?.discountType || !quotation?.discountValue ? 0 :
    quotation.discountType === 'PERCENTAGE' ? subtotal * (parseFloat(quotation.discountValue) / 100) : parseFloat(quotation.discountValue) || 0
  const afterDiscount = subtotal - discount
  const vat = quotation?.vatEnabled ? afterDiscount * (parseFloat(quotation.vatPercentage) / 100) : 0
  const total = afterDiscount + vat

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  if (!quotation) return <div className="py-20 text-center text-sm text-gray-400">{tc('notFound')}</div>

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">{id === 'new' ? t('newQuotation') : t('quotationNumber', { number: quotation.quotationNumber || '' })}</h1>
        <p className="text-xs text-gray-400">{id === 'new' ? t('createNewQuotation') : t('editQuotation')}</p>
      </div>

      {saveError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{saveError}</div>
      )}

      <div className="space-y-4">
        {/* Client & Details */}
        <Section title={t('clientDetails')}>
          <FormField label={tc('client')} required>
            <Select value={quotation.clientId || ''} onValueChange={(v) => setQuotation({ ...quotation, clientId: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectClient')} /></SelectTrigger>
              <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label={t('measurement')}>
            <Select value={quotation.measurementId || '__NONE__'} onValueChange={(v) => setQuotation({ ...quotation, measurementId: v === '__NONE__' ? null : v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectMeasurement')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">{tc('none')}</SelectItem>
                {measurements.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('salesExecutive')}>
              <Select value={quotation.salesExecutiveId || '__NONE__'} onValueChange={(v) => setQuotation({ ...quotation, salesExecutiveId: v === '__NONE__' ? null : v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={tc('none')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">{tc('none')}</SelectItem>
                  {salesExecutives.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('validUntil')}>
              <Input type="date" className="rounded-xl" value={quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : ''} onChange={(e) => setQuotation({ ...quotation, validUntil: e.target.value || null })} />
            </FormField>
          </div>
          <FormField label={tc('notes')}>
            <Textarea className="rounded-xl text-sm" rows={2} value={quotation.notes || ''} onChange={(e) => setQuotation({ ...quotation, notes: e.target.value })} placeholder={tc('internalNotes')} />
          </FormField>
        </Section>

        {/* Measurement Items Picker */}
        {selectedMeasurement?.objects?.length > 0 && (
          <Section title={t('measurementItems')}>
            <p className="text-xs text-gray-400 mb-2">{t('tickItems')}</p>
            <div className="space-y-2">
              {selectedMeasurement.objects.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-2.5">
                  <Checkbox id={item.id} checked={lineItems.some((li: any) => li.description === item.name)} onCheckedChange={(c) => handleMeasurementItemToggle(item, !!c)} />
                  <label htmlFor={item.id} className="text-sm text-gray-700">{item.name}</label>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Line Items */}
        <Section title={`${t('lineItems')} (${lineItems.length})`}>
          {lineItems.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{tc('item')} {i + 1}</span>
                <button onClick={() => removeItem(i)} className="text-[10px] font-medium text-red-500 hover:text-red-700">{tc('remove')}</button>
              </div>
              <Input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder={t('itemDescription')} className="rounded-xl text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-400">{tc('qty')}</Label>
                  <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="rounded-xl text-sm mt-0.5" />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-400">{tc('unit')}</Label>
                  <Input value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} className="rounded-xl text-sm mt-0.5" />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-400">{tc('price')}</Label>
                  <Input type="number" step="0.001" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} className="rounded-xl text-sm mt-0.5" />
                </div>
              </div>
              <p className="text-right text-xs font-semibold text-gray-600">
                {(parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0')).toFixed(3)} {tc('omr')}
              </p>
            </div>
          ))}
          <button
            onClick={() => setLineItems([...lineItems, { description: '', quantity: '1', unit: 'unit', unitPrice: '0', total: '0' }])}
            className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98]"
          >
            {t('addLineItem')}
          </button>
        </Section>

        {/* AMC */}
        <Section title={t('amcContract')}>
          <div className="flex items-center gap-2">
            <Checkbox id="isAmc" checked={quotation.isAmc || false} onCheckedChange={(c) => setQuotation({ ...quotation, isAmc: !!c })} />
            <label htmlFor="isAmc" className="text-sm text-gray-700">{t('isAmc')}</label>
          </div>
          {quotation.isAmc && (
            <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <div className="grid grid-cols-3 gap-2">
                <FormField label={tc('frequency')}>
                  <Select value={quotation.amcFrequency || ''} onValueChange={(v) => setQuotation({ ...quotation, amcFrequency: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder={tc('selectMethod')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">{tc('weekly')}</SelectItem>
                      <SelectItem value="BI_WEEKLY">{tc('biWeekly')}</SelectItem>
                      <SelectItem value="MONTHLY">{tc('monthly')}</SelectItem>
                      <SelectItem value="QUARTERLY">{tc('quarterly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={tc('duration')}>
                  <Select value={quotation.amcDurationMonths?.toString() || ''} onValueChange={(v) => setQuotation({ ...quotation, amcDurationMonths: parseInt(v) })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder={tc('months')} /></SelectTrigger>
                    <SelectContent>
                      {[3,6,12,18,24].map(m => <SelectItem key={m} value={m.toString()}>{m} {tc('months')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={tc('startDate')}>
                  <Input type="date" className="rounded-xl" value={quotation.amcStartDate ? new Date(quotation.amcStartDate).toISOString().split('T')[0] : ''} onChange={(e) => setQuotation({ ...quotation, amcStartDate: e.target.value })} />
                </FormField>
              </div>
              {quotation.amcFrequency && quotation.amcDurationMonths && (
                <p className="text-xs text-amber-700">
                  {(() => {
                    const f: Record<string, number> = { WEEKLY: 52/12, BI_WEEKLY: 26/12, MONTHLY: 1, QUARTERLY: 1/3 }
                    const visits = Math.floor((f[quotation.amcFrequency] || 1) * quotation.amcDurationMonths)
                    return `~${visits} ${tc('visits')} ${tc('over')} ${quotation.amcDurationMonths} ${tc('months')}${total > 0 ? ` · ${(total / visits).toFixed(3)} ${tc('omr')}${tc('perVisit')}` : ''}`
                  })()}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Pricing */}
        <Section title={t('pricingDiscounts')}>
          <div className="flex items-center gap-2">
            <Checkbox id="vatEnabled" checked={quotation.vatEnabled} onCheckedChange={(c) => setQuotation({ ...quotation, vatEnabled: !!c })} />
            <label htmlFor="vatEnabled" className="text-sm text-gray-700">{tc('enableVAT')}</label>
          </div>
          {quotation.vatEnabled && (
            <FormField label={tc('vatPercentage')}>
              <Input type="number" className="rounded-xl" value={quotation.vatPercentage} onChange={(e) => setQuotation({ ...quotation, vatPercentage: e.target.value })} />
            </FormField>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={tc('discountType')}>
              <Select value={quotation.discountType || 'NONE'} onValueChange={(v) => setQuotation({ ...quotation, discountType: v === 'NONE' ? null : v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{tc('noDiscount')}</SelectItem>
                  <SelectItem value="PERCENTAGE">{tc('percentage')}</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">{tc('fixedAmount')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {quotation.discountType && (
              <FormField label={quotation.discountType === 'PERCENTAGE' ? tc('discountValue') + ' %' : tc('discountValue')}>
                <Input type="number" step="0.001" className="rounded-xl" value={quotation.discountValue || ''} onChange={(e) => setQuotation({ ...quotation, discountValue: e.target.value })} />
              </FormField>
            )}
          </div>

          {/* Totals */}
          <div className="mt-3 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{tc('subtotal')}</span><span className="font-medium text-gray-800">{subtotal.toFixed(3)} {tc('omr')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-red-500">
                <span>{tc('discount')} {quotation.discountType === 'PERCENTAGE' ? `(${quotation.discountValue}%)` : ''}</span>
                <span>-{discount.toFixed(3)} {tc('omr')}</span>
              </div>
            )}
            {vat > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{tc('vat')} ({quotation.vatPercentage}%)</span><span>{vat.toFixed(3)} {tc('omr')}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1.5 text-sm font-bold text-gray-900">
              <span>{tc('grandTotal')}</span><span>{total.toFixed(3)} {tc('omr')}</span>
            </div>
          </div>
        </Section>

        {/* Terms */}
        <Section title={t('termsConditions')}>
          <FormField label={tc('template')}>
            <Select value={quotation.termsTemplateId || '__NONE__'} onValueChange={(v) => v !== '__NONE__' ? handleTermsTemplateChange(v) : setQuotation({ ...quotation, termsTemplateId: '', termsSnapshot: '' })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectTemplate')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">{tc('none')}</SelectItem>
                {termsTemplates.map((tmpl: any) => <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <Textarea className="rounded-xl text-sm" rows={4} value={quotation.termsSnapshot || ''} onChange={(e) => setQuotation({ ...quotation, termsSnapshot: e.target.value })} placeholder={tc('termsPlaceholder')} />
        </Section>

        {/* Bank Details */}
        <Section title={t('bankDetails')}>
          <FormField label={tc('template')}>
            <Select value={quotation.bankDetailsTemplateId || '__NONE__'} onValueChange={(v) => v !== '__NONE__' ? handleBankTemplateChange(v) : setQuotation({ ...quotation, bankDetailsTemplateId: '', bankDetailsSnapshot: '' })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('selectTemplate')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">{tc('none')}</SelectItem>
                {bankTemplates.map((tmpl: any) => <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <Textarea className="rounded-xl text-sm" rows={4} value={quotation.bankDetailsSnapshot || ''} onChange={(e) => setQuotation({ ...quotation, bankDetailsSnapshot: e.target.value })} placeholder={tc('bankDetailsPlaceholder')} />
        </Section>
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Link href={`/${locale}/admin/quotations`} className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-medium text-gray-600 active:scale-[0.98]">{tc('cancel')}</Link>
          <div className="flex-[2] flex flex-col items-center">
            <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-primary to-gold-600 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/30 active:scale-[0.98] disabled:opacity-50">
              {saving ? tc('saving') : id === 'new' ? t('createQuotation') : tc('saveChanges')}
            </button>
            <span className="mt-0.5 text-[10px] font-bold text-gray-400">{total.toFixed(3)} {tc('omr')}</span>
          </div>
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
