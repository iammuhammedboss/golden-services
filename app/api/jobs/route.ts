import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageJobs } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/jobs - List all jobs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageJobs(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const jobs = await prisma.jobOrder.findMany({
      orderBy: {
        scheduledDate: 'desc',
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        site: {
          select: {
            name: true,
            city: true,
          },
        },
        assignments: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
            roleInJob: true,
          },
        },
      },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('GET /api/jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
