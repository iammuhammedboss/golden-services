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
    const {
      clientId,
      name,
      address,
      city,
      locationUrl,
      type,
      personInCharge,
      personPhone,
    } = body

    if (!clientId || !name) {
      return NextResponse.json(
        { error: 'clientId and name are required' },
        { status: 400 }
      )
    }

    const newSite = await prisma.site.create({
      data: {
        clientId,
        name,
        address,
        city,
        locationUrl,
        type,
        personInCharge,
        personPhone,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Site',
      entityId: newSite.id,
      newValues: newSite,
    })

    return NextResponse.json(newSite, { status: 201 })
  } catch (error) {
    console.error('Error creating site:', error)
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    )
  }
}