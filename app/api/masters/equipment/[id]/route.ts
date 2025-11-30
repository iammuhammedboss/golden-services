import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/equipment/[id] - Get single equipment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const equipment = await prisma.equipmentMaster.findUnique({
      where: { id: params.id },
    })

    if (!equipment || equipment.deletedAt) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('GET /api/masters/equipment/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/equipment/[id] - Update equipment (OWNER only)
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

    const existingEquipment = await prisma.equipmentMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingEquipment || existingEquipment.deletedAt) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isActive } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingEquipment.name) {
      const duplicate = await prisma.equipmentMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Equipment with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const equipment = await prisma.equipmentMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'EquipmentMaster',
      entityId: equipment.id,
      oldValues: existingEquipment,
      newValues: equipment,
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('PATCH /api/masters/equipment/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/equipment/[id] - Soft delete equipment (OWNER only)
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

    const equipment = await prisma.equipmentMaster.findUnique({
      where: { id: params.id },
    })

    if (!equipment || equipment.deletedAt) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.equipmentMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('EquipmentMaster', params.id, user.id, equipment)

    return NextResponse.json({ message: 'Equipment deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/equipment/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
