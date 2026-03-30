/**
 * Decimal utility functions for precise financial calculations in the frontend
 * Uses the same Decimal library as Prisma for consistency
 */

import { Decimal } from 'decimal.js'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 9,
  minE: -9,
  maxE: 9,
})

/**
 * Convert a value to Decimal safely
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0)
  }
  if (value instanceof Decimal) {
    return value
  }
  try {
    return new Decimal(value)
  } catch {
    return new Decimal(0)
  }
}

/**
 * Add two values with decimal precision
 */
export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b))
}

/**
 * Subtract two values with decimal precision
 */
export function subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b))
}

/**
 * Multiply two values with decimal precision
 */
export function multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b))
}

/**
 * Divide two values with decimal precision
 */
export function divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  const divisor = toDecimal(b)
  if (divisor.isZero()) {
    return new Decimal(0)
  }
  return toDecimal(a).dividedBy(divisor)
}

/**
 * Calculate percentage of a value
 * Example: percentage(100, 15) = 15
 */
export function percentage(value: number | string | Decimal, percent: number | string | Decimal): Decimal {
  return multiply(value, divide(percent, 100))
}

/**
 * Format decimal for display (2 decimal places by default)
 */
export function formatDecimal(value: number | string | Decimal, decimalPlaces: number = 2): string {
  return toDecimal(value).toFixed(decimalPlaces)
}

/**
 * Format as currency (3 decimal places for precision)
 */
export function formatCurrency(value: number | string | Decimal, currency: string = 'AED'): string {
  const formatted = toDecimal(value).toFixed(3)
  return `${currency} ${formatted}`
}

/**
 * Format as currency without symbol (3 decimal places)
 */
export function formatAmount(value: number | string | Decimal): string {
  return toDecimal(value).toFixed(3)
}

/**
 * Parse user input to decimal
 * Handles various input formats
 */
export function parseInput(input: string): Decimal {
  // Remove any currency symbols and commas
  const cleaned = input.replace(/[^0-9.-]/g, '')
  return toDecimal(cleaned)
}

/**
 * Compare two decimal values
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: number | string | Decimal, b: number | string | Decimal): number {
  return toDecimal(a).comparedTo(toDecimal(b))
}

/**
 * Check if value is zero
 */
export function isZero(value: number | string | Decimal): boolean {
  return toDecimal(value).isZero()
}

/**
 * Check if value is positive
 */
export function isPositive(value: number | string | Decimal): boolean {
  return toDecimal(value).greaterThan(0)
}

/**
 * Check if value is negative
 */
export function isNegative(value: number | string | Decimal): boolean {
  return toDecimal(value).lessThan(0)
}

/**
 * Get the absolute value
 */
export function abs(value: number | string | Decimal): Decimal {
  return toDecimal(value).abs()
}

/**
 * Round to specified decimal places
 */
export function round(value: number | string | Decimal, decimalPlaces: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces)
}

/**
 * Calculate quotation line item total
 */
export function calculateLineTotal(quantity: number | string | Decimal, unitPrice: number | string | Decimal): Decimal {
  return multiply(quantity, unitPrice)
}

/**
 * Calculate quotation subtotal from items
 */
export function calculateSubtotal(items: Array<{ quantity: number | string | Decimal; unitPrice: number | string | Decimal }>): Decimal {
  return items.reduce((sum, item) => {
    return add(sum, calculateLineTotal(item.quantity, item.unitPrice))
  }, new Decimal(0))
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  subtotal: number | string | Decimal,
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | null,
  discountValue: number | string | Decimal | null
): Decimal {
  if (!discountType || !discountValue) {
    return new Decimal(0)
  }

  const value = toDecimal(discountValue)

  if (discountType === 'PERCENTAGE') {
    return percentage(subtotal, value)
  } else {
    return value
  }
}

/**
 * Calculate VAT amount
 */
export function calculateVAT(
  amount: number | string | Decimal,
  vatPercentage: number | string | Decimal
): Decimal {
  return percentage(amount, vatPercentage)
}

/**
 * Calculate quotation totals
 */
export interface QuotationCalculation {
  subtotal: Decimal
  discountAmount: Decimal
  subtotalAfterDiscount: Decimal
  vatAmount: Decimal
  total: Decimal
}

export function calculateQuotationTotals(data: {
  items: Array<{
    quantity: number | string | Decimal
    unitPrice: number | string | Decimal
  }>
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | null
  discountValue?: number | string | Decimal | null
  vatEnabled?: boolean
  vatPercentage?: number | string | Decimal
}): QuotationCalculation {
  // Calculate subtotal
  const subtotal = calculateSubtotal(data.items)

  // Calculate discount
  const discountAmount = calculateDiscount(
    subtotal,
    data.discountType || null,
    data.discountValue || null
  )

  // Subtotal after discount
  const subtotalAfterDiscount = subtract(subtotal, discountAmount)

  // Calculate VAT
  const vatAmount = data.vatEnabled
    ? calculateVAT(subtotalAfterDiscount, data.vatPercentage || 0)
    : new Decimal(0)

  // Total
  const total = add(subtotalAfterDiscount, vatAmount)

  return {
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    vatAmount,
    total,
  }
}

// Export Decimal class for direct use
export { Decimal }
