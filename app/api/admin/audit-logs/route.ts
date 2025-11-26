import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewAuditLogs } from '@/lib/permissions'
import { getAuditLogs } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'
import type { AuditAction } from '@prisma/client'

// GET /api/admin/audit-logs - View audit logs (OWNER, AUDITOR, OPERATIONS_MANAGER)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canViewAuditLogs(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view audit logs' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: (searchParams.get('action') as AuditAction) || undefined,
      entityType: searchParams.get('entityType') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await getAuditLogs(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/admin/audit-logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
