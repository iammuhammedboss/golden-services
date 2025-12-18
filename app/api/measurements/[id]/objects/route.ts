import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { validateNesting } from '@/lib/measurement-nesting'
import { MeasurementObjectType } from '@prisma/client'

/**
 * POST /api/measurements/[id]/objects
 * Add a new object node to the measurement tree
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      parentObjectId = null,
      type,
      name,
      itemMasterId = null,
      sizeMode = null,
      size = null,
      dimensionLength = null,
      dimensionWidth = null,
      dimensionHeight = null,
      dimensionUnit = null,
      dirtLevel = null,
      quantity = 1,
      notes = null,
      remarks = null,
      sortOrder = 0,
    } = body

    // Validate required fields
    if (!type || !name) {
      return NextResponse.json(
        { error: 'type and name are required' },
        { status: 400 }
      )
    }

    // Verify measurement exists
    const measurement = await prisma.measurement.findUnique({
      where: { id: params.id },
    })

    if (!measurement) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 })
    }

    // Validate nesting rules
    const nestingValidation = await validateNesting(
      itemMasterId,
      type as MeasurementObjectType,
      parentObjectId
    )

    if (!nestingValidation.valid) {
      return NextResponse.json(
        { error: nestingValidation.error },
        { status: 400 }
      )
    }

    // Create the object
    const measurementObject = await prisma.measurementObject.create({
      data: {
        measurementId: params.id,
        parentObjectId,
        type: type as MeasurementObjectType,
        name,
        itemMasterId,
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

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'MeasurementObject',
      entityId: measurementObject.id,
      newValues: measurementObject,
    })

    return NextResponse.json(measurementObject, { status: 201 })
  } catch (error) {
    console.error(`Error creating measurement object:`, error)
    return NextResponse.json(
      { error: 'Failed to create measurement object' },
      { status: 500 }
    )
  }
}
