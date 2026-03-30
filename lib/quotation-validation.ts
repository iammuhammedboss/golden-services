import { QuotationStatus, type Quotation } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Valid quotation status transitions
 * Defines which status changes are allowed
 */
export const VALID_STATUS_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: [QuotationStatus.SENT, QuotationStatus.REJECTED],
  SENT: [QuotationStatus.ACCEPTED, QuotationStatus.REJECTED, QuotationStatus.DRAFT],
  ACCEPTED: [], // Once accepted, cannot change status
  REJECTED: [QuotationStatus.DRAFT], // Can reopen as draft
}

/**
 * Validates if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: QuotationStatus,
  newStatus: QuotationStatus
): boolean {
  if (currentStatus === newStatus) {
    return true // No change
  }
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Get allowed status transitions for current status
 */
export function getAllowedStatusTransitions(
  currentStatus: QuotationStatus
): QuotationStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Check if quotation is expired
 */
export function isQuotationExpired(quotation: { validUntil?: Date | null }): boolean {
  if (!quotation.validUntil) {
    return false // No expiration date set
  }
  return new Date() > new Date(quotation.validUntil)
}

/**
 * Check if quotation can be edited
 */
export function canEditQuotation(status: QuotationStatus): boolean {
  return status === QuotationStatus.DRAFT
}

/**
 * Check if quotation can be deleted
 */
export function canDeleteQuotation(status: QuotationStatus): boolean {
  // Can only delete draft quotations
  return status === QuotationStatus.DRAFT
}

/**
 * Check if quotation can be converted to invoice
 */
export function canConvertToInvoice(status: QuotationStatus): boolean {
  return status === QuotationStatus.ACCEPTED
}

/**
 * Check if quotation can be converted to job order
 */
export function canConvertToJobOrder(status: QuotationStatus): boolean {
  return status === QuotationStatus.ACCEPTED
}

/**
 * Validate quotation data before creation/update
 */
export interface QuotationValidationResult {
  valid: boolean
  errors: string[]
}

export function validateQuotationData(data: {
  clientId?: string
  items?: Array<{
    description?: string
    quantity?: number | Decimal
    unitPrice?: number | Decimal
  }>
  discountType?: string | null
  discountValue?: number | Decimal | null
  vatPercentage?: number | Decimal
  validUntil?: Date | null
}): QuotationValidationResult {
  const errors: string[] = []

  // Validate client
  if (!data.clientId) {
    errors.push('Client is required')
  }

  // Validate items
  if (!data.items || data.items.length === 0) {
    errors.push('At least one quotation item is required')
  } else {
    data.items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Item ${index + 1}: Description is required`)
      }

      const quantity = typeof item.quantity === 'number'
        ? item.quantity
        : item.quantity instanceof Decimal
          ? item.quantity.toNumber()
          : 0

      if (quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }

      const unitPrice = typeof item.unitPrice === 'number'
        ? item.unitPrice
        : item.unitPrice instanceof Decimal
          ? item.unitPrice.toNumber()
          : 0

      if (unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`)
      }
    })
  }

  // Validate discount
  if (data.discountType && data.discountValue) {
    const discountValue = typeof data.discountValue === 'number'
      ? data.discountValue
      : data.discountValue instanceof Decimal
        ? data.discountValue.toNumber()
        : 0

    if (data.discountType === 'PERCENTAGE') {
      if (discountValue < 0 || discountValue > 100) {
        errors.push('Discount percentage must be between 0 and 100')
      }
    } else if (data.discountType === 'FIXED_AMOUNT') {
      if (discountValue < 0) {
        errors.push('Discount amount cannot be negative')
      }
    }
  }

  // Validate VAT
  if (data.vatPercentage !== undefined) {
    const vatPercentage = typeof data.vatPercentage === 'number'
      ? data.vatPercentage
      : data.vatPercentage instanceof Decimal
        ? data.vatPercentage.toNumber()
        : 0

    if (vatPercentage < 0 || vatPercentage > 100) {
      errors.push('VAT percentage must be between 0 and 100')
    }
  }

  // Validate valid until date
  if (data.validUntil && new Date(data.validUntil) < new Date()) {
    errors.push('Valid until date cannot be in the past')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate quotation totals with proper decimal precision
 */
export interface QuotationTotals {
  subtotal: Decimal
  discountAmount: Decimal
  subtotalAfterDiscount: Decimal
  vatAmount: Decimal
  total: Decimal
}

export function calculateQuotationTotals(data: {
  items: Array<{
    quantity: number | Decimal
    unitPrice: number | Decimal
  }>
  discountType?: string | null
  discountValue?: number | Decimal | null
  vatEnabled?: boolean
  vatPercentage?: number | Decimal
}): QuotationTotals {
  // Calculate subtotal
  let subtotal = new Decimal(0)
  for (const item of data.items) {
    const quantity = item.quantity instanceof Decimal ? item.quantity : new Decimal(item.quantity)
    const unitPrice = item.unitPrice instanceof Decimal ? item.unitPrice : new Decimal(item.unitPrice)
    subtotal = subtotal.plus(quantity.times(unitPrice))
  }

  // Calculate discount
  let discountAmount = new Decimal(0)
  if (data.discountType && data.discountValue) {
    const discountValue = data.discountValue instanceof Decimal
      ? data.discountValue
      : new Decimal(data.discountValue)

    if (data.discountType === 'PERCENTAGE') {
      discountAmount = subtotal.times(discountValue).dividedBy(100)
    } else if (data.discountType === 'FIXED_AMOUNT') {
      discountAmount = discountValue
    }
  }

  // Subtotal after discount
  const subtotalAfterDiscount = subtotal.minus(discountAmount)

  // Calculate VAT
  let vatAmount = new Decimal(0)
  if (data.vatEnabled && data.vatPercentage) {
    const vatPercentage = data.vatPercentage instanceof Decimal
      ? data.vatPercentage
      : new Decimal(data.vatPercentage)
    vatAmount = subtotalAfterDiscount.times(vatPercentage).dividedBy(100)
  }

  // Total
  const total = subtotalAfterDiscount.plus(vatAmount)

  return {
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    vatAmount,
    total,
  }
}

/**
 * Format quotation number for display
 */
export function formatQuotationNumber(quotationNumber: string | null): string {
  return quotationNumber || 'DRAFT'
}

/**
 * Get quotation status color for UI
 */
export function getQuotationStatusColor(status: QuotationStatus): string {
  switch (status) {
    case QuotationStatus.DRAFT:
      return 'gray'
    case QuotationStatus.SENT:
      return 'blue'
    case QuotationStatus.ACCEPTED:
      return 'green'
    case QuotationStatus.REJECTED:
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Get quotation status label
 */
export function getQuotationStatusLabel(status: QuotationStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')
}

/**
 * Generate validation error message for status transition
 */
export function getStatusTransitionError(
  currentStatus: QuotationStatus,
  newStatus: QuotationStatus
): string {
  const allowed = getAllowedStatusTransitions(currentStatus)
  const allowedLabels = allowed.map(getQuotationStatusLabel).join(', ')

  if (allowed.length === 0) {
    return `Quotation with status "${getQuotationStatusLabel(currentStatus)}" cannot be changed.`
  }

  return `Cannot change status from "${getQuotationStatusLabel(currentStatus)}" to "${getQuotationStatusLabel(newStatus)}". Allowed transitions: ${allowedLabels}`
}
