import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
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
    if (!canManageLeads(user)) {
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

    if (clientId) {
      where.clientId = clientId
    }

    if (siteId) {
      where.siteId = siteId
    }

    if (siteVisitId) {
      where.siteVisitId = siteVisitId
    }

    const measurements = await prisma.measurement.findMany({
      where,
      include: {
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
        siteVisit: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          }
        },
        objects: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
            itemMaster: {
              select: {
                id: true,
                name: true,
                category: true,
              }
            }
          }
        },
        _count: {
          select: {
            objects: { where: { deletedAt: null } },
            photos: { where: { deletedAt: null } },
          }
        }
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
  if (!canManageLeads(user)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions to create measurements' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { 
      clientId,
      siteId,
      siteVisitId,
      title,
      notes,
      status = 'DRAFT',
      objects = []
    } = body

    if (!clientId || !title) {
      return NextResponse.json(
        { error: 'Client ID and title are required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId, deletedAt: null },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify site if provided
    if (siteId) {
      const site = await prisma.site.findUnique({
        where: { id: siteId, deletedAt: null },
      })

      if (!site) {
        return NextResponse.json(
          { error: 'Site not found' },
          { status: 404 }
        )
      }
    }

    // Verify site visit if provided
    if (siteVisitId) {
      const siteVisit = await prisma.siteVisit.findUnique({
        where: { id: siteVisitId, deletedAt: null },
      })

      if (!siteVisit) {
        return NextResponse.json(
          { error: 'Site visit not found' },
          { status: 404 }
        )
      }
    }

    // Create measurement
    const measurement = await prisma.measurement.create({
      data: {
        clientId,
        siteId: siteId || null,
        siteVisitId: siteVisitId || null,
        title,
        notes: notes || null,
        status,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Measurement',
      entityId: measurement.id,
      newValues: measurement,
    })

    // Create objects if provided
    if (objects.length > 0) {
      // This is a simplified implementation - in production, you'd need to handle nested objects properly
      const createdObjects = await Promise.all(
        objects.map((obj: any) =>
          prisma.measurementObject.create({
            data: {
              measurementId: measurement.id,
              parentObjectId: obj.parentObjectId || null,
              type: obj.type || 'CUSTOM',
              name: obj.name,
              itemMasterId: obj.itemMasterId || null,
              size: obj.size || null,
              dirtLevel: obj.dirtLevel || null,
              quantity: obj.quantity || 1,
              notes: obj.notes || null,
              sortOrder: obj.sortOrder || 0,
            },
          })
        )
      )

      // Create audit logs for objects
      await Promise.all(
        createdObjects.map(obj =>
          createAuditLog({
            userId: user.id,
            action: 'CREATE',
            entityType: 'MeasurementObject',
            entityId: obj.id,
            newValues: obj,
          })
        )
      )
    }

    // Create notification for relevant roles
    await prisma.notification.create({
      data: {
        recipientRole: 'OPERATIONS_MANAGER',
        title: 'New Measurement Created',
        message: `New measurement "${title}" was created for client ${client.name}`,
        entityType: 'Measurement',
        entityId: measurement.id,
      },
    })

    return NextResponse.json({ 
      measurement,
      message: 'Measurement created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}
