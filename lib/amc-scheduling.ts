import { prisma } from './prisma'
import { AmcFrequency } from '@prisma/client'
import { addWeeks, addMonths, addDays, isBefore, isEqual } from 'date-fns'

/**
 * Generate visit dates based on frequency and duration
 */
export function generateVisitDates(
  startDate: Date,
  frequency: AmcFrequency,
  durationMonths: number
): Date[] {
  const dates: Date[] = []
  const endDate = addMonths(startDate, durationMonths)
  let currentDate = new Date(startDate)

  while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
    dates.push(new Date(currentDate))

    switch (frequency) {
      case 'WEEKLY':
        currentDate = addWeeks(currentDate, 1)
        break
      case 'BI_WEEKLY':
        currentDate = addWeeks(currentDate, 2)
        break
      case 'MONTHLY':
        currentDate = addMonths(currentDate, 1)
        break
      case 'QUARTERLY':
        currentDate = addMonths(currentDate, 3)
        break
    }
  }

  return dates
}

/**
 * Calculate end date from start date and duration
 */
export function calculateEndDate(startDate: Date, durationMonths: number): Date {
  return addDays(addMonths(startDate, durationMonths), -1)
}

/**
 * Generate unique AMC contract number
 */
export async function generateAmcContractNumber(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const latest = await tx.amcContract.findFirst({
      where: {
        contractNumber: {
          startsWith: 'AMC-',
        },
      },
      orderBy: {
        contractNumber: 'desc',
      },
      select: {
        contractNumber: true,
      },
    })

    let nextNumber = 1
    if (latest?.contractNumber) {
      const current = parseInt(latest.contractNumber.replace('AMC-', ''), 10)
      if (!isNaN(current)) {
        nextNumber = current + 1
      }
    }

    return `AMC-${nextNumber.toString().padStart(10, '0')}`
  })
}

/**
 * Generate job number for AMC visits
 * Follows existing pattern: JOB-YYYYMMDD-XXX
 */
async function generateJobNumber(date: Date, tx: any): Promise<string> {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `JOB-${dateStr}-`

  const latestJob = await tx.jobOrder.findFirst({
    where: {
      jobNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      jobNumber: 'desc',
    },
    select: {
      jobNumber: true,
    },
  })

  let nextSeq = 1
  if (latestJob?.jobNumber) {
    const seq = parseInt(latestJob.jobNumber.replace(prefix, ''), 10)
    if (!isNaN(seq)) {
      nextSeq = seq + 1
    }
  }

  return `${prefix}${nextSeq.toString().padStart(3, '0')}`
}

/**
 * Create AMC contract and scheduled visits from an accepted quotation
 */
export async function createAmcContractFromQuotation(
  quotationId: string,
  userId: string
) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: true,
      items: { where: { deletedAt: null } },
    },
  })

  if (!quotation) throw new Error('Quotation not found')
  if (!quotation.isAmc) throw new Error('Quotation is not an AMC')
  if (!quotation.amcFrequency || !quotation.amcDurationMonths || !quotation.amcStartDate) {
    throw new Error('AMC fields are incomplete')
  }

  const startDate = new Date(quotation.amcStartDate)
  const endDate = calculateEndDate(startDate, quotation.amcDurationMonths)
  const visitDates = generateVisitDates(startDate, quotation.amcFrequency, quotation.amcDurationMonths)

  return await prisma.$transaction(async (tx) => {
    const contractNumber = await generateAmcContractNumber()

    // Create the AMC contract
    const contract = await tx.amcContract.create({
      data: {
        quotationId,
        clientId: quotation.clientId,
        contractNumber,
        frequency: quotation.amcFrequency!,
        durationMonths: quotation.amcDurationMonths!,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    })

    // Create visits and job orders for each date
    for (let i = 0; i < visitDates.length; i++) {
      const visitDate = visitDates[i]
      const jobNumber = await generateJobNumber(visitDate, tx)

      // Create the job order
      const jobOrder = await tx.jobOrder.create({
        data: {
          clientId: quotation.clientId,
          quotationId,
          jobNumber,
          status: 'SCHEDULED',
          scheduledDate: visitDate,
          location: quotation.client.notes || null,
          notes: `AMC Visit #${i + 1} - ${contractNumber}`,
        },
      })

      // Create the AMC visit linking contract to job
      await tx.amcVisit.create({
        data: {
          amcContractId: contract.id,
          jobOrderId: jobOrder.id,
          visitNumber: i + 1,
          scheduledDate: visitDate,
          status: 'SCHEDULED',
        },
      })
    }

    return contract
  })
}

/**
 * Pause an AMC contract
 */
export async function pauseAmcContract(contractId: string) {
  return await prisma.amcContract.update({
    where: { id: contractId },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
    },
  })
}

/**
 * Resume a paused AMC contract
 */
export async function resumeAmcContract(contractId: string) {
  return await prisma.amcContract.update({
    where: { id: contractId },
    data: {
      status: 'ACTIVE',
      pausedAt: null,
    },
  })
}

/**
 * Cancel an AMC contract and all future scheduled visits/jobs
 */
export async function cancelAmcContract(contractId: string, reason?: string) {
  return await prisma.$transaction(async (tx) => {
    // Cancel the contract
    const contract = await tx.amcContract.update({
      where: { id: contractId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || null,
      },
    })

    // Get all future scheduled visits
    const futureVisits = await tx.amcVisit.findMany({
      where: {
        amcContractId: contractId,
        status: 'SCHEDULED',
        scheduledDate: { gte: new Date() },
      },
      include: { jobOrder: true },
    })

    // Cancel future visits and their job orders
    for (const visit of futureVisits) {
      await tx.amcVisit.update({
        where: { id: visit.id },
        data: { status: 'CANCELLED' },
      })

      if (visit.jobOrderId) {
        await tx.jobOrder.update({
          where: { id: visit.jobOrderId },
          data: { status: 'CANCELLED' },
        })
      }
    }

    return contract
  })
}

/**
 * Get AMC contract summary stats
 */
export async function getAmcStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [active, paused, upcoming, overdue] = await Promise.all([
    prisma.amcContract.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.amcContract.count({ where: { status: 'PAUSED', deletedAt: null } }),
    prisma.amcVisit.count({
      where: {
        status: 'SCHEDULED',
        scheduledDate: {
          gte: today,
          lte: addWeeks(today, 1),
        },
        amcContract: { deletedAt: null },
      },
    }),
    prisma.amcVisit.count({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { lt: today },
        amcContract: { deletedAt: null },
      },
    }),
  ])

  return { active, paused, upcoming, overdue }
}
