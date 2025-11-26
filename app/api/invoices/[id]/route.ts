import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewInvoices, canManageInvoices } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/invoices/[id] - Get single invoice
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
            whatsapp: true,
            email: true,
            type: true,
          },
        },
        jobOrder: {
          select: {
            jobNumber: true,
            scheduledDate: true,
          },
        },
        quotation: {
          select: {
            id: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
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

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/invoices/[id] - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, dueDate, notes, items } = body

    // Update invoice
    const updateData: any = {}
    if (status) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (notes !== undefined) updateData.notes = notes

    // If items are provided, recalculate totals
    if (items) {
      const subtotal = items.reduce(
        (sum: number, item: any) =>
          sum + parseFloat(item.quantity) * parseFloat(item.unitPrice),
        0
      )
      const tax = subtotal * 0.0
      const total = subtotal + tax

      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.total = total

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })

      updateData.items = {
        create: items.map((item: any) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        })),
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('PATCH /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageInvoices(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Don't allow deletion of PAID invoices
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoices' },
        { status: 400 }
      )
    }

    // Delete invoice (items will be cascade deleted)
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
