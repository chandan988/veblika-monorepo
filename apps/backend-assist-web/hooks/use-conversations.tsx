"use client"

import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useSocket } from "./use-socket"
import { useEffect } from "react"
import { toast } from "sonner"
import { useChatStore, type Conversation as StoreConversation } from "@/stores/chat-store"
import { useOrganisationStore } from "@/stores/organisation-store"

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
  assignedMemberId?: string | null
  assignedBy?: string
  assignedAt?: string
  closedBy?: string
  closedAt?: string
  closedReason?: "resolved" | "spam" | "duplicate" | "no_response" | "customer_request" | "merged" | "other"
  sourceMetadata?: any
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ConversationsResponse {
  data: Conversation[]
  pagination: PaginationInfo
}

interface GetConversationsParams {
  orgId: string | undefined | null
  userId?: string | undefined | null
  status?: "open" | "pending" | "closed"
  channel?: string
  assignedMemberId?: string | null
  limit?: number
}

export const useConversations = (params: GetConversationsParams) => {
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket({
    orgId: params.orgId,
    userId: params.userId || undefined,
    autoConnect: true,
  })

  // Zustand store actions
  const setConversations = useChatStore((state) => state.setConversations)
  const appendConversations = useChatStore((state) => state.appendConversations)
  const addConversation = useChatStore((state) => state.addConversation)
  const updateConversationMessage = useChatStore((state) => state.updateConversationMessage)
  const getConversations = useChatStore((state) => state.getConversations)
  const conversationsLoaded = useChatStore((state) => state.conversationsLoaded)
  const setPaginationInfo = useChatStore((state) => state.setPaginationInfo)
  const paginationInfo = useChatStore((state) => state.paginationInfo)
  const activeChannel = useChatStore((state) => state.activeChannel)
  const setActiveChannel = useChatStore((state) => state.setActiveChannel)
  const clearConversations = useChatStore((state) => state.clearConversations)

  const limit = params.limit || 30

  // Clear store if channel changed
  useEffect(() => {
    if (params.channel && params.channel !== activeChannel) {
      clearConversations()
      setActiveChannel(params.channel)
    }
  }, [params.channel, activeChannel, clearConversations, setActiveChannel])

  // Fetch conversations from API with infinite scroll
  const query = useInfiniteQuery({
    queryKey: ["conversations", params.orgId, params.channel, params.status, params.assignedMemberId, params.limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get<ConversationsResponse>("/conversations", { 
        params: { ...params, page: pageParam, limit } 
      })
      
      const conversations = data.data || []
      const pagination = data.pagination || { total: 0, page: 1, limit, totalPages: 1 }
      
      // Sync with Zustand store - with channel awareness
      if (pageParam === 1) {
        // First page - replace all conversations for this channel
        setConversations(conversations, params.channel || 'unknown')
      } else {
        // Subsequent pages - append
        appendConversations(conversations)
      }
      
      // Update pagination info
      setPaginationInfo(pagination)
      
      return data
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination || { page: 1, totalPages: 1 }
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
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
      const conversationChannel = conversation.channel || "webchat"

      // Only process if matches current channel filter
      if (params.channel && conversationChannel !== params.channel) {
        console.log(`Ignoring message from channel ${conversationChannel}, current filter: ${params.channel}`)
        return
      }

      if (data.isNewConversation) {
        // Add new conversation to store
        const newConv: StoreConversation = {
          _id: conversation._id,
          orgId: conversation.orgId,
          integrationId: conversation.integrationId,
          contactId: conversation.contactId,
          channel: conversationChannel,
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
      
      // Only process if matches current channel filter
      if (params.channel && params.channel !== "gmail") {
        console.log(`Ignoring Gmail message, current filter: ${params.channel}`)
        return
      }
      
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

  // Flatten all pages data for easy access
  const allConversations = query.data?.pages?.flatMap(page => page.data || []) || []

  // Get conversations filtered by current channel from store
  const storeConversations = getConversations(params.channel)

  // Return store data if loaded and channel matches, otherwise return query data
  const shouldUseStore = conversationsLoaded && activeChannel === params.channel
  
  return {
    ...query,
    conversations: shouldUseStore ? storeConversations : allConversations,
    data: shouldUseStore 
      ? { data: storeConversations, pagination: paginationInfo }
      : { data: allConversations, pagination: paginationInfo },
    // Expose infinite scroll helpers
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
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
  const { activeOrganisation } = useOrganisationStore()

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
        {
          ...updates,
          orgId: activeOrganisation?._id, // Add orgId for loadMemberAbility middleware
        }
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
