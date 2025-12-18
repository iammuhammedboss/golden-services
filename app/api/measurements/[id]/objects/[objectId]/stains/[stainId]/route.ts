import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

/**
 * DELETE /api/measurements/[id]/objects/[objectId]/stains/[stainId]
 * Delete a stain from a measurement object
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; stainId: string } }
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
    // Verify stain exists and belongs to this object
    const stain = await prisma.measurementStain.findFirst({
      where: {
        id: params.stainId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!stain) {
      return NextResponse.json(
        { error: 'Stain not found' },
        { status: 404 }
      )
    }

    // Soft delete the stain
    const deletedStain = await prisma.measurementStain.update({
      where: { id: params.stainId },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'MeasurementStain',
      entityId: deletedStain.id,
      oldValues: stain,
      newValues: deletedStain,
    })

    return NextResponse.json({
      message: 'Stain deleted successfully',
    })
  } catch (error) {
    console.error(`Error deleting stain ${params.stainId}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete stain' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/measurements/[id]/objects/[objectId]/stains/[stainId]
 * Update a stain
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; stainId: string } }
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

    // Verify stain exists and belongs to this object
    const existingStain = await prisma.measurementStain.findFirst({
      where: {
        id: params.stainId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!existingStain) {
      return NextResponse.json(
        { error: 'Stain not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (notes !== undefined) updateData.notes = notes
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl

    // Update the stain
    const updatedStain = await prisma.measurementStain.update({
      where: { id: params.stainId },
      data: updateData,
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MeasurementStain',
      entityId: updatedStain.id,
      oldValues: existingStain,
      newValues: updatedStain,
    })

    return NextResponse.json(updatedStain)
  } catch (error) {
    console.error(`Error updating stain ${params.stainId}:`, error)
    return NextResponse.json(
      { error: 'Failed to update stain' },
      { status: 500 }
    )
  }
}
