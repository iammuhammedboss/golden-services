'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import Image from 'next/image'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatCurrency, enumToReadable, getStatusColor } from '@/lib/utils'
import { InlineLoader } from '@/components/loading-screen'

export default function QuotationViewPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'
  const quotationId = params.id as string
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const fetchQuotation = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`)
      if (response.ok) {
        const data = await response.json()
        setQuotation(data)
      } else {
        console.error('Failed to fetch quotation')
      }
    } catch (error) {
      console.error('Error fetching quotation:', error)
    } finally {
      setLoading(false)
    }
  }, [quotationId])

  useEffect(() => {
    fetchQuotation()
  }, [fetchQuotation])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: quotation ? `Quotation-${quotation.quotationNumber || quotation.id}` : 'Quotation',
  })

  const handleShareWhatsApp = () => {
    if (!quotation) return

    const total = quotation.items.reduce((sum: number, item: any) => sum + Number(item.total), 0)

    const message = `*Quotation ${quotation.quotationNumber || `Q-${quotation.id.substring(0, 8).toUpperCase()}`}*%0A%0A` +
      `Client: ${quotation.client?.name || quotation.lead?.name || 'N/A'}%0A` +
      `Amount: ${formatCurrency(total)}%0A` +
      `Valid Until: ${quotation.validUntil ? formatDate(new Date(quotation.validUntil), 'PP') : 'N/A'}%0A` +
      `Status: ${enumToReadable(quotation.status)}%0A%0A` +
      `View full quotation: ${window.location.href}`

    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchQuotation()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  if (loading) {
    return <InlineLoader message="Loading quotation details..." />
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Quotation not found</p>
        <Button onClick={() => router.push(`/${locale}/admin/quotations`)}>
          Back to Quotations
        </Button>
      </div>
    )
  }

  const total = quotation.items.reduce((sum: number, item: any) => sum + Number(item.total), 0)

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/quotations`)}
        >
          ← Back to Quotations
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/quotations/${quotationId}`)}
          >
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Button>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>PDF Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={`/api/quotations/${quotationId}/download?mode=plain-model`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Plain-Model (Default)
                  <span className="ml-auto text-xs text-muted-foreground">Digital</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/api/quotations/${quotationId}/download?mode=letterhead`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Letterhead
                  <span className="ml-auto text-xs text-muted-foreground">Physical</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/api/quotations/${quotationId}/download?mode=plain`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Plain
                  <span className="ml-auto text-xs text-muted-foreground">Minimal</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {quotation.status === 'DRAFT' && (
            <Button onClick={() => handleUpdateStatus('SENT')}>
              Mark as Sent
            </Button>
          )}
          {quotation.status === 'SENT' && (
            <Button onClick={() => handleUpdateStatus('ACCEPTED')}>
              Mark as Accepted
            </Button>
          )}
        </div>
      </div>

      {/* Printable Quotation */}
      <div ref={printRef} className="bg-white">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="Golden Services Logo"
                  width={60}
                  height={60}
                  className="h-15 w-auto"
                />
                <div>
                  <CardTitle className="text-3xl font-bold">QUOTATION</CardTitle>
                  <p className="text-lg mt-2">{quotation.quotationNumber || `Q-${quotation.id.substring(0, 8).toUpperCase()}`}</p>
                  <Badge className={`mt-2 ${getStatusColor(quotation.status)}`}>
                    {enumToReadable(quotation.status)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gold-600">Golden Services</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Professional Cleaning & Pest Control
                </p>
                <p className="text-sm text-muted-foreground">Muscat, Oman</p>
                <p className="text-sm text-muted-foreground">+968 1234 5678</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Quote To & Quotation Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  QUOTE TO:
                </h3>
                <p className="font-semibold text-lg">{quotation.client?.name || quotation.lead?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  {quotation.client?.phone || quotation.lead?.phone || 'N/A'}
                </p>
                {quotation.client?.email && (
                  <p className="text-sm text-muted-foreground">{quotation.client.email}</p>
                )}
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">Created Date:</span>
                  <p className="font-medium">{formatDate(new Date(quotation.createdAt), 'PP')}</p>
                </div>
                {quotation.validUntil && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Valid Until:</span>
                    <p className="font-medium">{formatDate(new Date(quotation.validUntil), 'PP')}</p>
                  </div>
                )}
                {quotation.createdBy && (
                  <div>
                    <span className="text-sm text-muted-foreground">Created By:</span>
                    <p className="font-medium">{quotation.createdBy.name}</p>
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
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{Number(item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.unit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Total */}
            <div className="mt-8 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="border-t border-gold-400 pt-2 flex justify-between">
                  <span className="font-semibold text-lg">Total (OMR):</span>
                  <span className="font-bold text-lg text-gold-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quotation.notes && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">NOTES:</h3>
                <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}

            {/* Terms & Conditions */}
            {quotation.termsSnapshot && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">TERMS & CONDITIONS:</h3>
                <p className="text-sm whitespace-pre-wrap">{quotation.termsSnapshot}</p>
              </div>
            )}

            {/* Bank Details */}
            {quotation.bankDetailsSnapshot && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">BANK DETAILS:</h3>
                <p className="text-sm whitespace-pre-wrap">{quotation.bankDetailsSnapshot}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>Thank you for considering our services!</p>
              <p className="mt-1">For questions, contact us at info@goldenservices.om</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
