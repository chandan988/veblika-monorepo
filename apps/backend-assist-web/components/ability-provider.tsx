"use client"

import React, { useMemo, ReactNode } from "react"
import { createContext } from "react"
import { createContextualCan, useAbility as useCaslAbility } from "@casl/react"
import {
  AppAbility,
  defineAbilityFor,
  createPermissionChecker,
  Actions,
  Subjects,
} from "@/lib/ability"
import { usePermissionsStore } from "@/stores/permissions-store"

// Create the CASL ability context
export const AbilityContext = createContext<AppAbility>(undefined!)

// Create the Can component using @casl/react
export const Can = createContextualCan(AbilityContext.Consumer)

interface AbilityProviderProps {
  children: ReactNode
}

/**
 * Provider component that creates and provides CASL ability based on user permissions
 */
export function AbilityProvider({ children }: AbilityProviderProps) {
  const { permissions, isOwner, isLoaded } = usePermissionsStore()

  const ability = useMemo(() => {
    if (!isLoaded) {
      // Return empty ability while loading
      return defineAbilityFor([], false)
    }
    return defineAbilityFor(permissions, isOwner)
  }, [permissions, isOwner, isLoaded])

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

/**
 * Hook to access the CASL ability instance
 * Uses @casl/react's useAbility hook
 */
export function useAbility(): AppAbility {
  return useCaslAbility(AbilityContext)
}

/**
 * Hook to get a simple permission checker
 * Returns functions to check permissions by string
 */
export function usePermissions() {
  const { permissions, isOwner, role, isLoaded } = usePermissionsStore()

  const checker = useMemo(
    () => createPermissionChecker(permissions, isOwner),
    [permissions, isOwner]
  )

  return {
    ...checker,
    isOwner,
    role,
    permissions,
    isLoaded,
  }
}

/**
 * Hook to check a single permission
 */
export function useHasPermission(permission: string): boolean {
  const { can } = usePermissions()
  return can(permission)
}

/**
 * Hook to check multiple permissions (any)
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { canAny } = usePermissions()
  return canAny(permissions)
}

/**
 * Hook to check multiple permissions (all)
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const { canAll } = usePermissions()
  return canAll(permissions)
}

/**
 * Hook to check if user can perform an action on a subject (CASL style)
 */
export function useCan(action: Actions, subject: Subjects): boolean {
  const ability = useAbility()
  return ability.can(action, subject)
}
