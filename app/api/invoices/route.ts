import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewInvoices, canManageInvoices } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canViewInvoices(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: any = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        jobOrder: {
          select: {
            jobNumber: true,
          },
        },
        quotation: {
          select: {
            id: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageInvoices(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, jobOrderId, quotationId, dueDate, items, notes, status } = body

    // Validate required fields
    if (!clientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Client and items are required' },
        { status: 400 }
      )
    }

    // Generate invoice number (INV-YYYYMMDD-XXX format)
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${dateStr}`,
        },
      },
    })
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(3, '0')}`

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) =>
        sum + parseFloat(item.quantity) * parseFloat(item.unitPrice),
      0
    )
    const tax = subtotal * 0.0 // 0% tax for now, can be adjusted
    const total = subtotal + tax

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        jobOrderId,
        quotationId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'DRAFT',
        subtotal,
        tax,
        total,
        notes,
        createdById: user.id!,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
          })),
        },
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
