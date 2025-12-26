"use client"

import React, { ReactNode, ComponentProps } from "react"
import { Button } from "@workspace/ui/components/button"
import { usePermissions, useAbility } from "@/components/ability-provider"
import { Actions, Subjects } from "@/lib/ability"
import { Permission } from "@/types/permissions"

type ButtonProps = ComponentProps<typeof Button>

type PermissionButtonOwnProps = {
  /**
   * Permission string to check (e.g., "ticket:create")
   * Takes precedence over action/subject if provided
   */
  permission?: Permission | string
  /**
   * CASL action (e.g., "create", "edit")
   */
  action?: Actions
  /**
   * CASL subject (e.g., "Ticket", "Role")
   */
  subject?: Subjects
  /**
   * What to render when user lacks permission
   * - "hide": Don't render anything (default)
   * - "disable": Render disabled button
   * - ReactNode: Custom fallback
   */
  fallback?: "hide" | "disable" | ReactNode
  /**
   * Tooltip to show when disabled due to lack of permission
   */
  disabledTooltip?: string
  children: ReactNode
}

type PermissionButtonProps = Omit<ButtonProps, keyof PermissionButtonOwnProps> & PermissionButtonOwnProps

/**
 * A button that only renders or enables based on user permissions
 * 
 * @example
 * // Using permission string
 * <PermissionButton permission="ticket:create" onClick={handleCreate}>
 *   Create Ticket
 * </PermissionButton>
 * 
 * @example
 * // Using CASL action/subject
 * <PermissionButton action="create" subject="Ticket" onClick={handleCreate}>
 *   Create Ticket
 * </PermissionButton>
 * 
 * @example
 * // Show disabled instead of hiding
 * <PermissionButton 
 *   permission="role:delete" 
 *   fallback="disable"
 *   disabledTooltip="You don't have permission to delete roles"
 * >
 *   Delete Role
 * </PermissionButton>
 */
export function PermissionButton({
  permission,
  action,
  subject,
  fallback = "hide",
  disabledTooltip,
  children,
  ...props
}: PermissionButtonProps) {
  const { can } = usePermissions()
  const ability = useAbility()

  // Determine if user has permission
  let hasPermission = false
  
  if (permission) {
    hasPermission = can(permission)
  } else if (action && subject) {
    hasPermission = ability.can(action, subject)
  } else {
    // No permission check required
    hasPermission = true
  }

  // Handle fallback behavior
  if (!hasPermission) {
    if (fallback === "hide") {
      return null
    }
    
    if (fallback === "disable") {
      return (
        <Button
          {...props}
          disabled
          title={disabledTooltip || "You don't have permission for this action"}
        >
          {children}
        </Button>
      )
    }
    
    // Custom fallback
    return <>{fallback}</>
  }

  return (
    <Button {...props}>
      {children}
    </Button>
  )
}

/**
 * Simplified button variants for common permissions
 */
export const TicketButtons = {
  Create: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="ticket:create" {...props} />
  ),
  Edit: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="ticket:edit" {...props} />
  ),
  Delete: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="ticket:delete" {...props} />
  ),
  Assign: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="ticket:assign" {...props} />
  ),
}

export const RoleButtons = {
  Create: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="role:create" {...props} />
  ),
  Edit: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="role:edit" {...props} />
  ),
  Delete: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="role:delete" {...props} />
  ),
}

export const MemberButtons = {
  Add: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="member:add" {...props} />
  ),
  Edit: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="member:edit" {...props} />
  ),
  Remove: (props: Omit<PermissionButtonProps, "permission">) => (
    <PermissionButton permission="member:remove" {...props} />
  ),
}
