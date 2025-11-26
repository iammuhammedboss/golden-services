import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageJobs } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/jobs/[id] - Get single job
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

    if (!canManageJobs(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        site: true,
        quotation: true,
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('GET /api/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/jobs/[id] - Update job
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime,
      status,
      notes,
    } = body

    // Build update data
    const updateData: any = {}

    if (scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(scheduledDate)
    }

    if (scheduledStartTime !== undefined) {
      updateData.scheduledStartTime = new Date(scheduledStartTime)
    }

    if (scheduledEndTime !== undefined) {
      updateData.scheduledEndTime = new Date(scheduledEndTime)
    }

    if (status !== undefined) {
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    updateData.updatedAt = new Date()

    const job = await prisma.jobOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        site: true,
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('PATCH /api/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageJobs(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if job exists
    const existingJob = await prisma.jobOrder.findUnique({
      where: { id: params.id },
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Don't allow deletion of completed jobs
    if (existingJob.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete completed jobs' },
        { status: 400 }
      )
    }

    await prisma.jobOrder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/jobs/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
