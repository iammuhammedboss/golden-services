import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManagePayments } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/payments - List all payments with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManagePayments(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view payments' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const clientId = searchParams.get('clientId')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      deletedAt: null,
    }

    if (invoiceId) where.invoiceId = invoiceId
    if (clientId) where.clientId = clientId
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) where.paymentDate.gte = new Date(startDate)
      if (endDate) where.paymentDate.lte = new Date(endDate)
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
          client: {
            select: {
              name: true,
              phone: true,
            },
          },
          recordedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('GET /api/payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payments - Record new payment (OWNER, ACCOUNTANT)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManagePayments(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to record payments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { invoiceId, amount, paymentMethod, paymentDate, referenceNumber } = body

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Invoice ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    // Get invoice and client details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: {
            deletedAt: null,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate total paid so far
    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    )

    // Validate payment amount
    const newTotalPaid = totalPaid + parseFloat(amount)
    const invoiceTotal = Number(invoice.total)

    if (newTotalPaid > invoiceTotal) {
      return NextResponse.json(
        {
          error: `Payment amount exceeds invoice balance. Balance remaining: ${(
            invoiceTotal - totalPaid
          ).toFixed(3)} AED`,
        },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        clientId: invoice.clientId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        referenceNumber,
        recordedById: user.id,
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    })

    // Update invoice status based on total payments
    let newInvoiceStatus = invoice.status

    if (newTotalPaid >= invoiceTotal) {
      newInvoiceStatus = 'PAID'
    } else if (newTotalPaid > 0 && newTotalPaid < invoiceTotal) {
      newInvoiceStatus = 'PARTIALLY_PAID'
    }

    // Update invoice if status changed
    if (newInvoiceStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newInvoiceStatus },
      })
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Payment',
      entityId: payment.id,
      newValues: payment,
    })

    return NextResponse.json(
      {
        payment,
        invoiceStatus: newInvoiceStatus,
        totalPaid: newTotalPaid,
        balanceRemaining: invoiceTotal - newTotalPaid,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
