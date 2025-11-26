import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/sofa-types - List all sofa types (including deleted if requested)
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

    const sofaTypes = await prisma.sofaTypeMaster.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(sofaTypes)
  } catch (error) {
    console.error('GET /api/masters/sofa-types error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/masters/sofa-types - Create new sofa type (OWNER only)
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
    const { name, description, isActive, sortOrder } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.sofaTypeMaster.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Sofa type with this name already exists' },
        { status: 409 }
      )
    }

    const sofaType = await prisma.sofaTypeMaster.create({
      data: {
        name: name.toUpperCase(),
        description,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SofaTypeMaster',
      entityId: sofaType.id,
      newValues: sofaType,
    })

    return NextResponse.json(sofaType, { status: 201 })
  } catch (error) {
    console.error('POST /api/masters/sofa-types error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
