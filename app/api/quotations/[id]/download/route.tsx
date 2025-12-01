import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewQuotations } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { renderToStream } from '@react-pdf/renderer'
import { QuotationPDF } from '@/lib/pdf-templates/quotation-pdf'

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

    // Fetch quotation with all related data
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
        site: {
          select: {
            name: true,
            address: true,
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

    // Prepare data for PDF template
    const quotationData = {
      id: quotation.id,
      quotationNumber: `Q-${quotation.id.substring(0, 8).toUpperCase()}`,
      createdAt: quotation.createdAt.toISOString(),
      validUntil: quotation.validUntil ? quotation.validUntil.toISOString() : null,
      client: quotation.client,
      lead: quotation.lead,
      site: quotation.site,
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
    }

    // Generate PDF stream
    const stream = await renderToStream(<QuotationPDF quotation={quotationData} />)

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
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
