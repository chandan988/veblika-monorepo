"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useOrganisationStore } from "@/stores/organisation-store"
import {
  getMembers,
  getMemberById,
  getMemberCount,
  updateMemberRole,
  updateMemberPermissions,
  removeMember,
  createInvitation,
  getInvitations,
  getInvitationById,
  acceptInvitation,
  cancelInvitation,
  CreateInvitationInput,
} from "@/services/member-api"

/**
 * Hook to fetch all members for the active organisation
 */
export function useMembers() {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["members", activeOrganisation?._id],
    queryFn: () => getMembers(activeOrganisation!._id),
    enabled: !!activeOrganisation?._id,
  })
}

/**
 * Hook to fetch a single member by ID
 */
export function useMember(memberId: string | undefined) {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["member", activeOrganisation?._id, memberId],
    queryFn: () => getMemberById(activeOrganisation!._id, memberId!),
    enabled: !!activeOrganisation?._id && !!memberId,
  })
}

/**
 * Hook to fetch member count
 */
export function useMemberCount() {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["member-count", activeOrganisation?._id],
    queryFn: () => getMemberCount(activeOrganisation!._id),
    enabled: !!activeOrganisation?._id,
  })
}

/**
 * Hook to update a member's role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateMemberRole(activeOrganisation!._id, memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", activeOrganisation?._id],
      })
    },
  })
}

/**
 * Hook to update a member's extra permissions
 */
export function useUpdateMemberPermissions() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: ({
      memberId,
      extraPermissions,
    }: {
      memberId: string
      extraPermissions: string[]
    }) =>
      updateMemberPermissions(
        activeOrganisation!._id,
        memberId,
        extraPermissions
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", activeOrganisation?._id],
      })
    },
  })
}

/**
 * Hook to remove a member
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: (memberId: string) =>
      removeMember(activeOrganisation!._id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", activeOrganisation?._id],
      })
      queryClient.invalidateQueries({
        queryKey: ["member-count", activeOrganisation?._id],
      })
    },
  })
}

// ============================================
// Invitation Hooks
// ============================================

/**
 * Hook to fetch all invitations for the active organisation
 */
export function useInvitations() {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["invitations", activeOrganisation?._id],
    queryFn: () => getInvitations(activeOrganisation!._id),
    enabled: !!activeOrganisation?._id,
  })
}

/**
 * Hook to fetch a single invitation by ID (public)
 */
export function useInvitation(invitationId: string | undefined) {
  return useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: () => getInvitationById(invitationId!),
    enabled: !!invitationId,
    retry: false,
  })
}

/**
 * Hook to create/send a new invitation
 */
export function useInviteMember() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: (input: CreateInvitationInput) =>
      createInvitation(activeOrganisation!._id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invitations", activeOrganisation?._id],
      })
    },
  })
}

/**
 * Hook to accept an invitation
 */
export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
  })
}

/**
 * Hook to cancel an invitation
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: (invitationId: string) =>
      cancelInvitation(activeOrganisation!._id, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invitations", activeOrganisation?._id],
      })
    },
  })
}

