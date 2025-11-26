import { prisma } from './prisma'
import type { AuditAction } from '@prisma/client'

interface AuditLogData {
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 * This function is called automatically by API routes to track all changes
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    })
  } catch (error) {
    // Log audit errors but don't fail the main operation
    console.error('Audit log creation failed:', error)
  }
}

/**
 * Soft delete a record and create a deleted record snapshot
 */
export async function softDelete<T extends { id: string }>(
  entityType: string,
  entityId: string,
  userId: string,
  data: T
) {
  try {
    // Create deleted record snapshot
    await prisma.deletedRecord.create({
      data: {
        entityType,
        entityId,
        data: data as any,
        deletedById: userId,
      },
    })

    // Create audit log
    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType,
      entityId,
      oldValues: data,
      newValues: null,
    })

    return true
  } catch (error) {
    console.error('Soft delete failed:', error)
    return false
  }
}

/**
 * Restore a soft-deleted record (Admin only)
 */
export async function restoreRecord(
  entityType: string,
  entityId: string,
  userId: string
) {
  try {
    // Find the deleted record
    const deletedRecord = await prisma.deletedRecord.findFirst({
      where: {
        entityType,
        entityId,
        restoredAt: null,
      },
      orderBy: {
        deletedAt: 'desc',
      },
    })

    if (!deletedRecord) {
      throw new Error('Deleted record not found')
    }

    // Mark as restored
    await prisma.deletedRecord.update({
      where: { id: deletedRecord.id },
      data: {
        restoredAt: new Date(),
        restoredById: userId,
      },
    })

    // Create audit log
    await createAuditLog({
      userId,
      action: 'RESTORE',
      entityType,
      entityId,
      oldValues: null,
      newValues: deletedRecord.data,
    })

    return deletedRecord.data
  } catch (error) {
    console.error('Restore failed:', error)
    throw error
  }
}

/**
 * Get audit history for a specific entity
 */
export async function getEntityAuditHistory(
  entityType: string,
  entityId: string,
  limit = 100
) {
  return await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}

/**
 * Get all audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string
  action?: AuditAction
  entityType?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (filters.userId) {
    where.userId = filters.userId
  }

  if (filters.action) {
    where.action = filters.action
  }

  if (filters.entityType) {
    where.entityType = filters.entityType
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  }
}

/**
 * Get deleted records with filters
 */
export async function getDeletedRecords(filters: {
  entityType?: string
  deletedById?: string
  startDate?: Date
  endDate?: Date
  showRestored?: boolean
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (filters.entityType) {
    where.entityType = filters.entityType
  }

  if (filters.deletedById) {
    where.deletedById = filters.deletedById
  }

  if (!filters.showRestored) {
    where.restoredAt = null
  }

  if (filters.startDate || filters.endDate) {
    where.deletedAt = {}
    if (filters.startDate) {
      where.deletedAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.deletedAt.lte = filters.endDate
    }
  }

  const [records, total] = await Promise.all([
    prisma.deletedRecord.findMany({
      where,
      include: {
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        restoredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.deletedRecord.count({ where }),
  ])

  return {
    records,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  }
}
