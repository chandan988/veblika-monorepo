"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useOrganisationStore } from "@/stores/organisation-store"
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAvailablePermissions,
  assignRole,
  updateMemberPermissions,
  CreateRoleInput,
  UpdateRoleInput,
} from "@/services/role-api"

/**
 * Hook to fetch all roles for the active organisation
 */
export function useRoles() {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["roles", activeOrganisation?._id],
    queryFn: () => getRoles(activeOrganisation!._id),
    enabled: !!activeOrganisation?._id,
  })
}

/**
 * Hook to fetch a single role by ID
 */
export function useRole(roleId: string | undefined) {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["role", activeOrganisation?._id, roleId],
    queryFn: () => getRoleById(activeOrganisation!._id, roleId!),
    enabled: !!activeOrganisation?._id && !!roleId,
  })
}

/**
 * Hook to fetch available permissions
 */
export function useAvailablePermissions() {
  const { activeOrganisation } = useOrganisationStore()

  return useQuery({
    queryKey: ["available-permissions", activeOrganisation?._id],
    queryFn: () => getAvailablePermissions(activeOrganisation!._id),
    enabled: !!activeOrganisation?._id,
    staleTime: Infinity, // Permissions list is static
  })
}

/**
 * Hook to create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: (data: CreateRoleInput) =>
      createRole(activeOrganisation!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["roles", activeOrganisation?._id],
      })
    },
  })
}

/**
 * Hook to update a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleInput }) =>
      updateRole(activeOrganisation!._id, roleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["roles", activeOrganisation?._id],
      })
      queryClient.invalidateQueries({
        queryKey: ["role", activeOrganisation?._id, variables.roleId],
      })
    },
  })
}

/**
 * Hook to delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: (roleId: string) =>
      deleteRole(activeOrganisation!._id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["roles", activeOrganisation?._id],
      })
    },
  })
}

/**
 * Hook to assign a role to a member
 */
export function useAssignRole() {
  const queryClient = useQueryClient()
  const { activeOrganisation } = useOrganisationStore()

  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      assignRole(activeOrganisation!._id, memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", activeOrganisation?._id],
      })
      queryClient.invalidateQueries({
        queryKey: ["permissions", activeOrganisation?._id],
      })
    },
  })
}

/**
 * Hook to update member's extra permissions
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
      queryClient.invalidateQueries({
        queryKey: ["permissions", activeOrganisation?._id],
      })
    },
  })
}
