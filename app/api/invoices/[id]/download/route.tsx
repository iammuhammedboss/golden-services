import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewInvoices } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { renderToStream } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf-templates/invoice-pdf'
import { InvoicePDFEnhanced, PDFMode } from '@/lib/pdf-templates/invoice-pdf-enhanced'
import { getSalesExecutiveId } from '@/lib/sales-executive'

// GET /api/invoices/[id]/download - Download invoice as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canViewInvoices(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view invoices' },
        { status: 403 }
      )
    }

    // Get PDF mode from query parameter (default: plain-model)
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get('mode') || 'plain-model') as PDFMode

    // Fetch invoice with all related data including creator
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        jobOrder: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get sales executive ID from creator name
    const salesExecutiveId = getSalesExecutiveId(invoice.createdBy?.name)

    // Prepare data for PDF template
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
      client: {
        name: invoice.client.name,
        phone: invoice.client.phone,
        email: invoice.client.email,
      },
      jobOrder: invoice.jobOrder
        ? {
            jobNumber: invoice.jobOrder.jobNumber,
            scheduledDate: invoice.jobOrder.scheduledDate.toISOString(),
          }
        : null,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      notes: invoice.notes,
      status: invoice.status,
      createdBy: invoice.createdBy,
      salesExecutiveId,
    }

    // Generate PDF stream using enhanced template
    let stream
    try {
      stream = await renderToStream(<InvoicePDFEnhanced invoice={invoiceData} mode={mode} />)
    } catch (error) {
      console.error('Error rendering PDF stream:', error)
      return NextResponse.json(
        { error: 'Failed to generate PDF document' },
        { status: 500 }
      )
    }

    // Convert stream to buffer
    const chunks: Buffer[] = []
    try {
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
      }
    } catch (error) {
      console.error('Error converting stream to buffer:', error)
      return NextResponse.json(
        { error: 'Failed to process PDF document' },
        { status: 500 }
      )
    }
    const buffer = Buffer.concat(chunks)

    // Update invoice with pdfUrl (optional - you can store this in cloud storage)
    // For now, we're just generating on-the-fly

    // Return PDF as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('GET /api/invoices/[id]/download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
