import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emitEvent } from '@/lib/events/emit'

// POST /api/jobs/[id]/status-updates - Technician posts progress update
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any

  try {
    const body = await request.json()
    const { status, progressPercent, note } = body

    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id, deletedAt: null },
      select: { id: true, jobNumber: true, status: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Create status update record
    const statusUpdate = await prisma.jobStatusUpdate.create({
      data: {
        jobOrderId: params.id,
        createdById: user.id,
        status,
        progressPercent: progressPercent || 0,
        note: note || null,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    })

    // Update job status if needed
    const jobStatusMap: Record<string, string> = {
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETION_REQUESTED: 'COMPLETED',
      VERIFIED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    }

    const newJobStatus = jobStatusMap[status]
    if (newJobStatus && newJobStatus !== job.status) {
      await prisma.jobOrder.update({
        where: { id: params.id },
        data: { status: newJobStatus as any },
      })

      emitEvent({
        type: 'JOB_STATUS_CHANGED',
        jobId: params.id,
        jobNumber: job.jobNumber,
        oldStatus: job.status,
        newStatus: newJobStatus,
        updatedBy: user.id,
        updatedByName: user.name || 'Unknown',
        timestamp: new Date().toISOString(),
      })
    }

    // Emit progress update event
    emitEvent({
      type: 'JOB_PROGRESS_UPDATED',
      jobId: params.id,
      jobNumber: job.jobNumber,
      progressStatus: status,
      progressPercent: progressPercent || 0,
      note,
      updatedBy: user.id,
      updatedByName: user.name || 'Unknown',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, statusUpdate })
  } catch (error) {
    console.error(`POST /api/jobs/${params.id}/status-updates error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/jobs/[id]/status-updates - Get all status updates for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await prisma.jobStatusUpdate.findMany({
      where: { jobOrderId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
      },
    })

    return NextResponse.json(updates)
  } catch (error) {
    console.error(`GET /api/jobs/${params.id}/status-updates error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
