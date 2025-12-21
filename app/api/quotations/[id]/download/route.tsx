import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewQuotations } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { renderToStream } from '@react-pdf/renderer'
import { QuotationPDF } from '@/lib/pdf-templates/quotation-pdf'
import { QuotationPDFEnhanced, PDFMode } from '@/lib/pdf-templates/quotation-pdf-enhanced'
import { getSalesExecutiveId } from '@/lib/sales-executive'

// GET /api/quotations/[id]/download - Download quotation as PDF
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

    if (!canViewQuotations(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view quotations' },
        { status: 403 }
      )
    }

    // Get PDF mode from query parameter (default: plain-model)
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get('mode') || 'plain-model') as PDFMode

    // Fetch quotation with all related data including creator
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        lead: {
          select: {
            name: true,
            phone: true,
          },
        },
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

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Calculate total
    const total = quotation.items.reduce((sum, item) => sum + Number(item.total), 0)

    // Get sales executive ID from creator name
    const salesExecutiveId = getSalesExecutiveId(quotation.createdBy?.name)

    // Prepare data for PDF template
    const quotationData = {
      id: quotation.id,
      quotationNumber: `Q-${quotation.id.substring(0, 8).toUpperCase()}`,
      createdAt: quotation.createdAt.toISOString(),
      validUntil: quotation.validUntil ? quotation.validUntil.toISOString() : null,
      client: quotation.client,
      lead: quotation.lead,
      items: quotation.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      total,
      notes: quotation.notes,
      status: quotation.status,
      createdBy: quotation.createdBy,
      salesExecutiveId,
    }

    // Generate PDF stream using enhanced template
    let stream
    try {
      stream = await renderToStream(<QuotationPDFEnhanced quotation={quotationData} mode={mode} />)
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

    // Return PDF as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation-${quotationData.quotationNumber}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('GET /api/quotations/[id]/download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
