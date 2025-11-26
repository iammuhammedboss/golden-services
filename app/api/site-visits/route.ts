import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/site-visits - List all site visits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const siteVisits = await prisma.siteVisit.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      include: {
        lead: {
          select: {
            name: true,
            phone: true,
          },
        },
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        site: {
          select: {
            name: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ siteVisits })
  } catch (error) {
    console.error('Error fetching site visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site visits' },
      { status: 500 }
    )
  }
}

// POST /api/site-visits - Create new site visit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const body = await request.json()
    const { clientId, siteId, scheduledAt, visitType, assignedToId, notes } = body

    // Validation
    if (!clientId || !siteId || !scheduledAt || !assignedToId) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, siteId, scheduledAt, assignedToId' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify site exists and belongs to client
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    })

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    if (site.clientId !== clientId) {
      return NextResponse.json(
        { error: 'Site does not belong to the selected client' },
        { status: 400 }
      )
    }

    // Verify assigned user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
    })

    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      )
    }

    // Create site visit
    const siteVisit = await prisma.siteVisit.create({
      data: {
        clientId,
        siteId,
        scheduledAt: new Date(scheduledAt),
        visitType: visitType || 'FULL_HOUSE',
        assignedToId,
        notes: notes || null,
        status: 'SCHEDULED',
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        site: {
          select: {
            name: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'SiteVisit',
        entityId: siteVisit.id,
        userId,
        newValues: JSON.stringify(siteVisit),
      },
    })

    return NextResponse.json(
      {
        message: 'Site visit created successfully',
        siteVisit,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating site visit:', error)
    return NextResponse.json(
      { error: 'Failed to create site visit' },
      { status: 500 }
    )
  }
}
