import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/item-types/[id] - Get single item type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemType = await prisma.itemTypeMaster.findUnique({
      where: { id: params.id },
    })

    if (!itemType || itemType.deletedAt) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 })
    }

    return NextResponse.json(itemType)
  } catch (error) {
    console.error('GET /api/masters/item-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/item-types/[id] - Update item type (OWNER only)
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

    const existingItemType = await prisma.itemTypeMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingItemType || existingItemType.deletedAt) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, category, description, isActive, sortOrder } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingItemType.name) {
      const duplicate = await prisma.itemTypeMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Item type with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.toUpperCase()
    if (category !== undefined) updateData.category = category.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const itemType = await prisma.itemTypeMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'ItemTypeMaster',
      entityId: itemType.id,
      oldValues: existingItemType,
      newValues: itemType,
    })

    return NextResponse.json(itemType)
  } catch (error) {
    console.error('PATCH /api/masters/item-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/item-types/[id] - Soft delete item type (OWNER only)
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

    const itemType = await prisma.itemTypeMaster.findUnique({
      where: { id: params.id },
    })

    if (!itemType || itemType.deletedAt) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.itemTypeMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('ItemTypeMaster', params.id, user.id, itemType)

    return NextResponse.json({ message: 'Item type deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/item-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
