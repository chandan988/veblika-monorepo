"use client"

import React, { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { usePermissions, useAbility } from "@/components/ability-provider"
import { Actions, Subjects } from "@/lib/ability"
import { Permission } from "@/types/permissions"

interface PermissionGuardProps {
  /**
   * Permission string to check (e.g., "ticket:view")
   * Takes precedence over action/subject if provided
   */
  permission?: Permission | string
  /**
   * Multiple permissions - user must have ANY of these
   */
  anyPermissions?: (Permission | string)[]
  /**
   * Multiple permissions - user must have ALL of these
   */
  allPermissions?: (Permission | string)[]
  /**
   * CASL action (e.g., "view", "edit")
   */
  action?: Actions
  /**
   * CASL subject (e.g., "Ticket", "Role")
   */
  subject?: Subjects
  /**
   * Require user to be owner
   */
  requireOwner?: boolean
  /**
   * What to render when user lacks permission
   * - ReactNode: Custom fallback component
   * - undefined: Render nothing
   */
  fallback?: ReactNode
  /**
   * Redirect path when user lacks permission
   * If provided, will redirect instead of showing fallback
   */
  redirectTo?: string
  /**
   * Children to render when user has permission
   */
  children: ReactNode
}

/**
 * A guard component that conditionally renders children based on user permissions
 *
 * @example
 * // Guard a section with single permission
 * <PermissionGuard permission="ticket:view">
 *   <TicketList />
 * </PermissionGuard>
 *
 * @example
 * // Guard with ANY of multiple permissions
 * <PermissionGuard anyPermissions={["ticket:edit", "ticket:assign"]}>
 *   <TicketActions />
 * </PermissionGuard>
 *
 * @example
 * // Guard with ALL permissions required
 * <PermissionGuard allPermissions={["role:view", "role:edit"]}>
 *   <RoleEditor />
 * </PermissionGuard>
 *
 * @example
 * // Owner-only section
 * <PermissionGuard requireOwner fallback={<AccessDenied />}>
 *   <DangerZone />
 * </PermissionGuard>
 *
 * @example
 * // Redirect if no permission
 * <PermissionGuard permission="organisation:edit" redirectTo="/dashboard">
 *   <BillingPage />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  anyPermissions,
  allPermissions,
  action,
  subject,
  requireOwner = false,
  fallback,
  redirectTo,
  children,
}: PermissionGuardProps) {
  const router = useRouter()
  const { can, canAny, canAll, isOwner, isLoaded } = usePermissions()
  const ability = useAbility()

  // Don't render anything while permissions are loading
  if (!isLoaded) {
    return null
  }

  // Determine if user has permission
  let hasPermission = true

  if (requireOwner) {
    hasPermission = isOwner
  } else if (permission) {
    hasPermission = can(permission)
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasPermission = canAny(anyPermissions)
  } else if (allPermissions && allPermissions.length > 0) {
    hasPermission = canAll(allPermissions)
  } else if (action && subject) {
    hasPermission = ability.can(action, subject)
  }

  // Handle no permission
  if (!hasPermission) {
    if (redirectTo) {
      router.replace(redirectTo)
      return null
    }
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

/**
 * Higher-order component version of PermissionGuard
 * Useful for wrapping entire pages
 */
export function withPermissionGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, "children">
) {
  return function GuardedComponent(props: P) {
    return (
      <PermissionGuard {...guardProps}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * Component to show access denied message
 */
export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to view this content.",
  showBackButton = true,
}: {
  title?: string
  message?: string
  showBackButton?: boolean
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="rounded-full bg-red-100 p-4 mb-4">
        <svg
          className="w-12 h-12 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {showBackButton && (
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      )}
    </div>
  )
}

/**
 * Pre-built guards for common use cases
 */
export const Guards = {
  /**
   * Only owners can access
   */
  OwnerOnly: ({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback?: ReactNode
  }) => (
    <PermissionGuard requireOwner fallback={fallback}>
      {children}
    </PermissionGuard>
  ),

  /**
   * Can view tickets
   */
  CanViewTickets: ({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback?: ReactNode
  }) => (
    <PermissionGuard permission="ticket:view" fallback={fallback}>
      {children}
    </PermissionGuard>
  ),

  /**
   * Can manage roles (view + edit + create)
   */
  CanManageRoles: ({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback?: ReactNode
  }) => (
    <PermissionGuard
      allPermissions={["role:view", "role:edit", "role:create"]}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  ),

  /**
   * Can manage members
   */
  CanManageMembers: ({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback?: ReactNode
  }) => (
    <PermissionGuard
      anyPermissions={["member:add", "member:edit", "member:remove"]}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  ),

  /**
   * Can access organisation settings
   */
  CanAccessSettings: ({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback?: ReactNode
  }) => (
    <PermissionGuard permission="organisation:view" fallback={fallback}>
      {children}
    </PermissionGuard>
  ),
}
