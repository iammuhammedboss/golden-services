import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

export async function GET(
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
    const siteVisit = await prisma.siteVisit.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: true,
      },
    })

    if (!siteVisit) {
      return NextResponse.json({ error: 'Site visit not found' }, { status: 404 })
    }

    return NextResponse.json(siteVisit)
  } catch (error) {
    console.error('Error fetching site visit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site visit' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
      scheduledAt,
      assignedToId,
      status,
      requiredService,
      locationText,
      googleMapsUrl,
      siteContactName,
      siteContactPhone,
      notes,
      remarks,
    } = body

    // Get the current site visit to track old values
    const oldSiteVisit = await prisma.siteVisit.findUnique({
      where: { id: params.id },
    })

    if (!oldSiteVisit) {
      return NextResponse.json({ error: 'Site visit not found' }, { status: 404 })
    }

    // Prepare data for update
    const updateData: any = {}

    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt)
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (requiredService !== undefined) updateData.requiredService = requiredService
    if (locationText !== undefined) updateData.locationText = locationText
    if (googleMapsUrl !== undefined) updateData.googleMapsUrl = googleMapsUrl
    if (siteContactName !== undefined) updateData.siteContactName = siteContactName
    if (siteContactPhone !== undefined) updateData.siteContactPhone = siteContactPhone
    if (notes !== undefined) updateData.notes = notes
    if (remarks !== undefined) updateData.remarks = remarks

    // Handle status updates with timestamps
    if (status !== undefined && status !== oldSiteVisit.status) {
      updateData.status = status

      if (status === 'IN_PROGRESS' && !oldSiteVisit.startedAt) {
        updateData.startedAt = new Date()
      }

      if (status === 'COMPLETED' && !oldSiteVisit.completedAt) {
        updateData.completedAt = new Date()
      }
    }

    const updatedSiteVisit = await prisma.siteVisit.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SiteVisit',
      entityId: params.id,
      oldValues: oldSiteVisit,
      newValues: updatedSiteVisit,
    })

    return NextResponse.json(updatedSiteVisit)
  } catch (error) {
    console.error('Error updating site visit:', error)
    return NextResponse.json(
      { error: 'Failed to update site visit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const siteVisit = await prisma.siteVisit.findUnique({
      where: { id: params.id },
    })

    if (!siteVisit) {
      return NextResponse.json({ error: 'Site visit not found' }, { status: 404 })
    }

    // Soft delete
    await prisma.siteVisit.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'SiteVisit',
      entityId: params.id,
      oldValues: siteVisit,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting site visit:', error)
    return NextResponse.json(
      { error: 'Failed to delete site visit' },
      { status: 500 }
    )
  }
}
