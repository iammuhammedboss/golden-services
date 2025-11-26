import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/payment-methods/[id] - Get single payment method
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentMethod = await prisma.paymentMethodMaster.findUnique({
      where: { id: params.id },
    })

    if (!paymentMethod || paymentMethod.deletedAt) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('GET /api/masters/payment-methods/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/payment-methods/[id] - Update payment method (OWNER only)
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

    if (!canManageMasters(user)) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 })
    }

    const existingPaymentMethod = await prisma.paymentMethodMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingPaymentMethod || existingPaymentMethod.deletedAt) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isActive, sortOrder } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingPaymentMethod.name) {
      const duplicate = await prisma.paymentMethodMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Payment method with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const paymentMethod = await prisma.paymentMethodMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'PaymentMethodMaster',
      entityId: paymentMethod.id,
      oldValues: existingPaymentMethod,
      newValues: paymentMethod,
    })

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('PATCH /api/masters/payment-methods/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/payment-methods/[id] - Soft delete payment method (OWNER only)
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

    if (!canManageMasters(user)) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 })
    }

    const paymentMethod = await prisma.paymentMethodMaster.findUnique({
      where: { id: params.id },
    })

    if (!paymentMethod || paymentMethod.deletedAt) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.paymentMethodMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('PaymentMethodMaster', params.id, user.id, paymentMethod)

    return NextResponse.json({ message: 'Payment method deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/payment-methods/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
