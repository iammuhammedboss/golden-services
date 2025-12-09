import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserWithRoles } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientUserId: user.id },
          { recipientRole: { in: user.roles } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit the number of notifications
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    try {
      const { ids } = await request.json()
  
      if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      }
  
      await prisma.notification.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }
  }
  