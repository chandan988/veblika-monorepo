import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { UserPermissions } from "@/types/permissions"

interface PermissionsStore {
  // State
  memberId: string | null
  isOwner: boolean
  role: {
    _id: string
    name: string
    slug: string
  } | null
  permissions: string[]
  extraPermissions: string[]
  isLoaded: boolean

  // Actions
  setPermissions: (data: UserPermissions) => void
  clearPermissions: () => void

  // Permission checks
  can: (permission: string) => boolean
  canAny: (permissions: string[]) => boolean
  canAll: (permissions: string[]) => boolean
}

export const usePermissionsStore = create<PermissionsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      memberId: null,
      isOwner: false,
      role: null,
      permissions: [],
      extraPermissions: [],
      isLoaded: false,

      // Actions
      setPermissions: (data) => {
        set({
          memberId: data.memberId,
          isOwner: data.isOwner,
          role: data.role,
          permissions: data.permissions,
          extraPermissions: data.extraPermissions,
          isLoaded: true,
        })
      },

      clearPermissions: () => {
        set({
          memberId: null,
          isOwner: false,
          role: null,
          permissions: [],
          extraPermissions: [],
          isLoaded: false,
        })
      },

      // Permission checks
      can: (permission) => {
        const state = get()
        if (state.isOwner) return true
        return state.permissions.includes(permission)
      },

      canAny: (permissions) => {
        const state = get()
        if (state.isOwner) return true
        return permissions.some((p) => state.permissions.includes(p))
      },

      canAll: (permissions) => {
        const state = get()
        if (state.isOwner) return true
        return permissions.every((p) => state.permissions.includes(p))
      },
    }),
    { name: "permissions-store" }
  )
)
