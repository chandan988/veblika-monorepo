import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability"
import { IMember } from "../api/models/member-model"
import { IRole } from "../api/models/role-model"
import permissions from "./permissions.json"

// Define all possible actions
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
  | { kind: string; orgId?: string }

// Define the ability type
export type AppAbility = MongoAbility<[Actions, Subjects]>

// Map permission strings to CASL actions and subjects
const permissionMap: Record<string, { action: Actions; subject: Subjects }> = {
  // Ticket permissions
  "ticket:view": { action: "view", subject: "Ticket" },
  "ticket:reply": { action: "reply", subject: "Ticket" },
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

// Get all static permissions
export function getAllPermissions(): string[] {
  return permissions.allPermissions
}

// Get permission metadata
export function getPermissionsMetadata() {
  return permissions.permissions
}

// Get default roles configuration
export function getDefaultRolesConfig() {
  return permissions.defaultRoles
}

// Interface for member with populated role
export interface MemberWithRole extends Omit<IMember, "roleId"> {
  roleId: IRole | null
  isOwner: boolean
  extraPermissions: string[]
}

/**
 * Define abilities for a member within their organisation context
 * @param member - The member document with populated role
 * @param orgId - The organisation context (reserved for future conditions)
 */
export function defineAbilityFor(
  member: MemberWithRole | null,
  orgId: string
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  // Reserved for future use - will be used for organisation-scoped conditions
  void orgId

  if (!member) {
    // No member = no permissions (guest/unauthenticated)
    return build()
  }

  // Owner has full access (manage all)
  if (member.isOwner) {
    can("manage", "all")
    return build()
  }

  // Collect permissions: role permissions + extra permissions
  const rolePermissions = member.roleId?.permissions || []
  const extraPermissions = member.extraPermissions || []
  const allMemberPermissions = [...new Set([...rolePermissions, ...extraPermissions])]

  // Apply each permission
  for (const permission of allMemberPermissions) {
    const mapped = permissionMap[permission]
    if (mapped) {
      // Apply permission - cast to string subjects for proper typing
      can(mapped.action as Actions, mapped.subject as Exclude<Subjects, { kind: string; orgId?: string }>)
    }
  }

  return build()
}

/**
 * Create a simple ability checker from permission strings
 * Useful for frontend where we don't need full CASL conditions
 */
export function createPermissionChecker(userPermissions: string[], isOwner: boolean) {
  return {
    can: (permission: string): boolean => {
      if (isOwner) return true
      return userPermissions.includes(permission)
    },
    cannot: (permission: string): boolean => {
      if (isOwner) return false
      return !userPermissions.includes(permission)
    },
  }
}

/**
 * Parse a permission string into action and subject
 */
export function parsePermission(permission: string): { action: string; subject: string } | null {
  const [subject, action] = permission.split(":")
  if (!subject || !action) return null
  return { action, subject }
}

/**
 * Build a permission string from action and subject
 */
export function buildPermission(subject: string, action: string): string {
  return `${subject}:${action}`
}

export { permissions }
