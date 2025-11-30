import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/units - List all units (including deleted if requested)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyActive = searchParams.get('onlyActive') === 'true'

    const where: any = {}

    if (!includeDeleted) {
      where.deletedAt = null
    }

    if (onlyActive) {
      where.isActive = true
    }

    const units = await prisma.unitMaster.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('GET /api/masters/units error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/masters/units - Create new unit (OWNER only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageMasters(user)) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, isActive } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.unitMaster.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Unit with this name already exists' },
        { status: 409 }
      )
    }

    const unit = await prisma.unitMaster.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'UnitMaster',
      entityId: unit.id,
      newValues: unit,
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('POST /api/masters/units error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
