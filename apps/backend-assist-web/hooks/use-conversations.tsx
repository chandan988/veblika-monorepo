"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useSocket } from "./use-socket"
import { useEffect } from "react"
import { toast } from "sonner"

interface Conversation {
  _id: string
  orgId: string
  integrationId: string
  contactId: any
  channel: string
  status: "open" | "pending" | "closed"
  priority: string
  lastMessageAt: string
  lastMessagePreview: string
  tags: string[]
  assignedMemberId?: string
}

interface GetConversationsParams {
  orgId: string | undefined | null
  status?: "open" | "pending" | "closed"
  channel?: string
  page?: number
  limit?: number
}

export const useConversations = (params: GetConversationsParams) => {
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket({
    orgId: params.orgId,
    autoConnect: true,
  })

  // Fetch conversations
  const query = useQuery({
    queryKey: ["conversations", params],
    queryFn: async () => {
      const { data } = await api.get("/conversations", { params })
      return data
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  })

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (data: any) => {
      console.log("New message received:", data)

      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] })

      // If it's a new conversation, show notification
      if (data.isNewConversation) {
        toast.success("New conversation started!", {
          description: `From: ${data.conversation?.contactId?.name || data.conversation?.contactId?.email || 'Unknown'}`,
        })
      }
    }

    const handleGmailNewMessage = (data: any) => {
      console.log("📧 Gmail message received:", data)
      
      // Update conversations list
      queryClient.setQueryData(["conversations", params], (old: any) => {
        if (!old) return old
        
        const conversations = old.data || []
        
        if (data.conversation?.isNew) {
          // Add new conversation at the top
          return {
            ...old,
            data: [{
              _id: data.conversation._id,
              orgId: params.orgId,
              integrationId: data.integration?._id,
              contactId: data.contact,
              channel: "gmail",
              status: data.conversation.status,
              priority: "normal",
              lastMessageAt: new Date().toISOString(),
              lastMessagePreview: data.message?.snippet || data.message?.body?.text?.substring(0, 100) || "",
              tags: [],
              sourceMetadata: {
                subject: data.conversation.subject,
                from: data.contact?.email,
              },
            }, ...conversations]
          }
        } else {
          // Update existing conversation
          const updated = conversations.map((conv: any) => {
            if (conv._id === data.conversation?._id) {
              return {
                ...conv,
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: data.message?.snippet || data.message?.body?.text?.substring(0, 100) || conv.lastMessagePreview,
                status: data.conversation.status || conv.status,
              }
            }
            return conv
          })
          
          // Sort by lastMessageAt (newest first)
          updated.sort((a: any, b: any) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          )
          
          return { ...old, data: updated }
        }
      })
      
      // Show notification
      toast.success(
        data.conversation?.isNew ? "📧 New Email Received" : "📧 Email Reply Received",
        {
          description: `From: ${data.contact?.name || data.contact?.email}\nSubject: ${data.conversation?.subject || 'No subject'}`,
          duration: 5000,
        }
      )
    }

    socket.on("new:message", handleNewMessage)
    socket.on("gmail:new-message", handleGmailNewMessage)

    return () => {
      socket.off("new:message", handleNewMessage)
      socket.off("gmail:new-message", handleGmailNewMessage)
    }
  }, [socket, isConnected, queryClient, params])

  return query
}

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}`)
      return data.data
    },
    enabled: !!conversationId,
  })
}

export const useUpdateConversation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      updates,
    }: {
      conversationId: string
      updates: Partial<Conversation>
    }) => {
      const { data } = await api.put(
        `/conversations/${conversationId}`,
        updates
      )
      return data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      })
    },
  })
}

export const useConversationStats = (orgId: string) => {
  return useQuery({
    queryKey: ["conversation-stats", orgId],
    queryFn: async () => {
      const { data } = await api.get("/conversations/stats", {
        params: { orgId },
      })
      return data.data
    },
    enabled: !!orgId,
  })
}
