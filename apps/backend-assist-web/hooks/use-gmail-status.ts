import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gmailService } from "@/services/gmail"

export const useGmailStatus = () =>
  useQuery({
    queryKey: ["gmail-status"],
    queryFn: gmailService.getStatus,
  })

export const useConnectGmail = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gmailService.connect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gmail-status"] }),
  })
}

export const useDisconnectGmail = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gmailService.disconnect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gmail-status"] }),
  })
}

export const useStartGmailWatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gmailService.startWatch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gmail-status"] }),
  })
}
