import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/jobs/[id]/adjustments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const adjustments = await prisma.jobAdjustment.findMany({
      where: { jobOrderId: params.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
      },
    })

    // Calculate totals
    const additions = adjustments
      .filter((a) => a.type === 'ADDITION')
      .reduce((sum, a) => sum + Number(a.total), 0)
    const deductions = adjustments
      .filter((a) => a.type === 'DEDUCTION')
      .reduce((sum, a) => sum + Number(a.total), 0)

    return NextResponse.json({
      adjustments,
      summary: { additions, deductions, net: additions - deductions },
    })
  } catch (error) {
    console.error(`GET /api/jobs/${params.id}/adjustments error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/jobs/[id]/adjustments - Add or deduct item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any

  try {
    const body = await request.json()
    const { type, description, quantity, unitPrice, reason } = body

    if (!type || !description || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'type, description, and unitPrice are required' },
        { status: 400 }
      )
    }

    if (type === 'DEDUCTION' && !reason) {
      return NextResponse.json(
        { error: 'Reason is required for deductions' },
        { status: 400 }
      )
    }

    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id, deletedAt: null },
      select: { id: true, jobNumber: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const qty = new Decimal(quantity || 1)
    const price = new Decimal(unitPrice)
    const total = qty.times(price)

    const adjustment = await prisma.jobAdjustment.create({
      data: {
        jobOrderId: params.id,
        type,
        description: description.trim(),
        quantity: qty,
        unitPrice: price,
        total,
        reason: reason || null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    })

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'job_adjustment',
      entityId: adjustment.id,
      newValues: {
        jobNumber: job.jobNumber,
        type,
        description,
        quantity: qty.toNumber(),
        unitPrice: price.toNumber(),
        total: total.toNumber(),
        reason,
      },
    })

    return NextResponse.json({ success: true, adjustment })
  } catch (error) {
    console.error(`POST /api/jobs/${params.id}/adjustments error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
