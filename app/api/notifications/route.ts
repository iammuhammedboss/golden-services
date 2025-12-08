import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { UserWithRoles } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles
    
    // Get notifications for the current user
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientUserId: user.id },
          { recipientRole: { in: user.roles } },
        ],
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, recipientUserId, recipientRole, entityType, entityId } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        recipientUserId: recipientUserId || null,
        recipientRole: recipientRole || null,
        entityType: entityType || null,
        entityId: entityId || null,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
