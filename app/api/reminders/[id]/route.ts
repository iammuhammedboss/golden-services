import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/reminders/[id] - Update or complete a reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any

  try {
    const existing = await prisma.userReminder.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, reminderDate, reminderTime, isCompleted } = body

    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (reminderDate !== undefined) data.reminderDate = new Date(reminderDate)
    if (reminderTime !== undefined) data.reminderTime = reminderTime || null
    if (isCompleted !== undefined) {
      data.isCompleted = isCompleted
      data.completedAt = isCompleted ? new Date() : null
    }

    const reminder = await prisma.userReminder.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ success: true, reminder })
  } catch (error) {
    console.error(`PATCH /api/reminders/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reminders/[id] - Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any

  try {
    const existing = await prisma.userReminder.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.userReminder.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/reminders/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
