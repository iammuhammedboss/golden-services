'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface AddQuotationDialogProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

interface Client {
  id: string
  name: string
}

interface Site {
  id: string
  name: string
  clientId: string
}

interface Service {
  id: string
  name: string
  categoryId: string
}

interface LineItem {
  id: string
  serviceId: string
  description: string
  quantity: string
  unit: string
  unitPrice: string
  total: string
}

export function AddQuotationDialog({
  variant = 'default',
  size = 'default',
  className,
}: AddQuotationDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredSites, setFilteredSites] = useState<Site[]>([])

  const [formData, setFormData] = useState({
    clientId: '',
    siteId: '',
    validUntil: '',
    notes: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      serviceId: '',
      description: '',
      quantity: '1',
      unit: 'unit',
      unitPrice: '0',
      total: '0',
    },
  ])

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  // Filter sites when client changes
  useEffect(() => {
    if (formData.clientId) {
      const filtered = sites.filter((site) => site.clientId === formData.clientId)
      setFilteredSites(filtered)
    } else {
      setFilteredSites([])
    }
  }, [formData.clientId, sites])

  const fetchData = async () => {
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/clients')
      const clientsData = await clientsRes.json()
      if (Array.isArray(clientsData)) {
        setClients(clientsData)
      }

      // Fetch sites
      const sitesRes = await fetch('/api/sites')
      const sitesData = await sitesRes.json()
      if (Array.isArray(sitesData)) {
        setSites(sitesData)
      }

      // Fetch services
      const servicesRes = await fetch('/api/services')
      const servicesData = await servicesRes.json()
      if (Array.isArray(servicesData)) {
        setServices(servicesData)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  const calculateLineTotal = (quantity: string, unitPrice: string): string => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(unitPrice) || 0
    return (qty * price).toFixed(3)
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item

        const updated = { ...item, [field]: value }

        // Auto-calculate total when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = calculateLineTotal(updated.quantity, updated.unitPrice)
        }

        return updated
      })
    )
  }

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map((item) => parseInt(item.id))) + 1).toString()
    setLineItems([
      ...lineItems,
      {
        id: newId,
        serviceId: '',
        description: '',
        quantity: '1',
        unit: 'unit',
        unitPrice: '0',
        total: '0',
      },
    ])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const calculateGrandTotal = (): string => {
    const sum = lineItems.reduce((acc, item) => acc + parseFloat(item.total || '0'), 0)
    return sum.toFixed(3)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!formData.clientId) {
      setError('Please select a client')
      setLoading(false)
      return
    }

    if (lineItems.length === 0 || lineItems.every((item) => !item.description)) {
      setError('Please add at least one line item with a description')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          siteId: formData.siteId || null,
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
          notes: formData.notes || null,
          items: lineItems
            .filter((item) => item.description.trim())
            .map((item) => ({
              serviceId: item.serviceId || null,
              description: item.description,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              unitPrice: parseFloat(item.unitPrice),
              total: parseFloat(item.total),
            })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create quotation')
      }

      setSuccess('✅ Quotation created successfully!')

      // Reset form
      setFormData({
        clientId: '',
        siteId: '',
        validUntil: '',
        notes: '',
      })
      setLineItems([
        {
          id: '1',
          serviceId: '',
          description: '',
          quantity: '1',
          unit: 'unit',
          unitPrice: '0',
          total: '0',
        },
      ])

      // Wait a moment to show success message
      setTimeout(() => {
        setOpen(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Quotation</span>
          <span className="sm:hidden">New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>
            Create a quotation for a client with line items and pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => {
                  setFormData({ ...formData, clientId: value, siteId: '' })
                }}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Site Selection */}
            <div className="space-y-2">
              <Label htmlFor="site">Site (Optional)</Label>
              <Select
                value={formData.siteId}
                onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                disabled={!formData.clientId}
              >
                <SelectTrigger id="site">
                  <SelectValue
                    placeholder={formData.clientId ? 'Select a site' : 'Select a client first'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSites.length > 0 ? (
                    filteredSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No sites available for this client
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valid Until Date */}
          <div className="space-y-2">
            <Label htmlFor="validUntil">Valid Until (Optional)</Label>
            <Input
              id="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-3 w-3 mr-1" />
                Add Line
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor={`description-${item.id}`}>Description *</Label>
                    <Input
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, 'description', e.target.value)
                      }
                      placeholder="Service description"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateLineItem(item.id, 'unit', value)}
                    >
                      <SelectTrigger id={`unit-${item.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unit</SelectItem>
                        <SelectItem value="sqm">SQM</SelectItem>
                        <SelectItem value="hour">Hour</SelectItem>
                        <SelectItem value="visit">Visit</SelectItem>
                        <SelectItem value="lumpsum">Lump Sum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`unitPrice-${item.id}`}>Unit Price (OMR)</Label>
                    <Input
                      id={`unitPrice-${item.id}`}
                      type="number"
                      step="0.001"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateLineItem(item.id, 'unitPrice', e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`total-${item.id}`}>Total (OMR)</Label>
                    <Input
                      id={`total-${item.id}`}
                      type="text"
                      value={item.total}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end items-center gap-2 pt-2 border-t">
              <span className="text-sm font-medium">Grand Total:</span>
              <span className="text-lg font-bold">{calculateGrandTotal()} OMR</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
              {success}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Quotation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
