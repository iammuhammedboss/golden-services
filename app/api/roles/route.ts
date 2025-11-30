import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageUsers } from '@/lib/permissions'

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage users
    const currentUser = session.user as any
    if (!canManageUsers(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const roles = await prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}
