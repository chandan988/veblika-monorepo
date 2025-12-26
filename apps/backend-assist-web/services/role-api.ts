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
export async function getRoles(organisationId: string): Promise<Role[]> {
  const response = await api.get(`/organisations/${organisationId}/roles`)
  return response.data.data
}

/**
 * Get a single role by ID
 */
export async function getRoleById(
  organisationId: string,
  roleId: string
): Promise<Role> {
  const response = await api.get(
    `/organisations/${organisationId}/roles/${roleId}`
  )
  return response.data.data
}

/**
 * Create a new role
 */
export async function createRole(
  organisationId: string,
  data: CreateRoleInput
): Promise<Role> {
  const response = await api.post(
    `/organisations/${organisationId}/roles`,
    data
  )
  return response.data.data
}

/**
 * Update a role
 */
export async function updateRole(
  organisationId: string,
  roleId: string,
  data: UpdateRoleInput
): Promise<Role> {
  const response = await api.put(
    `/organisations/${organisationId}/roles/${roleId}`,
    data
  )
  return response.data.data
}

/**
 * Delete a role
 */
export async function deleteRole(
  organisationId: string,
  roleId: string
): Promise<void> {
  await api.delete(`/organisations/${organisationId}/roles/${roleId}`)
}

/**
 * Get available permissions
 */
export async function getAvailablePermissions(
  organisationId: string
): Promise<{
  permissions: string[]
  metadata: Record<string, unknown>
}> {
  const response = await api.get(
    `/organisations/${organisationId}/roles/permissions`
  )
  return response.data.data
}

/**
 * Get current user's permissions in an organisation
 */
export async function getMyPermissions(
  organisationId: string
): Promise<UserPermissions> {
  const response = await api.get(`/organisations/${organisationId}/roles/me`)
  return response.data.data
}

/**
 * Assign a role to a member
 */
export async function assignRole(
  organisationId: string,
  memberId: string,
  roleId: string
): Promise<void> {
  await api.post(`/organisations/${organisationId}/roles/assign`, {
    memberId,
    roleId,
  })
}

/**
 * Update member's extra permissions
 */
export async function updateMemberPermissions(
  organisationId: string,
  memberId: string,
  extraPermissions: string[]
): Promise<void> {
  await api.put(
    `/organisations/${organisationId}/roles/members/${memberId}/permissions`,
    { extraPermissions }
  )
}
