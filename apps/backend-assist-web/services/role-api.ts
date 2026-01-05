import { api } from "./api"
import { Role, UserPermissions } from "@/types/permissions"

// ============================================
// Role API
// ============================================

export interface CreateRoleInput {
  name: string
  description?: string
  permissions: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: string[]
}

/**
 * Get all roles for an organisation
 */
export async function getRoles(orgId: string): Promise<Role[]> {
  const response = await api.get(`/organisations/${orgId}/roles`)
  return response.data.data
}

/**
 * Get a single role by ID
 */
export async function getRoleById(
  orgId: string,
  roleId: string
): Promise<Role> {
  const response = await api.get(
    `/organisations/${orgId}/roles/${roleId}`
  )
  return response.data.data
}

/**
 * Create a new role
 */
export async function createRole(
  orgId: string,
  data: CreateRoleInput
): Promise<Role> {
  const response = await api.post(
    `/organisations/${orgId}/roles`,
    data
  )
  return response.data.data
}

/**
 * Update a role
 */
export async function updateRole(
  orgId: string,
  roleId: string,
  data: UpdateRoleInput
): Promise<Role> {
  const response = await api.put(
    `/organisations/${orgId}/roles/${roleId}`,
    data
  )
  return response.data.data
}

/**
 * Delete a role
 */
export async function deleteRole(
  orgId: string,
  roleId: string
): Promise<void> {
  await api.delete(`/organisations/${orgId}/roles/${roleId}`)
}

/**
 * Get available permissions
 */
export async function getAvailablePermissions(
  orgId: string
): Promise<{
  permissions: string[]
  metadata: Record<string, unknown>
}> {
  const response = await api.get(
    `/organisations/${orgId}/roles/permissions`
  )
  return response.data.data
}

/**
 * Get current user's permissions in an organisation
 */
export async function getMyPermissions(
  orgId: string
): Promise<UserPermissions> {
  const response = await api.get(`/organisations/${orgId}/roles/me`)
  return response.data.data
}

/**
 * Assign a role to a member
 */
export async function assignRole(
  orgId: string,
  memberId: string,
  roleId: string
): Promise<void> {
  await api.post(`/organisations/${orgId}/roles/assign`, {
    memberId,
    roleId,
  })
}

/**
 * Update member's extra permissions
 */
export async function updateMemberPermissions(
  orgId: string,
  memberId: string,
  extraPermissions: string[]
): Promise<void> {
  await api.put(
    `/organisations/${orgId}/roles/members/${memberId}/permissions`,
    { extraPermissions }
  )
}
