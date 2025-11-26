import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewDeletedRecords } from '@/lib/permissions'
import { getDeletedRecords } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/admin/deleted-records - View deleted records (OWNER, AUDITOR)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canViewDeletedRecords(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view deleted records' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    const filters = {
      entityType: searchParams.get('entityType') || undefined,
      deletedById: searchParams.get('deletedById') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      showRestored: searchParams.get('showRestored') === 'true',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await getDeletedRecords(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/admin/deleted-records error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
