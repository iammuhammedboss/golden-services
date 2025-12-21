/**
 * Sales Executive Mapping Utility
 * Maps user names to their sales executive codes
 */

interface SalesExecutive {
  code: string
  id: string
  name: string
}

// Sales executive mapping based on user names
const SALES_EXECUTIVES: Record<string, SalesExecutive> = {
  jesfin: {
    code: 'JS',
    id: 'JS-2399',
    name: 'Jesfin',
  },
  hossam: {
    code: 'HS',
    id: 'HS-2398',
    name: 'Hossam',
  },
  ashlin: {
    code: 'AS',
    id: 'AS-2397',
    name: 'Ashlin',
  },
}

/**
 * Get sales executive ID from user name
 * @param userName - The user's name
 * @returns Sales executive ID (e.g., "JS-2399") or null if not found
 */
export function getSalesExecutiveId(userName: string | null | undefined): string | null {
  if (!userName) return null

  const normalizedName = userName.toLowerCase().trim()

  // Try exact match first
  if (SALES_EXECUTIVES[normalizedName]) {
    return SALES_EXECUTIVES[normalizedName].id
  }

  // Try partial match (if name contains the executive's name)
  for (const [key, executive] of Object.entries(SALES_EXECUTIVES)) {
    if (normalizedName.includes(key) || normalizedName.includes(executive.name.toLowerCase())) {
      return executive.id
    }
  }

  return null
}

/**
 * Get sales executive code from user name
 * @param userName - The user's name
 * @returns Sales executive code (e.g., "JS") or null if not found
 */
export function getSalesExecutiveCode(userName: string | null | undefined): string | null {
  if (!userName) return null

  const normalizedName = userName.toLowerCase().trim()

  // Try exact match first
  if (SALES_EXECUTIVES[normalizedName]) {
    return SALES_EXECUTIVES[normalizedName].code
  }

  // Try partial match
  for (const [key, executive] of Object.entries(SALES_EXECUTIVES)) {
    if (normalizedName.includes(key) || normalizedName.includes(executive.name.toLowerCase())) {
      return executive.code
    }
  }

  return null
}

/**
 * Get sales executive details from user name
 * @param userName - The user's name
 * @returns Sales executive details or null if not found
 */
export function getSalesExecutive(userName: string | null | undefined): SalesExecutive | null {
  if (!userName) return null

  const normalizedName = userName.toLowerCase().trim()

  // Try exact match first
  if (SALES_EXECUTIVES[normalizedName]) {
    return SALES_EXECUTIVES[normalizedName]
  }

  // Try partial match
  for (const [key, executive] of Object.entries(SALES_EXECUTIVES)) {
    if (normalizedName.includes(key) || normalizedName.includes(executive.name.toLowerCase())) {
      return executive
    }
  }

  return null
}
