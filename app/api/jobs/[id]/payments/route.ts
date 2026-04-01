import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canCollectPayments } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { Decimal } from '@prisma/client/runtime/library'
import { emitEvent } from '@/lib/events/emit'

// GET /api/jobs/[id]/payments - List payments for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payments = await prisma.payment.findMany({
      where: { jobOrderId: params.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        recordedBy: { select: { name: true } },
        creditApprovedBy: { select: { name: true } },
      },
    })

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    return NextResponse.json({ payments, totalPaid })
  } catch (error) {
    console.error(`GET /api/jobs/${params.id}/payments error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/jobs/[id]/payments - Record a payment (supports partial)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canCollectPayments(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { amount, paymentMethod, paymentSubOption, referenceNumber, receiptUrl, notes, invoiceId } = body

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'amount and paymentMethod are required' },
        { status: 400 }
      )
    }

    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id, deletedAt: null },
      select: { id: true, jobNumber: true, clientId: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Find or use provided invoice
    let targetInvoiceId = invoiceId
    if (!targetInvoiceId) {
      // Try to find an existing invoice for this job
      const invoice = await prisma.invoice.findFirst({
        where: { jobOrderId: params.id, deletedAt: null },
        select: { id: true },
      })
      targetInvoiceId = invoice?.id
    }

    if (!targetInvoiceId) {
      return NextResponse.json(
        { error: 'No invoice found for this job. Create an invoice first.' },
        { status: 400 }
      )
    }

    const isCredit = paymentMethod === 'CREDIT'

    const payment = await prisma.payment.create({
      data: {
        invoiceId: targetInvoiceId,
        clientId: job.clientId,
        jobOrderId: params.id,
        amount: new Decimal(amount),
        paymentMethod,
        paymentSubOption: paymentSubOption || null,
        referenceNumber: referenceNumber || null,
        receiptUrl: receiptUrl || null,
        creditStatus: isCredit ? 'PENDING_APPROVAL' : null,
        notes: notes || null,
        recordedById: (user as any).id,
      },
      include: {
        recordedBy: { select: { name: true } },
      },
    })

    // Update job payment status
    const allPayments = await prisma.payment.findMany({
      where: { jobOrderId: params.id, deletedAt: null },
    })
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Get job's expected total from quotation
    const jobWithQuote = await prisma.jobOrder.findUnique({
      where: { id: params.id },
      include: {
        quotation: {
          include: { items: { where: { deletedAt: null } } },
        },
      },
    })
    const quotationTotal = jobWithQuote?.quotation?.items.reduce(
      (sum, item) => sum + Number(item.total), 0
    ) || 0
    const expectedTotal = quotationTotal || Number(jobWithQuote?.amount || 0)

    let newPaymentStatus = 'UNPAID'
    if (totalPaid >= expectedTotal && expectedTotal > 0) {
      newPaymentStatus = 'PAID'
    } else if (totalPaid > 0) {
      newPaymentStatus = 'PARTIALLY_PAID'
    }

    await prisma.jobOrder.update({
      where: { id: params.id },
      data: { paymentStatus: newPaymentStatus as any },
    })

    // Audit log
    await createAuditLog({
      userId: (user as any).id,
      action: 'CREATE',
      entityType: 'payment',
      entityId: payment.id,
      newValues: {
        jobNumber: job.jobNumber,
        amount: Number(amount),
        paymentMethod,
        paymentSubOption,
        isCredit,
      },
    })

    // Emit real-time event
    emitEvent({
      type: 'PAYMENT_RECEIVED',
      paymentId: payment.id,
      invoiceId: targetInvoiceId,
      clientName: '',
      amount: amount.toString(),
      jobId: params.id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, payment, paymentStatus: newPaymentStatus })
  } catch (error) {
    console.error(`POST /api/jobs/${params.id}/payments error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
