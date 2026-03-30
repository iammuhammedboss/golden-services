export type RealtimeEvent =
  | {
      type: 'JOB_STATUS_CHANGED'
      jobId: string
      jobNumber: string
      oldStatus: string
      newStatus: string
      updatedBy: string
      updatedByName: string
      timestamp: string
    }
  | {
      type: 'JOB_PROGRESS_UPDATED'
      jobId: string
      jobNumber: string
      progressStatus: string
      progressPercent: number
      note?: string
      updatedBy: string
      updatedByName: string
      timestamp: string
    }
  | {
      type: 'PHOTO_UPLOADED'
      jobId: string
      jobNumber: string
      photoId: string
      photoUrl: string
      phase: string
      uploadedBy: string
      uploadedByName: string
      timestamp: string
    }
  | {
      type: 'CHECKLIST_UPDATED'
      jobId: string
      jobNumber: string
      itemId: string
      description: string
      action: 'completed' | 'verified'
      updatedBy: string
      updatedByName: string
      timestamp: string
    }
  | {
      type: 'AMC_VISIT_COMPLETED'
      contractId: string
      contractNumber: string
      visitId: string
      visitNumber: number
      jobId: string
      timestamp: string
    }
  | {
      type: 'PAYMENT_RECEIVED'
      paymentId: string
      invoiceId: string
      clientName: string
      amount: string
      jobId?: string
      timestamp: string
    }
  | {
      type: 'NOTIFICATION_CREATED'
      notificationId: string
      recipientUserId?: string
      recipientRole?: string
      title: string
      message: string
      timestamp: string
    }
