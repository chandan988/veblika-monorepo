/**
 * Permission types and utilities shared between frontend and backend
 * This ensures consistent permission handling across the application
 */

// All available permission strings
export const ALL_PERMISSIONS = [
  // Ticket permissions
  "ticket:view",
  "ticket:create",
  "ticket:edit",
  "ticket:delete",
  "ticket:assign",
  "ticket:close",
  // Chat permissions
  "chat:view",
  "chat:reply",
  "chat:assign",
  "chat:close",
  "chat:delete",
  // Contact permissions
  "contact:view",
  "contact:create",
  "contact:edit",
  "contact:delete",
  "contact:export",
  // Member permissions
  "member:view",
  "member:add",
  "member:edit",
  "member:remove",
  // Role permissions
  "role:view",
  "role:create",
  "role:edit",
  "role:delete",
  "role:assign",
  // Organisation permissions
  "organisation:view",
  "organisation:edit",
  "organisation:delete",
  "organisation:billing",
  // Integration permissions
  "integration:view",
  "integration:create",
  "integration:edit",
  "integration:delete",
  // Report permissions
  "report:view",
  "report:export",
  // Widget permissions
  "widget:view",
  "widget:edit",
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  ticket: {
    label: "Tickets",
    permissions: [
      { key: "ticket:view", label: "View tickets" },
      { key: "ticket:create", label: "Create tickets" },
      { key: "ticket:edit", label: "Edit tickets" },
      { key: "ticket:delete", label: "Delete tickets" },
      { key: "ticket:assign", label: "Assign tickets" },
      { key: "ticket:close", label: "Close tickets" },
    ],
  },
  chat: {
    label: "Chat / Conversations",
    permissions: [
      { key: "chat:view", label: "View chats" },
      { key: "chat:reply", label: "Reply to chats" },
      { key: "chat:assign", label: "Assign chats" },
      { key: "chat:close", label: "Close chats" },
      { key: "chat:delete", label: "Delete chats" },
    ],
  },
  contact: {
    label: "Contacts",
    permissions: [
      { key: "contact:view", label: "View contacts" },
      { key: "contact:create", label: "Create contacts" },
      { key: "contact:edit", label: "Edit contacts" },
      { key: "contact:delete", label: "Delete contacts" },
      { key: "contact:export", label: "Export contacts" },
    ],
  },
  member: {
    label: "Team Members",
    permissions: [
      { key: "member:view", label: "View members" },
      { key: "member:add", label: "Add members" },
      { key: "member:edit", label: "Edit members" },
      { key: "member:remove", label: "Remove members" },
    ],
  },
  role: {
    label: "Roles & Permissions",
    permissions: [
      { key: "role:view", label: "View roles" },
      { key: "role:create", label: "Create roles" },
      { key: "role:edit", label: "Edit roles" },
      { key: "role:delete", label: "Delete roles" },
      { key: "role:assign", label: "Assign roles" },
    ],
  },
  organisation: {
    label: "Organisation Settings",
    permissions: [
      { key: "organisation:view", label: "View settings" },
      { key: "organisation:edit", label: "Edit settings" },
      { key: "organisation:delete", label: "Delete organisation" },
      { key: "organisation:billing", label: "Manage billing" },
    ],
  },
  integration: {
    label: "Integrations",
    permissions: [
      { key: "integration:view", label: "View integrations" },
      { key: "integration:create", label: "Create integrations" },
      { key: "integration:edit", label: "Edit integrations" },
      { key: "integration:delete", label: "Delete integrations" },
    ],
  },
  report: {
    label: "Reports & Analytics",
    permissions: [
      { key: "report:view", label: "View reports" },
      { key: "report:export", label: "Export reports" },
    ],
  },
  widget: {
    label: "Widget Settings",
    permissions: [
      { key: "widget:view", label: "View widget" },
      { key: "widget:edit", label: "Edit widget" },
    ],
  },
} as const

export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES

// Role interface
export interface Role {
  _id: string
  name: string
  slug: string
  description?: string
  permissions: string[]
  isDefault: boolean
  isSystem: boolean
  organisationId: string
  createdAt: string
  updatedAt: string
}

// Member interface with role
export interface Member {
  _id: string
  userId: string
  organisationId: string
  roleId: Role | string
  isOwner: boolean
  extraPermissions: string[]
  createdAt: string
  updatedAt: string
}

// User permissions response from API
export interface UserPermissions {
  isOwner: boolean
  role: {
    _id: string
    name: string
    slug: string
  } | null
  permissions: string[]
  extraPermissions: string[]
}
