import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reminders - List current user's reminders
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any
  const { searchParams } = new URL(request.url)
  const showCompleted = searchParams.get('completed') === 'true'

  try {
    const where: any = {
      userId: user.id,
      deletedAt: null,
    }
    if (!showCompleted) {
      where.isCompleted = false
    }

    const reminders = await prisma.userReminder.findMany({
      where,
      orderBy: { reminderDate: 'asc' },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('GET /api/reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reminders - Create a reminder
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as any

  try {
    const body = await request.json()
    const { title, description, reminderDate, reminderTime } = body

    if (!title || !reminderDate) {
      return NextResponse.json(
        { error: 'title and reminderDate are required' },
        { status: 400 }
      )
    }

    const reminder = await prisma.userReminder.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        reminderDate: new Date(reminderDate),
        reminderTime: reminderTime || null,
      },
    })

    return NextResponse.json({ success: true, reminder })
  } catch (error) {
    console.error('POST /api/reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
