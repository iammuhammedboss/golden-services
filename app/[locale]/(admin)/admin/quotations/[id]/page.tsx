'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Quotation, Client, Measurement, MeasurementObject, QuotationItem, TermsTemplate, BankDetailsTemplate } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type QuotationWithRelations = Quotation & {
  client: Client | null
  items: QuotationItem[]
  termsTemplate: TermsTemplate | null
  bankDetailsTemplate: BankDetailsTemplate | null
}

export default function QuotationDetailsPage() {
  const [quotation, setQuotation] = useState<any | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [selectedMeasurement, setSelectedMeasurement] = useState<(Measurement & { objects: MeasurementObject[] }) | null>(null)
  const [salesExecutives, setSalesExecutives] = useState<any[]>([])
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>([])
  const [bankTemplates, setBankTemplates] = useState<BankDetailsTemplate[]>([])
  const [lineItems, setLineItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, measurementsRes, termsRes, bankRes, salesRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/measurements'),
          fetch('/api/templates/terms'),
          fetch('/api/templates/bank-details'),
          fetch('/api/sales-executives'),
        ])
        if (clientsRes.ok) setClients(await clientsRes.json())
        if (measurementsRes.ok) setMeasurements(await measurementsRes.json())
        if (termsRes.ok) setTermsTemplates(await termsRes.json())
        if (bankRes.ok) setBankTemplates(await bankRes.json())
        if (salesRes.ok) setSalesExecutives(await salesRes.json())
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchQuotation() {
      if (id === 'new') {
        setQuotation({
            id: 'new',
            clientId: '',
            items: [],
            vatEnabled: false,
            vatPercentage: 5,
            discountType: null,
            discountValue: null,
            termsTemplateId: '',
            termsSnapshot: '',
            bankDetailsTemplateId: '',
            bankDetailsSnapshot: '',
            isAmc: false,
            amcFrequency: null,
            amcDurationMonths: null,
            amcStartDate: null,
        })
        setLoading(false)
        return
      }
      try {
        const response = await fetch(`/api/quotations/${id}`)
        if (response.ok) {
          const data = await response.json()
          setQuotation(data)
          setLineItems(data.items)
        }
      } catch (error) {
        console.error('Failed to fetch quotation:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuotation()
  }, [id])

  useEffect(() => {
    async function fetchMeasurementDetails() {
      if (!quotation?.measurementId) {
        setSelectedMeasurement(null)
        return
      }
      try {
        const response = await fetch(`/api/measurements/${quotation.measurementId}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedMeasurement(data)
        }
      } catch (error) {
        console.error('Failed to fetch measurement details:', error)
      }
    }
    fetchMeasurementDetails()
  }, [quotation?.measurementId])

  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    setSaveError('')
    // Validation
    if (!quotation.clientId) {
      setSaveError('Please select a client')
      return
    }
    if (lineItems.length === 0) {
      setSaveError('Please add at least one line item')
      return
    }
    const emptyItems = lineItems.filter(i => !i.description?.trim())
    if (emptyItems.length > 0) {
      setSaveError('All line items must have a description')
      return
    }
    if (quotation.isAmc && (!quotation.amcFrequency || !quotation.amcDurationMonths || !quotation.amcStartDate)) {
      setSaveError('AMC contracts require frequency, duration, and start date')
      return
    }

    setSaving(true)
    const method = id === 'new' ? 'POST' : 'PUT'
    const url = id === 'new' ? '/api/quotations' : `/api/quotations/${id}`
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quotation, items: lineItems }),
      })
      if (response.ok) {
        router.push('/admin/quotations')
      } else {
        const data = await response.json()
        setSaveError(data.error || 'Failed to save quotation')
      }
    } catch (error) {
      console.error('Failed to save quotation:', error)
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleMeasurementItemToggle = (item: MeasurementObject, checked: boolean) => {
    if (checked) {
      const newItem = {
        description: item.name,
        quantity: '1',
        unit: 'unit',
        unitPrice: '10',
        total: '10',
      };
      setLineItems([...lineItems, newItem]);
    } else {
      setLineItems(lineItems.filter(li => li.description !== item.name));
    }
  };

  const handleTermsTemplateChange = (templateId: string) => {
    const template = termsTemplates.find(t => t.id === templateId)
    setQuotation({
      ...quotation,
      termsTemplateId: templateId,
      termsSnapshot: template?.content || '',
    })
  }

  const handleBankTemplateChange = (templateId: string) => {
    const template = bankTemplates.find(t => t.id === templateId)
    setQuotation({
      ...quotation,
      bankDetailsTemplateId: templateId,
      bankDetailsSnapshot: template?.content || '',
    })
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (quantity * unitPrice)
    }, 0)
  }

  const calculateDiscount = (subtotal: number) => {
    if (!quotation.discountType || !quotation.discountValue) return 0
    if (quotation.discountType === 'PERCENTAGE') {
      return subtotal * (parseFloat(quotation.discountValue) / 100)
    }
    return parseFloat(quotation.discountValue) || 0
  }

  const calculateVAT = (amountAfterDiscount: number) => {
    if (!quotation.vatEnabled) return 0
    return amountAfterDiscount * (parseFloat(quotation.vatPercentage) / 100)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount(subtotal)
    const amountAfterDiscount = subtotal - discount
    const vat = calculateVAT(amountAfterDiscount)
    return amountAfterDiscount + vat
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!quotation) {
    return <div>Quotation not found</div>
  }

  const subtotal = calculateSubtotal()
  const discount = calculateDiscount(subtotal)
  const amountAfterDiscount = subtotal - discount
  const vat = calculateVAT(amountAfterDiscount)
  const total = calculateTotal()

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold md:text-3xl">{id === 'new' ? 'New Quotation' : `Quotation ${quotation.quotationNumber || quotation.id}`}</h1>
            <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Quotation'}
            </Button>
        </div>

        {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {saveError}
            </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <Label>Client <span className="text-red-500">*</span></Label>
                <Select
                    value={quotation.clientId || ''}
                    onValueChange={(value) => setQuotation({ ...quotation, clientId: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Measurement</Label>
                <Select
                    value={quotation.measurementId || ''}
                    onValueChange={(value) => setQuotation({ ...quotation, measurementId: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a measurement" />
                    </SelectTrigger>
                    <SelectContent>
                        {measurements.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Sales Executive</Label>
                <Select
                    value={quotation.salesExecutiveId || '__NONE__'}
                    onValueChange={(value) => setQuotation({ ...quotation, salesExecutiveId: value === '__NONE__' ? null : value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select sales exec" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__NONE__">None</SelectItem>
                        {salesExecutives.map((se: any) => (
                            <SelectItem key={se.id} value={se.id}>{se.name} ({se.code})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                    type="date"
                    value={quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : ''}
                    onChange={(e) => setQuotation({ ...quotation, validUntil: e.target.value || null })}
                />
            </div>
        </div>

        {selectedMeasurement && (
            <Card>
                <CardHeader>
                    <CardTitle>Measurement Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {selectedMeasurement.objects.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={item.id}
                                    onCheckedChange={(checked) => handleMeasurementItemToggle(item, !!checked)}
                                />
                                <label htmlFor={item.id}>{item.name}</label>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Mobile: card-based items / Desktop: table */}
                <div className="space-y-3">
                    {lineItems.map((item, index) => (
                        <div key={index} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-red-500"
                                    onClick={() => {
                                        const newLineItems = [...lineItems];
                                        newLineItems.splice(index, 1);
                                        setLineItems(newLineItems);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                            <div>
                                <Label className="text-xs">Description <span className="text-red-500">*</span></Label>
                                <Input
                                    value={item.description}
                                    onChange={(e) => {
                                        const newLineItems = [...lineItems];
                                        newLineItems[index].description = e.target.value;
                                        setLineItems(newLineItems);
                                    }}
                                    placeholder="Item description"
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <Label className="text-xs">Qty</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newLineItems = [...lineItems];
                                            newLineItems[index].quantity = e.target.value;
                                            setLineItems(newLineItems);
                                        }}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Unit</Label>
                                    <Input
                                        value={item.unit}
                                        onChange={(e) => {
                                            const newLineItems = [...lineItems];
                                            newLineItems[index].unit = e.target.value;
                                            setLineItems(newLineItems);
                                        }}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Price</Label>
                                    <Input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => {
                                            const newLineItems = [...lineItems];
                                            newLineItems[index].unitPrice = e.target.value;
                                            setLineItems(newLineItems);
                                        }}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="text-right text-sm font-semibold">
                                Total: {(parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0')).toFixed(3)} OMR
                            </div>
                        </div>
                    ))}
                </div>
                <Button
                    className="mt-3 w-full md:w-auto"
                    variant="outline"
                    onClick={() => setLineItems([...lineItems, { description: '', quantity: '1', unit: 'unit', unitPrice: '0', total: '0' }])}
                >
                    + Add Line Item
                </Button>
            </CardContent>
        </Card>

        {/* AMC Contract Settings */}
        <Card>
            <CardHeader>
                <CardTitle>AMC Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isAmc"
                        checked={quotation.isAmc || false}
                        onCheckedChange={(checked) => setQuotation({ ...quotation, isAmc: !!checked })}
                    />
                    <Label htmlFor="isAmc">This is an Annual Maintenance Contract</Label>
                </div>

                {quotation.isAmc && (
                    <div className="space-y-4 rounded-lg border p-4 bg-amber-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select
                                    value={quotation.amcFrequency || ''}
                                    onValueChange={(value) => setQuotation({ ...quotation, amcFrequency: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (Months)</Label>
                                <Select
                                    value={quotation.amcDurationMonths?.toString() || ''}
                                    onValueChange={(value) => setQuotation({ ...quotation, amcDurationMonths: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 Months</SelectItem>
                                        <SelectItem value="6">6 Months</SelectItem>
                                        <SelectItem value="12">12 Months</SelectItem>
                                        <SelectItem value="18">18 Months</SelectItem>
                                        <SelectItem value="24">24 Months</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={quotation.amcStartDate ? new Date(quotation.amcStartDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setQuotation({ ...quotation, amcStartDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {quotation.amcFrequency && quotation.amcDurationMonths && quotation.amcStartDate && (
                            <div className="text-sm text-muted-foreground bg-white rounded p-3 border">
                                {(() => {
                                    const freqMap: Record<string, number> = { WEEKLY: 52/12, BI_WEEKLY: 26/12, MONTHLY: 1, QUARTERLY: 1/3 }
                                    const visitsPerMonth = freqMap[quotation.amcFrequency] || 1
                                    const totalVisits = Math.floor(visitsPerMonth * quotation.amcDurationMonths)
                                    const perVisitCost = totalVisits > 0 ? (total / totalVisits) : 0
                                    return (
                                        <span>
                                            This will generate approximately <strong>{totalVisits} visits</strong> over{' '}
                                            <strong>{quotation.amcDurationMonths} months</strong>.
                                            {total > 0 && <> Cost per visit: <strong>{perVisitCost.toFixed(3)} OMR</strong></>}
                                        </span>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Pricing & Discounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="vatEnabled"
                        checked={quotation.vatEnabled}
                        onCheckedChange={(checked) => setQuotation({ ...quotation, vatEnabled: !!checked })}
                    />
                    <Label htmlFor="vatEnabled">Enable VAT</Label>
                </div>

                {quotation.vatEnabled && (
                    <div className="space-y-2">
                        <Label>VAT Percentage</Label>
                        <Input
                            type="number"
                            value={quotation.vatPercentage}
                            onChange={(e) => setQuotation({ ...quotation, vatPercentage: e.target.value })}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select
                            value={quotation.discountType || 'NONE'}
                            onValueChange={(value) => setQuotation({ ...quotation, discountType: value === 'NONE' ? null : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">No Discount</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {quotation.discountType && (
                        <div className="space-y-2">
                            <Label>Discount Value</Label>
                            <Input
                                type="number"
                                value={quotation.discountValue || ''}
                                onChange={(e) => setQuotation({ ...quotation, discountValue: e.target.value })}
                                placeholder={quotation.discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount'}
                            />
                        </div>
                    )}
                </div>

                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">{subtotal.toFixed(3)} OMR</span>
                    </div>
                    {quotation.discountType && quotation.discountValue && (
                        <div className="flex justify-between text-red-600">
                            <span>Discount ({quotation.discountType === 'PERCENTAGE' ? `${quotation.discountValue}%` : 'Fixed'}):</span>
                            <span>-{discount.toFixed(3)} OMR</span>
                        </div>
                    )}
                    {quotation.vatEnabled && (
                        <div className="flex justify-between">
                            <span>VAT ({quotation.vatPercentage}%):</span>
                            <span>{vat.toFixed(3)} OMR</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{total.toFixed(3)} OMR</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Template</Label>
                    <Select
                        value={quotation.termsTemplateId || ''}
                        onValueChange={handleTermsTemplateChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                            {termsTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <Textarea
                        rows={5}
                        value={quotation.termsSnapshot || ''}
                        onChange={(e) => setQuotation({ ...quotation, termsSnapshot: e.target.value })}
                        placeholder="Enter terms and conditions..."
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Template</Label>
                    <Select
                        value={quotation.bankDetailsTemplateId || ''}
                        onValueChange={handleBankTemplateChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                            {bankTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Bank Details</Label>
                    <Textarea
                        rows={5}
                        value={quotation.bankDetailsSnapshot || ''}
                        onChange={(e) => setQuotation({ ...quotation, bankDetailsSnapshot: e.target.value })}
                        placeholder="Enter bank details..."
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
