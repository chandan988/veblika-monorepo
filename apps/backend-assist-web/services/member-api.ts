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
  userId: string
  user: MemberUser
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
export async function getMembers(orgId: string): Promise<Member[]> {
  const response = await api.get(`/organisations/${orgId}/members`)
  return response.data.data
}

/**
 * Get a single member by ID
 */
export async function getMemberById(
  orgId: string,
  memberId: string
): Promise<Member> {
  const response = await api.get(
    `/organisations/${orgId}/members/${memberId}`
  )
  return response.data.data
}

/**
 * Get member count for an organisation
 */
export async function getMemberCount(
  orgId: string
): Promise<MemberCount> {
  const response = await api.get(
    `/organisations/${orgId}/members/count`
  )
  return response.data.data
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  orgId: string,
  memberId: string,
  roleId: string
): Promise<Member> {
  const response = await api.put(
    `/organisations/${orgId}/members/${memberId}/role`,
    { roleId }
  )
  return response.data.data
}

/**
 * Update a member's extra permissions
 */
export async function updateMemberPermissions(
  orgId: string,
  memberId: string,
  extraPermissions: string[]
): Promise<Member> {
  const response = await api.put(
    `/organisations/${orgId}/members/${memberId}/permissions`,
    { extraPermissions }
  )
  return response.data.data
}

/**
 * Remove a member from the organisation
 */
export async function removeMember(
  orgId: string,
  memberId: string
): Promise<void> {
  await api.delete(`/organisations/${orgId}/members/${memberId}`)
}

// ============================================
// Invitation API
// ============================================

export interface Invitation {
  _id: string
  email: string
  orgId: {
    _id: string
    name: string
    slug: string
    logo?: string
  }
  roleId: {
    _id: string
    name: string
    slug: string
  }
  invitedBy: {
    _id: string
    userId?: string
    metadata?: {
      name: string
      email: string
      image?: string
    }
  }
  status: "pending" | "accepted" | "expired"
  userExists: boolean
  expiresAt: string
  createdAt: string
  acceptedAt?: string
}

export interface CreateInvitationInput {
  email: string
  roleId: string
}

/**
 * Create a new invitation
 */
export async function createInvitation(
  orgId: string,
  input: CreateInvitationInput
): Promise<Invitation> {
  const response = await api.post(
    `/organisations/${orgId}/invitations`,
    input
  )
  return response.data.data
}

/**
 * Get all invitations for an organisation
 */
export async function getInvitations(
  orgId: string
): Promise<Invitation[]> {
  const response = await api.get(
    `/organisations/${orgId}/invitations`
  )
  return response.data.data
}

/**
 * Get invitation by ID (public endpoint)
 */
export async function getInvitationById(
  invitationId: string
): Promise<Invitation> {
  const response = await api.get(`/invitations/${invitationId}`)
  return response.data.data
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(invitationId: string): Promise<{
  success: boolean
  orgId: string
}> {
  const response = await api.post(`/invitations/${invitationId}/accept`)
  return response.data.data
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(
  orgId: string,
  invitationId: string
): Promise<void> {
  await api.delete(
    `/organisations/${orgId}/invitations/${invitationId}`
  )
}
