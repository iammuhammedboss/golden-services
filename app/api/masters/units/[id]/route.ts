import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/units/[id] - Get single unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unit = await prisma.unitMaster.findUnique({
      where: { id: params.id },
    })

    if (!unit || unit.deletedAt) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error('GET /api/masters/units/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/units/[id] - Update unit (OWNER only)
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

    const existingUnit = await prisma.unitMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingUnit || existingUnit.deletedAt) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isActive } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingUnit.name) {
      const duplicate = await prisma.unitMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Unit with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const unit = await prisma.unitMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'UnitMaster',
      entityId: unit.id,
      oldValues: existingUnit,
      newValues: unit,
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('PATCH /api/masters/units/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/units/[id] - Soft delete unit (OWNER only)
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

    const unit = await prisma.unitMaster.findUnique({
      where: { id: params.id },
    })

    if (!unit || unit.deletedAt) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.unitMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('UnitMaster', params.id, user.id, unit)

    return NextResponse.json({ message: 'Unit deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/units/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
