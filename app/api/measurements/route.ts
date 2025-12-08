import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageMeasurements } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles
    
    // Check permissions
    if (!canManageMeasurements(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view measurements' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const siteId = searchParams.get('siteId')
    const siteVisitId = searchParams.get('siteVisitId')

    const where: any = {
      deletedAt: null,
    }

    if (siteVisitId) {
      where.siteVisitId = siteVisitId
    }

    const measurements = await prisma.measurementItem.findMany({
      where,
      include: {
        siteVisit: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            clientId: true,
            siteId: true,
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            },
            site: {
              select: {
                id: true,
                name: true,
                address: true,
              }
            },
          }
        },
        itemType: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(measurements)
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles

  // Check permissions
  if (!canManageMeasurements(user)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions to create measurements' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      siteVisitId,
      measurements = []
    } = body

    if (!siteVisitId) {
      return NextResponse.json(
        { error: 'Site visit ID is required' },
        { status: 400 }
      )
    }

    // Verify site visit exists
    const siteVisit = await prisma.siteVisit.findUnique({
      where: { id: siteVisitId, deletedAt: null },
    })

    if (!siteVisit) {
      return NextResponse.json(
        { error: 'Site visit not found' },
        { status: 404 }
      )
    }

    // Create measurement items
    const createdMeasurements = await Promise.all(
      measurements.map((item: any) =>
        prisma.measurementItem.create({
          data: {
            siteVisitId,
            itemTypeId: item.itemTypeId,
            roomTypeId: item.roomTypeId || null,
            quantity: item.quantity || 1,
            size: item.size || null,
            customDescription: item.customDescription || null,
            notes: item.notes || null,
          },
        })
      )
    );

    // Create audit logs
    await Promise.all(
      createdMeasurements.map(item =>
        createAuditLog({
          userId: user.id,
          action: 'CREATE',
          entityType: 'MeasurementItem',
          entityId: item.id,
          newValues: item,
        }) as any
      )
    );

    // TODO: Create notification for relevant roles when notification system is implemented

    return NextResponse.json({
      measurements: createdMeasurements,
      message: 'Measurements created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}
