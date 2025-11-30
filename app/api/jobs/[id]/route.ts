import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageJobs } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/jobs/[id] - Get a single job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    // Note: We might want a more granular permission like canViewJobs
    if (!canManageJobs(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    const job = await prisma.jobOrder.findUnique({
      where: { id },
      include: {
        client: true,
        site: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        quotation: {
          include: {
            items: true, // This is what we need for the invoice
          },
        },
        statusUpdates: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        },
        photos: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            uploadedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error(`GET /api/jobs/[id] error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}