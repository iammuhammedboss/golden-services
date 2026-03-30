import { prisma } from '@/lib/prisma'
import { emitEvent } from '@/lib/events/emit'

async function createNotification(data: {
  recipientUserId?: string
  recipientRole?: string
  title: string
  message: string
  entityType?: string
  entityId?: string
}) {
  const notification = await prisma.notification.create({
    data: {
      recipientUserId: data.recipientUserId || null,
      recipientRole: data.recipientRole || null,
      title: data.title,
      message: data.message,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
    },
  })

  emitEvent({
    type: 'NOTIFICATION_CREATED',
    notificationId: notification.id,
    recipientUserId: data.recipientUserId,
    recipientRole: data.recipientRole,
    title: data.title,
    message: data.message,
    timestamp: new Date().toISOString(),
  })

  return notification
}

export async function triggerNewClientNotification(clientId: string, clientName: string) {
  await createNotification({
    recipientRole: 'OPERATIONS_MANAGER',
    title: 'New Client',
    message: `New client added: ${clientName}`,
    entityType: 'client',
    entityId: clientId,
  })
}

export async function triggerJobScheduledNotification(jobOrderId: string, jobNumber: string, scheduledDate: Date) {
  // Notify assigned technicians
  const assignments = await prisma.jobAssignment.findMany({
    where: { jobOrderId },
    select: { userId: true },
  })

  for (const assignment of assignments) {
    await createNotification({
      recipientUserId: assignment.userId,
      title: 'New Job Assigned',
      message: `Job ${jobNumber} scheduled for ${scheduledDate.toLocaleDateString()}`,
      entityType: 'job_order',
      entityId: jobOrderId,
    })
  }

  // Also notify managers
  await createNotification({
    recipientRole: 'OPERATIONS_MANAGER',
    title: 'Job Scheduled',
    message: `Job ${jobNumber} has been scheduled`,
    entityType: 'job_order',
    entityId: jobOrderId,
  })
}

export async function triggerJobCompletionRequestNotification(jobOrderId: string, jobNumber: string, technicianName: string) {
  await createNotification({
    recipientRole: 'OPERATIONS_MANAGER',
    title: 'Completion Requested',
    message: `${technicianName} has requested completion for job ${jobNumber}`,
    entityType: 'job_order',
    entityId: jobOrderId,
  })
}

export async function triggerCreditApprovalNotification(paymentId: string, jobNumber: string, amount: string) {
  await createNotification({
    recipientRole: 'SALES',
    title: 'Credit Approval Required',
    message: `Credit payment of ${amount} OMR on job ${jobNumber} needs approval`,
    entityType: 'payment',
    entityId: paymentId,
  })
}

export async function triggerPaymentReceivedNotification(jobNumber: string, amount: string, method: string) {
  await createNotification({
    recipientRole: 'ACCOUNTANT',
    title: 'Payment Received',
    message: `${amount} OMR received via ${method} for job ${jobNumber}`,
    entityType: 'payment',
    entityId: jobNumber,
  })
}

export async function triggerAmcContractCreatedNotification(contractNumber: string, clientName: string) {
  await createNotification({
    recipientRole: 'OPERATIONS_MANAGER',
    title: 'AMC Contract Created',
    message: `New AMC contract ${contractNumber} for ${clientName}`,
    entityType: 'amc_contract',
    entityId: contractNumber,
  })
}
