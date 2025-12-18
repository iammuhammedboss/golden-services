import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

/**
 * GET /api/measurements/[id]/objects/[objectId]/stains
 * List all stains for a measurement object
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify object exists and belongs to this measurement
    const measurementObject = await prisma.measurementObject.findFirst({
      where: {
        id: params.objectId,
        measurementId: params.id,
        deletedAt: null,
      },
    })

    if (!measurementObject) {
      return NextResponse.json(
        { error: 'Measurement object not found' },
        { status: 404 }
      )
    }

    // Fetch all stains for this object
    const stains = await prisma.measurementStain.findMany({
      where: {
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(stains)
  } catch (error) {
    console.error(`Error fetching stains for object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch stains' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/measurements/[id]/objects/[objectId]/stains
 * Add a new stain to a measurement object
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
    const { description, notes = null, photoUrl = null } = body

    // Validate required fields
    if (!description) {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      )
    }

    // Verify object exists and belongs to this measurement
    const measurementObject = await prisma.measurementObject.findFirst({
      where: {
        id: params.objectId,
        measurementId: params.id,
        deletedAt: null,
      },
    })

    if (!measurementObject) {
      return NextResponse.json(
        { error: 'Measurement object not found' },
        { status: 404 }
      )
    }

    // Create the stain
    const stain = await prisma.measurementStain.create({
      data: {
        measurementObjectId: params.objectId,
        description,
        notes,
        photoUrl,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'MeasurementStain',
      entityId: stain.id,
      newValues: stain,
    })

    return NextResponse.json(stain, { status: 201 })
  } catch (error) {
    console.error(`Error creating stain for object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to create stain' },
      { status: 500 }
    )
  }
}
