"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useOrganisationStore } from "@/stores/organisation-store"
import { usePermissionsStore } from "@/stores/permissions-store"
import { getMyPermissions } from "@/services/role-api"

/**
 * Hook to load and sync user permissions for the active organisation
 * Should be used in the main layout or app provider
 */
export function useLoadPermissions() {
  const { activeOrganisation } = useOrganisationStore()
  const { setPermissions, clearPermissions, isLoaded } = usePermissionsStore()

  const query = useQuery({
    queryKey: ["permissions", activeOrganisation?._id],
    queryFn: async () => {
      if (!activeOrganisation?._id) {
        return null
      }
      const result = await getMyPermissions(activeOrganisation._id)
      console.log("useLoadPermissions - API result:", result)
      return result
    },
    enabled: !!activeOrganisation?._id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  console.log("useLoadPermissions - state:", {
    activeOrgId: activeOrganisation?._id,
    queryStatus: query.status,
    queryData: query.data,
    storeIsLoaded: isLoaded,
    queryError: query.error,
  })

  // Sync permissions to store
  useEffect(() => {
    if (query.data) {
      setPermissions(query.data)
    } else if (!activeOrganisation?._id) {
      clearPermissions()
    }
  }, [query.data, activeOrganisation?._id, setPermissions, clearPermissions])

  return {
    ...query,
    isLoading: query.isLoading,
    permissions: query.data,
  }
}

/**
 * Hook to refetch permissions (useful after role changes)
 */
export function useRefreshPermissions() {
  const { activeOrganisation } = useOrganisationStore()
  const { refetch } = useQuery({
    queryKey: ["permissions", activeOrganisation?._id],
    enabled: false, // Don't auto-fetch, just use for refetch
  })

  return refetch
}
