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
  Member,
} from "@/services/member-api"

/**
 * Hook to fetch all members for the active organisation
 */
export function useMembers() {
  const { activeOrganisation } = useOrganisationStore()
  
  console.log("useMembers - activeOrganisation:", activeOrganisation?._id)

  return useQuery({
    queryKey: ["members", activeOrganisation?._id],
    queryFn: async () => {
      const result = await getMembers(activeOrganisation!._id)
      console.log("useMembers - fetched members:", result)
      return result
    },
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
