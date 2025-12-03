"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useSocket } from "./use-socket"
import { useEffect } from "react"
import { toast } from "sonner"
import { useChatStore, type Conversation as StoreConversation } from "@/stores/chat-store"

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
  sourceMetadata?: any
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

  // Zustand store actions
  const setConversations = useChatStore((state) => state.setConversations)
  const addConversation = useChatStore((state) => state.addConversation)
  const updateConversationMessage = useChatStore((state) => state.updateConversationMessage)
  const storeConversations = useChatStore((state) => state.conversations)
  const conversationsLoaded = useChatStore((state) => state.conversationsLoaded)

  // Fetch conversations from API (only once or when params change)
  const query = useQuery({
    queryKey: ["conversations", params],
    queryFn: async () => {
      const { data } = await api.get("/conversations", { params })
      
      // Sync with Zustand store
      const conversations = data.data || []
      setConversations(conversations)
      
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch unless stale
    refetchInterval: 30000, // Background sync every 30 seconds
    enabled: !!params.orgId,
  })

  // Listen for real-time updates via socket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (data: any) => {
      console.log("📨 New message received:", data)

      const conversation = data.conversation
      const message = data.message

      if (data.isNewConversation) {
        // Add new conversation to store
        const newConv: StoreConversation = {
          _id: conversation._id,
          orgId: conversation.orgId,
          integrationId: conversation.integrationId,
          contactId: conversation.contactId,
          channel: conversation.channel || "webchat",
          status: conversation.status,
          priority: conversation.priority || "normal",
          lastMessageAt: message.createdAt || new Date().toISOString(),
          lastMessagePreview: message.body?.text?.substring(0, 100) || "",
          tags: conversation.tags || [],
          assignedMemberId: conversation.assignedMemberId,
        }
        
        addConversation(newConv)

        // Show notification
        toast.success("New conversation started!", {
          description: `From: ${conversation?.contactId?.name || conversation?.contactId?.email || 'Unknown'}`,
        })
      } else {
        // Update existing conversation with new message
        updateConversationMessage(
          conversation._id,
          message.body?.text?.substring(0, 100) || "",
          message.createdAt || new Date().toISOString()
        )
      }
    }

    const handleGmailNewMessage = (data: any) => {
      console.log("📧 Gmail message received:", data)
      
      if (data.conversation?.isNew) {
        // Add new Gmail conversation
        const newConv: StoreConversation = {
          _id: data.conversation._id,
          orgId: params.orgId as string,
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
        }
        
        addConversation(newConv)
        
        toast.success("📧 New Email Received", {
          description: `From: ${data.contact?.name || data.contact?.email}\nSubject: ${data.conversation?.subject || 'No subject'}`,
          duration: 5000,
        })
      } else {
        // Update existing Gmail conversation
        updateConversationMessage(
          data.conversation?._id,
          data.message?.snippet || data.message?.body?.text?.substring(0, 100) || "",
          new Date().toISOString()
        )
        
        toast.success("📧 Email Reply Received", {
          description: `From: ${data.contact?.name || data.contact?.email}`,
          duration: 3000,
        })
      }
    }

    socket.on("new:message", handleNewMessage)
    socket.on("gmail:new-message", handleGmailNewMessage)

    return () => {
      socket.off("new:message", handleNewMessage)
      socket.off("gmail:new-message", handleGmailNewMessage)
    }
  }, [socket, isConnected, params.orgId, addConversation, updateConversationMessage])

  // Return store data if loaded, otherwise return query data
  return {
    ...query,
    data: conversationsLoaded 
      ? { ...query.data, data: storeConversations }
      : query.data,
  }
}

export const useConversation = (conversationId: string) => {
  const storeConversation = useChatStore((state) => state.getConversation(conversationId))

  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}`)
      return data.data
    },
    enabled: !!conversationId,
    initialData: storeConversation,
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateConversation = () => {
  const queryClient = useQueryClient()
  const updateConversation = useChatStore((state) => state.updateConversation)

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
    onMutate: async ({ conversationId, updates }) => {
      // Optimistic update in Zustand
      updateConversation(conversationId, updates)
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
