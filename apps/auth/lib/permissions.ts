import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

/**
 * Define all the resources and actions available in the application
 * Using 'as const' for proper TypeScript inference
 */
const statement = {
  ...defaultStatements, // organization, member, invitation
  project: ["create", "update", "delete", "read", "share"],
  team: ["create", "update", "delete", "read"],
  ticket: ["create", "update", "delete", "read", "assign"],
  comment: ["create", "update", "delete", "read"],
  settings: ["update", "read"],
} as const

/**
 * Create the access control instance
 */
export const ac = createAccessControl(statement)

/**
 * Define roles with their permissions
 */

// Owner - Full control over everything
export const owner = ac.newRole({
  ...ownerAc.statements,
  project: ["create", "update", "delete", "read", "share"],
  team: ["create", "update", "delete", "read"],
  ticket: ["create", "update", "delete", "read", "assign"],
  comment: ["create", "update", "delete", "read"],
  settings: ["update", "read"],
})

// Admin - Can manage most things except deleting organization
export const admin = ac.newRole({
  ...adminAc.statements,
  project: ["create", "update", "delete", "read", "share"],
  team: ["create", "update", "delete", "read"],
  ticket: ["create", "update", "delete", "read", "assign"],
  comment: ["create", "update", "delete", "read"],
  settings: ["update", "read"],
})

// Member - Basic member with limited permissions
export const member = ac.newRole({
  ...memberAc.statements,
  project: ["create", "read"],
  team: ["read"],
  ticket: ["create", "update", "read"],
  comment: ["create", "update", "read"],
  settings: ["read"],
})

// Project Manager - Can manage projects and tickets
export const projectManager = ac.newRole({
  project: ["create", "update", "read", "share"],
  team: ["read"],
  ticket: ["create", "update", "read", "assign"],
  comment: ["create", "update", "delete", "read"],
  settings: ["read"],
  organization: ["update"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
})

// Support Agent - Focused on ticket management
export const supportAgent = ac.newRole({
  project: ["read"],
  team: ["read"],
  ticket: ["create", "update", "read"],
  comment: ["create", "update", "read"],
  settings: ["read"],
})

// Viewer - Read-only access
export const viewer = ac.newRole({
  project: ["read"],
  team: ["read"],
  ticket: ["read"],
  comment: ["read"],
  settings: ["read"],
})
