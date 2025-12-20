import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: any = {
      deletedAt: null,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    const siteVisits = await prisma.siteVisit.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })

    return NextResponse.json(siteVisits)
  } catch (error) {
    console.error('Error fetching site visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site visits' },
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
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      clientId,
      scheduledAt,
      assignedToId,
      requiredService,
      locationText,
      googleMapsUrl,
      siteContactName,
      siteContactPhone,
      notes,
      remarks,
    } = body

    if (!clientId || !scheduledAt || !assignedToId) {
      return NextResponse.json(
        { error: 'clientId, scheduledAt, and assignedToId are required' },
        { status: 400 }
      )
    }

    const newSiteVisit = await prisma.siteVisit.create({
      data: {
        clientId,
        scheduledAt: new Date(scheduledAt),
        assignedToId,
        requiredService,
        locationText,
        googleMapsUrl,
        siteContactName,
        siteContactPhone,
        notes,
        remarks,
        status: 'PENDING',
      },
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
      action: 'CREATE',
      entityType: 'SiteVisit',
      entityId: newSiteVisit.id,
      newValues: newSiteVisit,
    })

    return NextResponse.json(newSiteVisit, { status: 201 })
  } catch (error) {
    console.error('Error creating site visit:', error)
    return NextResponse.json(
      { error: 'Failed to create site visit' },
      { status: 500 }
    )
  }
}
