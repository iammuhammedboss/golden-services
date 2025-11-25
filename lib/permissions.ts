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

/**
 * Check if user can manage users (OWNER or OPERATIONS_MANAGER)
 */
export function canManageUsers(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER'])
}

/**
 * Check if user can manage leads (OWNER, OPERATIONS_MANAGER, SALES)
 */
export function canManageLeads(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SALES'])
}

/**
 * Check if user can manage quotations (OWNER, OPERATIONS_MANAGER, SALES)
 */
export function canManageQuotations(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SALES'])
}

/**
 * Check if user can manage job orders (OWNER, OPERATIONS_MANAGER, SUPERVISOR)
 */
export function canManageJobs(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'OPERATIONS_MANAGER', 'SUPERVISOR'])
}

/**
 * Check if user can view financial data (OWNER, ACCOUNTANT)
 */
export function canViewFinancials(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'ACCOUNTANT'])
}

/**
 * Check if user is owner
 */
export function isOwner(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'OWNER')
}

/**
 * Check if user can perform audits
 */
export function canAudit(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, ['OWNER', 'AUDITOR', 'OPERATIONS_MANAGER'])
}
