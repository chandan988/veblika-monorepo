import { api } from "./api"

// Types
export interface MemberUser {
  _id: string
  name: string
  email: string
  image?: string
}

export interface MemberRole {
  _id: string
  name: string
  slug: string
}

export interface Member {
  _id: string
  userId: MemberUser
  role: MemberRole | null
  isOwner: boolean
  extraPermissions: string[]
  createdAt: string
  updatedAt: string
}

export interface MemberCount {
  count: number
}

// ============================================
// Member API
// ============================================

/**
 * Get all members for an organisation
 */
export async function getMembers(organisationId: string): Promise<Member[]> {
  const response = await api.get(`/organisations/${organisationId}/members`)
  return response.data.data
}

/**
 * Get a single member by ID
 */
export async function getMemberById(
  organisationId: string,
  memberId: string
): Promise<Member> {
  const response = await api.get(
    `/organisations/${organisationId}/members/${memberId}`
  )
  return response.data.data
}

/**
 * Get member count for an organisation
 */
export async function getMemberCount(
  organisationId: string
): Promise<MemberCount> {
  const response = await api.get(
    `/organisations/${organisationId}/members/count`
  )
  return response.data.data
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  organisationId: string,
  memberId: string,
  roleId: string
): Promise<Member> {
  const response = await api.put(
    `/organisations/${organisationId}/members/${memberId}/role`,
    { roleId }
  )
  return response.data.data
}

/**
 * Update a member's extra permissions
 */
export async function updateMemberPermissions(
  organisationId: string,
  memberId: string,
  extraPermissions: string[]
): Promise<Member> {
  const response = await api.put(
    `/organisations/${organisationId}/members/${memberId}/permissions`,
    { extraPermissions }
  )
  return response.data.data
}

/**
 * Remove a member from the organisation
 */
export async function removeMember(
  organisationId: string,
  memberId: string
): Promise<void> {
  await api.delete(`/organisations/${organisationId}/members/${memberId}`)
}
