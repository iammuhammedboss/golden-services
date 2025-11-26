import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/room-types/[id] - Get single room type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomType = await prisma.roomTypeMaster.findUnique({
      where: { id: params.id },
    })

    if (!roomType || roomType.deletedAt) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    return NextResponse.json(roomType)
  } catch (error) {
    console.error('GET /api/masters/room-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/room-types/[id] - Update room type (OWNER only)
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

    const existingRoomType = await prisma.roomTypeMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingRoomType || existingRoomType.deletedAt) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isActive, sortOrder } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingRoomType.name) {
      const duplicate = await prisma.roomTypeMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Room type with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const roomType = await prisma.roomTypeMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'RoomTypeMaster',
      entityId: roomType.id,
      oldValues: existingRoomType,
      newValues: roomType,
    })

    return NextResponse.json(roomType)
  } catch (error) {
    console.error('PATCH /api/masters/room-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/room-types/[id] - Soft delete room type (OWNER only)
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

    const roomType = await prisma.roomTypeMaster.findUnique({
      where: { id: params.id },
    })

    if (!roomType || roomType.deletedAt) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.roomTypeMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('RoomTypeMaster', params.id, user.id, roomType)

    return NextResponse.json({ message: 'Room type deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/room-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
