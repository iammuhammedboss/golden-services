import { Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export interface UserWithRoles {
  id: string
  name?: string | null
  email?: string | null
  roles: string[]
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserWithRoles | null | undefined, roleName: string): boolean {
  if (!user || !user.roles) return false
  return user.roles.includes(roleName)
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: UserWithRoles | null | undefined, roleNames: string[]): boolean {
  if (!user || !user.roles) return false
  return roleNames.some((roleName) => user.roles.includes(roleName))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: UserWithRoles | null | undefined, roleNames: string[]): boolean {
  if (!user || !user.roles) return false
  return roleNames.every((roleName) => user.roles.includes(roleName))
}

/**
 * Middleware to require specific role
 * Usage in API routes:
 * const user = await requireRole(req, 'OWNER')
 */
export async function requireRole(
  session: Session | null,
  requiredRole: string | string[]
): Promise<UserWithRoles> {
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = session.user as UserWithRoles

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  if (!hasAnyRole(user, roles)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  return user
}

// ============================================
// MODULE-SPECIFIC PERMISSIONS
// ============================================

export function canManageUsers(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER'])
}

export function canManageLeads(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SALES', 'RECEPTION'])
}

export function canManageQuotations(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SALES'])
}

export function canViewQuotations(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SALES', 'ACCOUNTANT'])
}

export function canManageJobs(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SUPERVISOR'])
}

export function canManageInvoices(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'ACCOUNTANT', 'SALES'])
}

export function canViewInvoices(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'ACCOUNTANT', 'SALES', 'OPERATIONS_MANAGER'])
}

export function canManagePayments(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'ACCOUNTANT'])
}

// --- Schedule Permissions ---
/**
 * Check if user can view the schedule module.
 * Allows broad access, filtering is done at the API level.
 */
export function canViewSchedule(user: UserWithRoles | null | undefined): boolean {
  // Almost everyone can see the schedule page, but the API will filter what they see.
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SALES', 'SUPERVISOR', 'TECHNICIAN', 'DRIVER', 'RECEPTION'])
}

/**
 * Check if user has admin-level rights over all schedule entries.
 */
export function canManageAllSchedules(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER'])
}


// --- Master Data & Admin Permissions ---
export function canManageMasters(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'OWNER')
}

export function canViewAuditLogs(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'AUDITOR', 'OPERATIONS_MANAGER'])
}

export function canRestoreRecords(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'OWNER')
}

export function canViewDeletedRecords(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'AUDITOR'])
}