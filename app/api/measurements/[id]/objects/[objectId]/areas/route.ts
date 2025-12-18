import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

/**
 * GET /api/measurements/[id]/objects/[objectId]/areas
 * List all areas of notice for a measurement object
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

    // Fetch all areas of notice for this object
    const areas = await prisma.measurementAreaOfNotice.findMany({
      where: {
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(areas)
  } catch (error) {
    console.error(`Error fetching areas of notice for object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch areas of notice' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/measurements/[id]/objects/[objectId]/areas
 * Add a new area of notice to a measurement object
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

    // Create the area of notice
    const area = await prisma.measurementAreaOfNotice.create({
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
      entityType: 'MeasurementAreaOfNotice',
      entityId: area.id,
      newValues: area,
    })

    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    console.error(`Error creating area of notice for object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to create area of notice' },
      { status: 500 }
    )
  }
}
