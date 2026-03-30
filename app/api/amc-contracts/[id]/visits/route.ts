import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewAmcContracts } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/amc-contracts/[id]/visits - List visits for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as UserWithRoles
    if (!canViewAmcContracts(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { amcContractId: params.id }
    if (status) where.status = status

    const visits = await prisma.amcVisit.findMany({
      where,
      orderBy: { visitNumber: 'asc' },
      include: {
        jobOrder: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    })

    return NextResponse.json(visits)
  } catch (error) {
    console.error(`GET /api/amc-contracts/${params.id}/visits error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
