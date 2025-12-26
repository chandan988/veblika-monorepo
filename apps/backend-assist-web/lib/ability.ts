import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability"
import { Permission, ALL_PERMISSIONS } from "@/types/permissions"

// Define all possible actions (derived from permissions)
export type Actions =
  | "manage" // Special CASL action meaning "all actions"
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "assign"
  | "close"
  | "reply"
  | "export"
  | "add"
  | "remove"
  | "billing"

// Define all subjects (resources)
export type Subjects =
  | "all" // Special CASL subject meaning "all subjects"
  | "Ticket"
  | "Chat"
  | "Contact"
  | "Member"
  | "Role"
  | "Organisation"
  | "Integration"
  | "Report"
  | "Widget"

// Define the ability type
export type AppAbility = MongoAbility<[Actions, Subjects]>

// Map permission strings to CASL actions and subjects
const permissionMap: Record<string, { action: Actions; subject: Subjects }> = {
  // Ticket permissions
  "ticket:view": { action: "view", subject: "Ticket" },
  "ticket:create": { action: "create", subject: "Ticket" },
  "ticket:edit": { action: "edit", subject: "Ticket" },
  "ticket:delete": { action: "delete", subject: "Ticket" },
  "ticket:assign": { action: "assign", subject: "Ticket" },
  "ticket:close": { action: "close", subject: "Ticket" },

  // Chat permissions
  "chat:view": { action: "view", subject: "Chat" },
  "chat:reply": { action: "reply", subject: "Chat" },
  "chat:assign": { action: "assign", subject: "Chat" },
  "chat:close": { action: "close", subject: "Chat" },
  "chat:delete": { action: "delete", subject: "Chat" },

  // Contact permissions
  "contact:view": { action: "view", subject: "Contact" },
  "contact:create": { action: "create", subject: "Contact" },
  "contact:edit": { action: "edit", subject: "Contact" },
  "contact:delete": { action: "delete", subject: "Contact" },
  "contact:export": { action: "export", subject: "Contact" },

  // Member permissions
  "member:view": { action: "view", subject: "Member" },
  "member:add": { action: "add", subject: "Member" },
  "member:edit": { action: "edit", subject: "Member" },
  "member:remove": { action: "remove", subject: "Member" },

  // Role permissions
  "role:view": { action: "view", subject: "Role" },
  "role:create": { action: "create", subject: "Role" },
  "role:edit": { action: "edit", subject: "Role" },
  "role:delete": { action: "delete", subject: "Role" },
  "role:assign": { action: "assign", subject: "Role" },

  // Organisation permissions
  "organisation:view": { action: "view", subject: "Organisation" },
  "organisation:edit": { action: "edit", subject: "Organisation" },
  "organisation:delete": { action: "delete", subject: "Organisation" },
  "organisation:billing": { action: "billing", subject: "Organisation" },

  // Integration permissions
  "integration:view": { action: "view", subject: "Integration" },
  "integration:create": { action: "create", subject: "Integration" },
  "integration:edit": { action: "edit", subject: "Integration" },
  "integration:delete": { action: "delete", subject: "Integration" },

  // Report permissions
  "report:view": { action: "view", subject: "Report" },
  "report:export": { action: "export", subject: "Report" },

  // Widget permissions
  "widget:view": { action: "view", subject: "Widget" },
  "widget:edit": { action: "edit", subject: "Widget" },
}

/**
 * Create CASL ability from user permissions
 */
export function defineAbilityFor(
  permissions: string[],
  isOwner: boolean
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  // Owner has full access (manage all)
  if (isOwner) {
    can("manage", "all")
    return build()
  }

  // Apply each permission
  for (const permission of permissions) {
    const mapped = permissionMap[permission]
    if (mapped) {
      can(mapped.action, mapped.subject)
    }
  }

  return build()
}

/**
 * Simple permission checker without full CASL
 * Useful for simple permission string checks
 */
export function createPermissionChecker(
  userPermissions: string[],
  isOwner: boolean
) {
  return {
    can: (permission: Permission | string): boolean => {
      if (isOwner) return true
      return userPermissions.includes(permission)
    },
    cannot: (permission: Permission | string): boolean => {
      if (isOwner) return false
      return !userPermissions.includes(permission)
    },
    // Check if user has any of the given permissions
    canAny: (permissions: (Permission | string)[]): boolean => {
      if (isOwner) return true
      return permissions.some((p) => userPermissions.includes(p))
    },
    // Check if user has all of the given permissions
    canAll: (permissions: (Permission | string)[]): boolean => {
      if (isOwner) return true
      return permissions.every((p) => userPermissions.includes(p))
    },
  }
}

/**
 * Check if a permission string is valid
 */
export function isValidPermission(permission: string): permission is Permission {
  return ALL_PERMISSIONS.includes(permission as Permission)
}

/**
 * Get action and subject from permission string
 */
export function parsePermission(
  permission: string
): { action: Actions; subject: Subjects } | null {
  return permissionMap[permission] || null
}
