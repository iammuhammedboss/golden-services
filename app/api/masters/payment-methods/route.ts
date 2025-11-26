import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/payment-methods - List all payment methods (including deleted if requested)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyActive = searchParams.get('onlyActive') === 'true'

    const where: any = {}

    if (!includeDeleted) {
      where.deletedAt = null
    }

    if (onlyActive) {
      where.isActive = true
    }

    const paymentMethods = await prisma.paymentMethodMaster.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('GET /api/masters/payment-methods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/masters/payment-methods - Create new payment method (OWNER only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageMasters(user)) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, isActive, sortOrder } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.paymentMethodMaster.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Payment method with this name already exists' },
        { status: 409 }
      )
    }

    const paymentMethod = await prisma.paymentMethodMaster.create({
      data: {
        name: name.toUpperCase(),
        description,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'PaymentMethodMaster',
      entityId: paymentMethod.id,
      newValues: paymentMethod,
    })

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('POST /api/masters/payment-methods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
