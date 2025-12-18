import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

/**
 * GET /api/measurements/[id]/objects/[objectId]/media/[mediaId]
 * Get a specific media item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; mediaId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify media exists and belongs to this object
    const media = await prisma.measurementObjectMedia.findFirst({
      where: {
        id: params.mediaId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error(`Error fetching media ${params.mediaId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/measurements/[id]/objects/[objectId]/media/[mediaId]
 * Update a media item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; mediaId: string } }
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
    const { url, thumbnailUrl, duration, caption, sortOrder } = body

    // Verify media exists and belongs to this object
    const existingMedia = await prisma.measurementObjectMedia.findFirst({
      where: {
        id: params.mediaId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (url !== undefined) updateData.url = url
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (duration !== undefined) updateData.duration = duration
    if (caption !== undefined) updateData.caption = caption
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Update the media
    const updatedMedia = await prisma.measurementObjectMedia.update({
      where: { id: params.mediaId },
      data: updateData,
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MeasurementObjectMedia',
      entityId: updatedMedia.id,
      oldValues: existingMedia,
      newValues: updatedMedia,
    })

    return NextResponse.json(updatedMedia)
  } catch (error) {
    console.error(`Error updating media ${params.mediaId}:`, error)
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/measurements/[id]/objects/[objectId]/media/[mediaId]
 * Delete a media item from a measurement object
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; objectId: string; mediaId: string } }
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
    // Verify media exists and belongs to this object
    const media = await prisma.measurementObjectMedia.findFirst({
      where: {
        id: params.mediaId,
        measurementObjectId: params.objectId,
        deletedAt: null,
      },
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    // Soft delete the media
    const deletedMedia = await prisma.measurementObjectMedia.update({
      where: { id: params.mediaId },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'MeasurementObjectMedia',
      entityId: deletedMedia.id,
      oldValues: media,
      newValues: deletedMedia,
    })

    return NextResponse.json({
      message: 'Media deleted successfully',
    })
  } catch (error) {
    console.error(`Error deleting media ${params.mediaId}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}
