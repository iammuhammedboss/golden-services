import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in OMR
 */
export function formatCurrency(amount: number | string, currency: string = 'OMR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${numAmount.toFixed(3)} ${currency}`
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Format for Oman numbers (+968 XXXX XXXX)
  if (cleaned.startsWith('968') && cleaned.length === 11) {
    return `+968 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  }

  return phone
}

/**
 * Format date
 */
export function formatDate(date: Date | string, formatStr: string = 'PP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format datetime
 */
export function formatDateTime(date: Date | string, formatStr: string = 'PPp'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format time
 */
export function formatTime(date: Date | string, formatStr: string = 'p'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a random ID
 */
export function generateId(prefix: string = ''): string {
  const random = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}_${random}` : random
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if string is valid Oman phone number
 */
export function isValidOmanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.startsWith('968') && cleaned.length === 11
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Convert enum to readable text
 */
export function enumToReadable(enumValue: string): string {
  return enumValue
    .split('_')
    .map((word) => capitalize(word))
    .join(' ')
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Lead statuses
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-purple-100 text-purple-800',
    SITE_VISIT_SCHEDULED: 'bg-yellow-100 text-yellow-800',
    QUOTED: 'bg-orange-100 text-orange-800',
    WON: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',

    // Client statuses
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    BLACKLISTED: 'bg-red-100 text-red-800',

    // Job statuses
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',

    // Quotation statuses
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',

    // Site visit statuses
    ON_HOLD: 'bg-orange-100 text-orange-800',
    NOT_STARTED: 'bg-gray-100 text-gray-800',

    // Payment statuses
    UNPAID: 'bg-red-100 text-red-800',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
  }

  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get readable label for object size
 */
export function getSizeLabel(size: string): string {
  const sizeLabels: Record<string, string> = {
    XS: 'Very Small',
    S: 'Small',
    M: 'Medium',
    L: 'Large',
    XL: 'Very Large',
    XXL: 'Extra Large',
    XXXL: 'Huge',
  }
  return sizeLabels[size] || size
}

/**
 * Get readable label for dirt level
 */
export function getDirtLevelLabel(level: string): string {
  const levelLabels: Record<string, string> = {
    LIGHT: 'Light soil',
    MEDIUM: 'Moderate soil',
    HEAVY: 'Heavy soil',
    SEVERE: 'Severely soiled',
  }
  return levelLabels[level] || level
}

/**
 * Get readable label for measurement object type
 */
export function getMeasurementObjectTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    HOUSE: 'House',
    VILLA: 'Villa',
    FLAT: 'Flat',
    OFFICE: 'Office',
    WAREHOUSE: 'Warehouse',
    ROOM: 'Room',
    KITCHEN: 'Kitchen',
    TOILET: 'Toilet',
    HALL: 'Hall',
    PASSAGE: 'Passage',
    BALCONY: 'Balcony',
    STAIRCASE: 'Staircase',
    ITEM: 'Item',
    CUSTOM: 'Custom',
  }
  return typeLabels[type] || type
}

/**
 * Find a node by its ID in a tree structure
 */
export function findNodeById(
  tree: any[] | undefined,
  nodeId: string
): any | null {
  if (!tree) {
    return null
  }

  for (const node of tree) {
    if (node.id === nodeId) {
      return node
    }
    if (node.children) {
      const found = findNodeById(node.children, nodeId)
      if (found) {
        return found
      }
    }
  }

  return null
}
