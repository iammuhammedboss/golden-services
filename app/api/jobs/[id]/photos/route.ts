import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emitEvent } from '@/lib/events/emit'

// POST /api/jobs/[id]/photos - Upload photo for a job
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
    const { url, phase, caption, measurementObjectId } = body

    if (!url || !phase) {
      return NextResponse.json(
        { error: 'url and phase are required' },
        { status: 400 }
      )
    }

    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id, deletedAt: null },
      select: { id: true, jobNumber: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const photo = await prisma.photo.create({
      data: {
        jobOrderId: params.id,
        measurementObjectId: measurementObjectId || null,
        phase,
        url,
        caption: caption || null,
        uploadedById: user.id,
      },
    })

    emitEvent({
      type: 'PHOTO_UPLOADED',
      jobId: params.id,
      jobNumber: job.jobNumber,
      photoId: photo.id,
      photoUrl: url,
      phase,
      uploadedBy: user.id,
      uploadedByName: user.name || 'Unknown',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, photo })
  } catch (error) {
    console.error(`POST /api/jobs/${params.id}/photos error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/jobs/[id]/photos - List photos for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const photos = await prisma.photo.findMany({
      where: { jobOrderId: params.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true } },
      },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error(`GET /api/jobs/${params.id}/photos error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
