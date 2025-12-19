"use client"

import { useQuery } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"
import { sessionKeys } from "@/lib/query-keys"

export function useSessionQuery() {
  return useQuery({
    queryKey: sessionKeys.root,
    queryFn: async () => {
      const result = await authClient.getSession()
      if (result.error) {
        throw new Error(result.error.message || "Failed to load session")
      }
      return result.data
    },
  })
}
