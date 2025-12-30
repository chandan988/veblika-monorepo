"use client"

import { useEffect } from "react"
import { useLoadPermissions } from "@/hooks/use-permissions"
import { useOrganisationStore } from "@/stores/organisation-store"
import { usePermissionsStore } from "@/stores/permissions-store"

/**
 * Component that loads permissions when organisation changes
 * Should be placed in the main layout after authentication
 */
export function PermissionsLoader() {
  const { activeOrganisation } = useOrganisationStore()
  const { clearPermissions } = usePermissionsStore()
  
  // Load permissions for the active organisation
  useLoadPermissions()

  // Clear permissions when no active organisation
  useEffect(() => {
    if (!activeOrganisation) {
      clearPermissions()
    }
  }, [activeOrganisation, clearPermissions])

  return null
}

export default PermissionsLoader
