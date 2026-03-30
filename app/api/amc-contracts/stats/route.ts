import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewAmcContracts } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { getAmcStats } from '@/lib/amc-scheduling'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as UserWithRoles
    if (!canViewAmcContracts(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await getAmcStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('GET /api/amc-contracts/stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
