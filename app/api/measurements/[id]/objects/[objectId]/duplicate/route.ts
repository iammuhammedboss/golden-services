import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { duplicateObjectTree } from '@/lib/measurement-nesting'

/**
 * POST /api/measurements/[id]/objects/[objectId]/duplicate
 * Duplicate a measurement object node (and optionally its entire subtree)
 */
export async function POST(
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
    const { includeChildren = true } = body

    // Verify object exists and belongs to this measurement
    const existingObject = await prisma.measurementObject.findFirst({
      where: {
        id: params.objectId,
        measurementId: params.id,
        deletedAt: null,
      },
      select: {
        id: true,
        parentObjectId: true,
        type: true,
        name: true,
        itemMasterId: true,
        sizeMode: true,
        size: true,
        dimensionLength: true,
        dimensionWidth: true,
        dimensionHeight: true,
        dimensionUnit: true,
        dirtLevel: true,
        quantity: true,
        notes: true,
        remarks: true,
        sortOrder: true,
      },
    })

    if (!existingObject) {
      return NextResponse.json(
        { error: 'Measurement object not found' },
        { status: 404 }
      )
    }

    let duplicatedObject

    if (includeChildren) {
      // Duplicate the entire subtree
      duplicatedObject = await duplicateObjectTree(
        params.objectId,
        params.id,
        existingObject.parentObjectId
      )
    } else {
      // Duplicate only the single node without children
      duplicatedObject = await prisma.measurementObject.create({
        data: {
          measurementId: params.id,
          parentObjectId: existingObject.parentObjectId,
          type: existingObject.type,
          name: `${existingObject.name} (Copy)`,
          itemMasterId: existingObject.itemMasterId,
          sizeMode: existingObject.sizeMode,
          size: existingObject.size,
          dimensionLength: existingObject.dimensionLength,
          dimensionWidth: existingObject.dimensionWidth,
          dimensionHeight: existingObject.dimensionHeight,
          dimensionUnit: existingObject.dimensionUnit,
          dirtLevel: existingObject.dirtLevel,
          quantity: existingObject.quantity,
          notes: existingObject.notes,
          remarks: existingObject.remarks,
          sortOrder: existingObject.sortOrder,
        },
        include: {
          itemMaster: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          stains: true,
          areasOfNotice: true,
          media: true,
        },
      })
    }

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'MeasurementObject',
      entityId: duplicatedObject.id,
      newValues: {
        ...duplicatedObject,
        duplicatedFrom: params.objectId,
        includeChildren,
      },
    })

    return NextResponse.json(duplicatedObject, { status: 201 })
  } catch (error) {
    console.error(`Error duplicating measurement object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to duplicate measurement object' },
      { status: 500 }
    )
  }
}
