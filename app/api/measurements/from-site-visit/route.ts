import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

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
    const { siteVisitId } = body

    if (!siteVisitId) {
      return NextResponse.json(
        { error: 'siteVisitId is required' },
        { status: 400 }
      )
    }

    const siteVisit = await prisma.siteVisit.findUnique({
      where: { id: siteVisitId },
      include: { client: true }
    })

    if (!siteVisit) {
      return NextResponse.json({ error: 'Site visit not found' }, { status: 404 })
    }

    const newMeasurement = await prisma.measurement.create({
      data: {
        clientId: siteVisit.clientId,
        siteVisitId: siteVisit.id,
        title: `Measurement for ${siteVisit.client?.name}`,
        location: siteVisit.locationText || null,
        status: 'DRAFT',
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Measurement',
      entityId: newMeasurement.id,
      newValues: newMeasurement,
    })

    return NextResponse.json(newMeasurement, { status: 201 })
  } catch (error) {
    console.error('Error creating measurement from site visit:', error)
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}
