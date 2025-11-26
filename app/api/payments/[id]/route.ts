import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManagePayments } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/payments/[id] - Get single payment
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

    if (!canManagePayments(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
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
    })

    if (!payment || payment.deletedAt) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('GET /api/payments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/payments/[id] - Update payment (OWNER, ACCOUNTANT)
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

    if (!canManagePayments(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: {
            payments: {
              where: {
                deletedAt: null,
                id: { not: params.id },
              },
            },
          },
        },
      },
    })

    if (!existingPayment || existingPayment.deletedAt) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, paymentMethod, paymentDate, referenceNumber } = body

    const updateData: any = {}
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (paymentDate !== undefined)
      updateData.paymentDate = new Date(paymentDate)
    if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber

    // If amount is being updated, validate it
    if (amount !== undefined) {
      const otherPaymentsTotal = existingPayment.invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      )
      const newTotalPaid = otherPaymentsTotal + parseFloat(amount)
      const invoiceTotal = Number(existingPayment.invoice.total)

      if (newTotalPaid > invoiceTotal) {
        return NextResponse.json(
          {
            error: `Payment amount exceeds invoice balance. Maximum allowed: ${(
              invoiceTotal - otherPaymentsTotal
            ).toFixed(3)} AED`,
          },
          { status: 400 }
        )
      }

      updateData.amount = parseFloat(amount)

      // Update invoice status based on new total
      let newInvoiceStatus = existingPayment.invoice.status

      if (newTotalPaid >= invoiceTotal) {
        newInvoiceStatus = 'PAID'
      } else if (newTotalPaid > 0 && newTotalPaid < invoiceTotal) {
        newInvoiceStatus = 'PARTIALLY_PAID'
      } else {
        newInvoiceStatus = 'SENT'
      }

      if (newInvoiceStatus !== existingPayment.invoice.status) {
        await prisma.invoice.update({
          where: { id: existingPayment.invoiceId },
          data: { status: newInvoiceStatus },
        })
      }
    }

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
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

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Payment',
      entityId: payment.id,
      oldValues: existingPayment,
      newValues: payment,
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('PATCH /api/payments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payments/[id] - Soft delete payment (OWNER, ACCOUNTANT)
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

    if (!canManagePayments(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: {
            payments: {
              where: {
                deletedAt: null,
                id: { not: params.id },
              },
            },
          },
        },
      },
    })

    if (!payment || payment.deletedAt) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Soft delete the payment
    const deleted = await prisma.payment.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Recalculate invoice status after deleting payment
    const remainingPaymentsTotal = payment.invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    const invoiceTotal = Number(payment.invoice.total)

    let newInvoiceStatus = payment.invoice.status

    if (remainingPaymentsTotal >= invoiceTotal) {
      newInvoiceStatus = 'PAID'
    } else if (remainingPaymentsTotal > 0 && remainingPaymentsTotal < invoiceTotal) {
      newInvoiceStatus = 'PARTIALLY_PAID'
    } else {
      newInvoiceStatus = 'SENT'
    }

    if (newInvoiceStatus !== payment.invoice.status) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: newInvoiceStatus },
      })
    }

    // Create deleted record snapshot
    await softDelete('Payment', params.id, user.id, payment)

    return NextResponse.json({
      message: 'Payment deleted successfully',
      data: deleted,
      invoiceStatus: newInvoiceStatus,
    })
  } catch (error) {
    console.error('DELETE /api/payments/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
