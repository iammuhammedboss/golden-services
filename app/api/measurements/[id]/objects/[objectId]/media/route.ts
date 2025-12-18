import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { MediaType } from '@prisma/client'

/**
 * GET /api/measurements/[id]/objects/[objectId]/media
 * List all media (photos + videos) for a measurement object
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

    // Get filter from query params
    const searchParams = request.nextUrl.searchParams
    const typeFilter = searchParams.get('type') as MediaType | null

    // Fetch all media for this object
    const media = await prisma.measurementObjectMedia.findMany({
      where: {
        measurementObjectId: params.objectId,
        deletedAt: null,
        ...(typeFilter && { type: typeFilter }),
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error(`Error fetching media for object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/measurements/[id]/objects/[objectId]/media
 * Attach new media (photo or video) to a measurement object
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
    const {
      type,
      url,
      thumbnailUrl = null,
      duration = null,
      caption = null,
      sortOrder = 0,
    } = body

    // Validate required fields
    if (!type || !url) {
      return NextResponse.json(
        { error: 'type and url are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['PHOTO', 'VIDEO'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be either PHOTO or VIDEO' },
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

    // Create the media
    const media = await prisma.measurementObjectMedia.create({
      data: {
        measurementObjectId: params.objectId,
        type: type as MediaType,
        url,
        thumbnailUrl,
        duration,
        caption,
        sortOrder,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'MeasurementObjectMedia',
      entityId: media.id,
      newValues: media,
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error(`Error creating media for object ${params.objectId}:`, error)
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 }
    )
  }
}
