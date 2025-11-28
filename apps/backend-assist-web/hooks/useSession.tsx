import { authClient } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"

export const useSession = () => {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const session = await authClient.getSession()
      return session
    },
  })
}
