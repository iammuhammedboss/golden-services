import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

/**
 * DELETE /api/measurements/[id]/objects/[objectId]/areas/[areaId]
 * Delete an area of notice from a measurement object
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; areaId: string } }
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
    // Verify area exists and belongs to this object
    const area = await prisma.measurementAreaOfNotice.findFirst({
      where: {
        id: params.areaId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!area) {
      return NextResponse.json(
        { error: 'Area of notice not found' },
        { status: 404 }
      )
    }

    // Soft delete the area
    const deletedArea = await prisma.measurementAreaOfNotice.update({
      where: { id: params.areaId },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'MeasurementAreaOfNotice',
      entityId: deletedArea.id,
      oldValues: area,
      newValues: deletedArea,
    })

    return NextResponse.json({
      message: 'Area of notice deleted successfully',
    })
  } catch (error) {
    console.error(`Error deleting area of notice ${params.areaId}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete area of notice' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/measurements/[id]/objects/[objectId]/areas/[areaId]
 * Update an area of notice
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; areaId: string } }
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
    const { description, notes, photoUrl } = body

    // Verify area exists and belongs to this object
    const existingArea = await prisma.measurementAreaOfNotice.findFirst({
      where: {
        id: params.areaId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!existingArea) {
      return NextResponse.json(
        { error: 'Area of notice not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (notes !== undefined) updateData.notes = notes
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl

    // Update the area
    const updatedArea = await prisma.measurementAreaOfNotice.update({
      where: { id: params.areaId },
      data: updateData,
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MeasurementAreaOfNotice',
      entityId: updatedArea.id,
      oldValues: existingArea,
      newValues: updatedArea,
    })

    return NextResponse.json(updatedArea)
  } catch (error) {
    console.error(`Error updating area of notice ${params.areaId}:`, error)
    return NextResponse.json(
      { error: 'Failed to update area of notice' },
      { status: 500 }
    )
  }
}
