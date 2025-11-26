import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/window-sizes/[id] - Get single window size
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const windowSize = await prisma.windowSizeMaster.findUnique({
      where: { id: params.id },
    })

    if (!windowSize || windowSize.deletedAt) {
      return NextResponse.json({ error: 'Window size not found' }, { status: 404 })
    }

    return NextResponse.json(windowSize)
  } catch (error) {
    console.error('GET /api/masters/window-sizes/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/window-sizes/[id] - Update window size (OWNER only)
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

    const existingWindowSize = await prisma.windowSizeMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingWindowSize || existingWindowSize.deletedAt) {
      return NextResponse.json({ error: 'Window size not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isActive, sortOrder } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingWindowSize.name) {
      const duplicate = await prisma.windowSizeMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Window size with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const windowSize = await prisma.windowSizeMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'WindowSizeMaster',
      entityId: windowSize.id,
      oldValues: existingWindowSize,
      newValues: windowSize,
    })

    return NextResponse.json(windowSize)
  } catch (error) {
    console.error('PATCH /api/masters/window-sizes/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/window-sizes/[id] - Soft delete window size (OWNER only)
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

    const windowSize = await prisma.windowSizeMaster.findUnique({
      where: { id: params.id },
    })

    if (!windowSize || windowSize.deletedAt) {
      return NextResponse.json({ error: 'Window size not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.windowSizeMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('WindowSizeMaster', params.id, user.id, windowSize)

    return NextResponse.json({ message: 'Window size deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/window-sizes/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
