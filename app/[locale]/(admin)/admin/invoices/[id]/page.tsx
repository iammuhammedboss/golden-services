'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatCurrency, enumToReadable } from '@/lib/utils'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'
  const invoiceId = params.id as string
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        console.error('Failed to fetch invoice')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice ? `Invoice-${invoice.invoiceNumber}` : 'Invoice',
  })

  const handleShareWhatsApp = () => {
    if (!invoice) return

    const message = `*Invoice ${invoice.invoiceNumber}*%0A%0A` +
      `Client: ${invoice.client.name}%0A` +
      `Amount: ${formatCurrency(Number(invoice.total))}%0A` +
      `Due Date: ${invoice.dueDate ? formatDate(new Date(invoice.dueDate), 'PP') : 'N/A'}%0A` +
      `Status: ${enumToReadable(invoice.status)}%0A%0A` +
      `View full invoice: ${window.location.href}`

    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchInvoice()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SENT':
        return 'bg-blue-100 text-blue-800'
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button onClick={() => router.push(`/${locale}/admin/invoices`)}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/invoices`)}
        >
          ← Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print / PDF
          </Button>
          <Button variant="outline" onClick={handleShareWhatsApp}>
            <svg
              className="mr-2 h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Share WhatsApp
          </Button>
          {invoice.status === 'DRAFT' && (
            <Button onClick={() => handleUpdateStatus('SENT')}>
              Mark as Sent
            </Button>
          )}
          {invoice.status === 'SENT' && (
            <Button onClick={() => handleUpdateStatus('PAID')}>
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice */}
      <div ref={printRef} className="bg-white">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">INVOICE</CardTitle>
                <p className="text-lg mt-2">{invoice.invoiceNumber}</p>
                <Badge className={`mt-2 ${getStatusColor(invoice.status)}`}>
                  {enumToReadable(invoice.status)}
                </Badge>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-primary">Golden Services</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Professional Cleaning & Pest Control
                </p>
                <p className="text-sm text-muted-foreground">Muscat, Oman</p>
                <p className="text-sm text-muted-foreground">+968 1234 5678</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Bill To & Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  BILL TO:
                </h3>
                <p className="font-semibold text-lg">{invoice.client.name}</p>
                <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>
                {invoice.client.email && (
                  <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                )}
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">Issue Date:</span>
                  <p className="font-medium">{formatDate(new Date(invoice.issueDate), 'PP')}</p>
                </div>
                {invoice.dueDate && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <p className="font-medium">{formatDate(new Date(invoice.dueDate), 'PP')}</p>
                  </div>
                )}
                {invoice.jobOrder && (
                  <div>
                    <span className="text-sm text-muted-foreground">Job Number:</span>
                    <p className="font-medium">{invoice.jobOrder.jobNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{Number(item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">{formatCurrency(Number(invoice.tax))}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-lg">Total ({invoice.currency}):</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(Number(invoice.total))}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">NOTES:</h3>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
              <p className="mt-1">For questions, contact us at info@goldenservices.om</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
