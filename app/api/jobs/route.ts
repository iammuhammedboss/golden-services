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

// POST /api/jobs - Create new job order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageJobs(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      clientId,
      siteId,
      quotationId,
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime,
      status,
      notes,
    } = body

    // Validate required fields
    if (!clientId || !siteId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Client, site, and scheduled date are required' },
        { status: 400 }
      )
    }

    // Generate job number: JOB-YYYYMMDD-XXX
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')

    const count = await prisma.jobOrder.count({
      where: {
        jobNumber: {
          startsWith: `JOB-${dateStr}`,
        },
      },
    })

    const jobNumber = `JOB-${dateStr}-${String(count + 1).padStart(3, '0')}`

    // Create job order
    const job = await prisma.jobOrder.create({
      data: {
        jobNumber,
        clientId,
        siteId,
        quotationId: quotationId || null,
        scheduledDate: new Date(scheduledDate),
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
        scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : null,
        status: status || 'SCHEDULED',
        notes: notes || null,
      },
      include: {
        client: true,
        site: true,
        quotation: true,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('POST /api/jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
