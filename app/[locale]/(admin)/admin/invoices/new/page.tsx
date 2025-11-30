'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Define types for better type safety
interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Job {
  id: string;
  jobNumber: string;
  client: {
    name: string;
  };
}

interface QuotationItem {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
}

function NewInvoiceForm() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = (params.locale as string) || 'en'

  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
    quotationId: '',
    jobOrderId: '',
    dueDate: '',
    notes: '',
    status: 'DRAFT',
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ])

  const handleJobChange = useCallback(async (jobId: string) => {
    if (!jobId) {
      setFormData((prev) => ({
        ...prev,
        clientId: '',
        quotationId: '',
        jobOrderId: '',
      }))
      setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }])
      return
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }
      const job = await response.json()

      setFormData((prev) => ({
        ...prev,
        clientId: job.clientId,
        quotationId: job.quotationId || '',
        jobOrderId: job.id,
      }))

      if (job.quotation && job.quotation.items) {
        const newItems = job.quotation.items.map((item: QuotationItem) => ({
          description: item.description,
          quantity: parseFloat(item.quantity.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          total: parseFloat(item.total.toString()),
        }))
        setItems(newItems.length > 0 ? newItems : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }])
      } else {
        setItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }])
      }
    } catch (error) {
      console.error('Error handling job change:', error)
      alert('Failed to load job details. Please try again.')
    }
  }, []) // Empty dependency array, as it doesn't depend on props or state from this component

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    }

    const fetchJobs = async (): Promise<Job[]> => {
      try {
        const response = await fetch('/api/jobs')
        if (response.ok) {
          const data = await response.json()
          setJobs(data)
          return data
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
      }
      return []
    }

    fetchClients()
    fetchJobs().then((fetchedJobs) => {
      const jobIdFromUrl = searchParams.get('jobId')
      if (jobIdFromUrl && fetchedJobs?.find((j: Job) => j.id === jobIdFromUrl)) {
        handleJobChange(jobIdFromUrl)
      }
    })
  }, [searchParams, handleJobChange])

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }

    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.0
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId) {
      alert('Please select a client')
      return
    }

    if (items.length === 0 || items[0].description === '') {
      alert('Please add at least one item')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quotationId: formData.quotationId || null,
          jobOrderId: formData.jobOrderId || null,
          items: items.filter(item => item.description),
        }),
      })

      if (response.ok) {
        const invoice = await response.json()
        router.push(`/${locale}/admin/invoices/${invoice.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold">Create New Invoice</h1>
           <p className="text-muted-foreground">Generate an invoice for your client</p>
         </div>
         <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/invoices`)}
        >
          Cancel
        </Button>
       </div>
 
       <form onSubmit={handleSubmit}>
         <div className="grid gap-6">
           <Card>
             <CardHeader>
               <CardTitle>Invoice Details</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="jobOrderId">Job (Optional)</Label>
                   <Select
                    value={formData.jobOrderId}
                    onValueChange={handleJobChange}
                  >
                     <SelectTrigger>
                       <SelectValue placeholder="Select a job to auto-fill" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="">None</SelectItem>
                       {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobNumber} - {job.client.name}
                        </SelectItem>
                      ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="clientId">Client *</Label>
                   <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientId: value })
                    }
                    disabled={!!formData.jobOrderId}
                  >
                     <SelectTrigger>
                       <SelectValue placeholder="Select client" />
                     </SelectTrigger>
                     <SelectContent>
                       {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="dueDate">Due Date</Label>
                   <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="status">Status</Label>
                 <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="DRAFT">Draft</SelectItem>
                     <SelectItem value="SENT">Sent</SelectItem>
                     <SelectItem value="PAID">Paid</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="notes">Notes (Optional)</Label>
                 <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional notes or payment terms..."
                  rows={3}
                />
               </div>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle>Invoice Items</CardTitle>
                 <Button type="button" variant="outline" onClick={handleAddItem}>
                  + Add Item
                </Button>
               </div>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-[40%]">Description</TableHead>
                     <TableHead className="w-[15%]">Quantity</TableHead>
                     <TableHead className="w-[20%]">Unit Price</TableHead>
                     <TableHead className="w-[20%]">Total</TableHead>
                     <TableHead className="w-[5%]"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {items.map((item, index) => (
                    <TableRow key={index}>
                       <TableCell>
                         <Input
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          placeholder="Item description"
                        />
                       </TableCell>
                       <TableCell>
                         <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                        />
                       </TableCell>
                       <TableCell>
                         <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                        />
                       </TableCell>
                       <TableCell>
                         <div className="font-medium">
                          {item.total.toFixed(3)} OMR
                        </div>
                       </TableCell>
                       <TableCell>
                         {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            ×
                          </Button>
                        )}
                       </TableCell>
                     </TableRow>
                  ))}
                 </TableBody>
               </Table>
 
               <div className="mt-6 flex justify-end">
                 <div className="w-64 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Subtotal:</span>
                     <span className="font-medium">{calculateSubtotal().toFixed(3)} OMR</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Tax:</span>
                     <span className="font-medium">{calculateTax().toFixed(3)} OMR</span>
                   </div>
                   <div className="border-t pt-2 flex justify-between">
                     <span className="font-semibold">Total:</span>
                     <span className="font-bold text-primary">
                      {calculateTotal().toFixed(3)} OMR
                    </span>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <div className="flex justify-end gap-2">
             <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/invoices`)}
            >
              Cancel
            </Button>
             <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
           </div>
         </div>
       </form>
     </div>
  )
}


export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewInvoiceForm />
    </Suspense>
  )
}
