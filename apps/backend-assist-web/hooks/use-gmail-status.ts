import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gmailService } from "@/services/gmail"

export const useGmailStatus = () =>
  useQuery({
    queryKey: ["gmail-status"],
    queryFn: async () => {
      const status = await gmailService.getStatus()
      console.log("[useGmailStatus] Status result", status)
      return status
    },
    onError: (err) => {
      console.error("[useGmailStatus] Failed to fetch status", err)
    },
  })

export const useConnectGmail = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gmailService.connect,
    onSuccess: (data) => {
      console.log("[useConnectGmail] Success", data)
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] })
    },
    onError: (err) => {
      console.error("[useConnectGmail] Error", err)
    },
  })
}

export const useDisconnectGmail = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gmailService.disconnect,
    onSuccess: (data) => {
      console.log("[useDisconnectGmail] Success", data)
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] })
    },
    onError: (err) => {
      console.error("[useDisconnectGmail] Error", err)
    },
  })
}

export const useStartGmailWatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gmailService.startWatch,
    onSuccess: (data) => {
      console.log("[useStartGmailWatch] Success", data)
      queryClient.invalidateQueries({ queryKey: ["gmail-status"] })
    },
    onError: (err) => {
      console.error("[useStartGmailWatch] Error", err)
    },
  })
}
