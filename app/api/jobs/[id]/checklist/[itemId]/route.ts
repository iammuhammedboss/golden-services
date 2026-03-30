import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emitEvent } from '@/lib/events/emit'

// PATCH /api/jobs/[id]/checklist/[itemId] - Complete or verify a checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any

  try {
    const body = await request.json()
    const { action, photoUrl, notes } = body

    const job = await prisma.jobOrder.findUnique({
      where: { id: params.id, deletedAt: null },
      select: { id: true, jobNumber: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const item = await prisma.checklistItem.findUnique({
      where: { id: params.itemId },
    })

    if (!item || item.jobOrderId !== params.id) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    let updatedItem
    if (action === 'complete') {
      updatedItem = await prisma.checklistItem.update({
        where: { id: params.itemId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          completedById: user.id,
          photoUrl: photoUrl || item.photoUrl,
          notes: notes || item.notes,
        },
      })
    } else if (action === 'verify') {
      updatedItem = await prisma.checklistItem.update({
        where: { id: params.itemId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedById: user.id,
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    emitEvent({
      type: 'CHECKLIST_UPDATED',
      jobId: params.id,
      jobNumber: job.jobNumber,
      itemId: params.itemId,
      description: item.description,
      action,
      updatedBy: user.id,
      updatedByName: user.name || 'Unknown',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error) {
    console.error(`PATCH /api/jobs/${params.id}/checklist/${params.itemId} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
