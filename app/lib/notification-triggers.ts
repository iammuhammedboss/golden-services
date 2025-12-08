import { prisma } from '@/lib/prisma'
import { Notification } from '@prisma/client'

export async function triggerNewClientNotification(clientId: string, clientName: string) {
  // Find admin users or users with specific roles
  const adminUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'ADMIN'
          }
        }
      },
      isActive: true
    },
    select: {
      id: true
    }
  })

  const notifications: Omit<Notification, 'id' | 'createdAt' | 'readAt'>[] = adminUsers.map(user => ({
    recipientUserId: user.id,
    recipientRole: null,
    title: 'New Client Registered',
    message: `A new client "${clientName}" has been registered through the website.`,
    entityType: 'Client',
    entityId: clientId,
    isRead: false
  }))

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    })
  }
}

export async function triggerJobScheduledNotification(jobOrderId: string, jobNumber: string, scheduledDate: Date) {
  // Notify assigned team members
  const assignments = await prisma.jobAssignment.findMany({
    where: {
      jobOrderId
    },
    include: {
      user: {
        select: {
          id: true
        }
      }
    }
  })

  const notifications = assignments.map(assignment => ({
    recipientUserId: assignment.user.id,
    recipientRole: null,
    title: 'Job Scheduled',
    message: `Job ${jobNumber} has been scheduled for ${scheduledDate.toLocaleDateString()}.`,
    entityType: 'JobOrder',
    entityId: jobOrderId,
    isRead: false
  }))

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    })
  }
}

export async function triggerJobCompletionRequestNotification(jobOrderId: string, jobNumber: string, technicianName: string) {
  // Find supervisors
  const supervisors = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'SUPERVISOR'
          }
        }
      },
      isActive: true
    },
    select: {
      id: true
    }
  })

  const notifications = supervisors.map(user => ({
    recipientUserId: user.id,
    recipientRole: null,
    title: 'Job Completion Request',
    message: `Technician ${technicianName} has requested verification for job ${jobNumber}.`,
    entityType: 'JobOrder',
    entityId: jobOrderId,
    isRead: false
  }))

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    })
  }
}
