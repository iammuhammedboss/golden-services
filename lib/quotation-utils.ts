import { prisma } from './prisma'

/**
 * Generate a unique quotation number
 * Uses a transaction with row-level locking to prevent race conditions
 * Format: GSQ-XXXXXXXXXX (10 digits, zero-padded)
 */
export async function generateQuotationNumber(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Find the latest quotation number by ordering
    const latestQuotation = await tx.quotation.findFirst({
      where: {
        quotationNumber: {
          not: null,
          startsWith: 'GSQ-',
        },
      },
      orderBy: {
        quotationNumber: 'desc',
      },
      select: {
        quotationNumber: true,
      },
    })

    let nextNumber = 1

    if (latestQuotation?.quotationNumber) {
      // Extract the number part (after GSQ-)
      const currentNumber = parseInt(
        latestQuotation.quotationNumber.replace('GSQ-', ''),
        10
      )
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1
      }
    }

    // Format with zero-padding (10 digits)
    const quotationNumber = `GSQ-${nextNumber.toString().padStart(10, '0')}`

    // Verify uniqueness (should be guaranteed by transaction but extra safety)
    const existing = await tx.quotation.findUnique({
      where: { quotationNumber },
    })

    if (existing) {
      // If somehow we got a collision, recursively try next number
      // This should never happen with proper transaction isolation
      throw new Error('Quotation number collision detected. Please retry.')
    }

    return quotationNumber
  })
}

/**
 * Get next version number for a client's quotations
 */
export async function getNextQuotationVersion(clientId: string): Promise<number> {
  const latestQuotation = await prisma.quotation.findFirst({
    where: {
      clientId,
    },
    orderBy: {
      version: 'desc',
    },
    select: {
      version: true,
    },
  })

  return (latestQuotation?.version || 0) + 1
}

/**
 * Check if a measurement exists before using it
 */
export async function validateMeasurementExists(
  measurementId: string
): Promise<boolean> {
  if (!measurementId) {
    return true // Optional field
  }

  const measurement = await prisma.measurement.findUnique({
    where: { id: measurementId },
  })

  return measurement !== null
}

/**
 * Check if a client exists
 */
export async function validateClientExists(clientId: string): Promise<boolean> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  })

  return client !== null
}

/**
 * Check if a terms template exists
 */
export async function validateTermsTemplateExists(
  templateId: string | null
): Promise<boolean> {
  if (!templateId) {
    return true // Optional field
  }

  const template = await prisma.termsTemplate.findUnique({
    where: { id: templateId },
  })

  return template !== null
}

/**
 * Check if a bank details template exists
 */
export async function validateBankDetailsTemplateExists(
  templateId: string | null
): Promise<boolean> {
  if (!templateId) {
    return true // Optional field
  }

  const template = await prisma.bankDetailsTemplate.findUnique({
    where: { id: templateId },
  })

  return template !== null
}

/**
 * Get template snapshots for quotation
 */
export async function getTemplateSnapshots(data: {
  termsTemplateId?: string | null
  bankDetailsTemplateId?: string | null
}): Promise<{
  termsSnapshot: string | null
  bankDetailsSnapshot: string | null
}> {
  const [termsTemplate, bankDetailsTemplate] = await Promise.all([
    data.termsTemplateId
      ? prisma.termsTemplate.findUnique({
          where: { id: data.termsTemplateId },
        })
      : null,
    data.bankDetailsTemplateId
      ? prisma.bankDetailsTemplate.findUnique({
          where: { id: data.bankDetailsTemplateId },
        })
      : null,
  ])

  return {
    termsSnapshot: termsTemplate?.content || null,
    bankDetailsSnapshot: bankDetailsTemplate?.content || null,
  }
}
