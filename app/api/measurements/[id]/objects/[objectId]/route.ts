import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { softDeleteObjectTree } from '@/lib/measurement-nesting'

/**
 * PUT /api/measurements/[id]/objects/[objectId]
 * Update a measurement object node
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      sizeMode,
      size,
      dimensionLength,
      dimensionWidth,
      dimensionHeight,
      dimensionUnit,
      dirtLevel,
      quantity,
      notes,
      remarks,
      sortOrder,
    } = body

    // Verify object exists and belongs to this measurement
    const existingObject = await prisma.measurementObject.findFirst({
      where: {
        id: params.objectId,
        measurementId: params.id,
        deletedAt: null,
      },
    })

    if (!existingObject) {
      return NextResponse.json(
        { error: 'Measurement object not found' },
        { status: 404 }
      )
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (sizeMode !== undefined) updateData.sizeMode = sizeMode
    if (size !== undefined) updateData.size = size
    if (dimensionLength !== undefined) updateData.dimensionLength = dimensionLength
    if (dimensionWidth !== undefined) updateData.dimensionWidth = dimensionWidth
    if (dimensionHeight !== undefined) updateData.dimensionHeight = dimensionHeight
    if (dimensionUnit !== undefined) updateData.dimensionUnit = dimensionUnit
    if (dirtLevel !== undefined) updateData.dirtLevel = dirtLevel
    if (quantity !== undefined) updateData.quantity = quantity
    if (notes !== undefined) updateData.notes = notes
    if (remarks !== undefined) updateData.remarks = remarks
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Update the object
    const updatedObject = await prisma.measurementObject.update({
      where: { id: params.objectId },
      data: updateData,
      include: {
        itemMaster: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        stains: {
          where: { deletedAt: null },
        },
        areasOfNotice: {
          where: { deletedAt: null },
        },
        media: {
          where: { deletedAt: null },
        },
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MeasurementObject',
      entityId: updatedObject.id,
      oldValues: existingObject,
      newValues: updatedObject,
    })

    return NextResponse.json(updatedObject)
  } catch (error) {
    console.error(`Error updating measurement object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to update measurement object' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/measurements/[id]/objects/[objectId]
 * Soft delete a measurement object node and all its children
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Verify object exists and belongs to this measurement
    const existingObject = await prisma.measurementObject.findFirst({
      where: {
        id: params.objectId,
        measurementId: params.id,
        deletedAt: null,
      },
    })

    if (!existingObject) {
      return NextResponse.json(
        { error: 'Measurement object not found' },
        { status: 404 }
      )
    }

    // Soft delete the object and all its children
    await softDeleteObjectTree(params.objectId, user.id)

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'MeasurementObject',
      entityId: params.objectId,
      oldValues: existingObject,
      newValues: { deletedAt: new Date(), deletedById: user.id },
    })

    return NextResponse.json({
      message: 'Measurement object and children deleted successfully',
    })
  } catch (error) {
    console.error(`Error deleting measurement object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete measurement object' },
      { status: 500 }
    )
  }
}
