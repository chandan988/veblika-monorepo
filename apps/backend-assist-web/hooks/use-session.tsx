"use client"

import { authClient } from "@/lib/auth-client"
import { useOrganisationStore } from "@/stores/organisation-store"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useSession = () => {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const session = await authClient.getSession()
      return session
    },
    staleTime: 60 * 10 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      await authClient.signOut()
    },
    onSuccess: () => {
      // Todo : Clear organisation store on logout below approach is not working
      // useOrganisationStore.getState().clearStore()
      // localStorage.removeItem("organisation-store")
      window.location.href = "/sign-in"
    },
  })
}
