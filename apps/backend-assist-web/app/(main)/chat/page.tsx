"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { ConversationList, MessageThread } from "./components"
import {
  useConversations,
  useUpdateConversation,
} from "@/hooks/use-conversations"
import { useMessages, useSendMessage } from "@/hooks/use-messages"
import { MessageSquare } from "lucide-react"
import type { Conversation } from "@/types/chat"
import { useSession } from "@/hooks/useSession"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get selectedConversationId from URL params for state persistence
  const selectedConversationId = searchParams.get("conversation") || undefined

  const { data } = useSession()

  // Fetch conversations - get ALL webchat conversations with infinite scroll
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useConversations({
    orgId: data?.data?.session.activeOrganizationId,
    channel: "webchat", // Only webchat conversations
  })

  // Fetch messages for selected conversation with infinite scroll
  const {
    messages = [],
    isLoading: isLoadingMessages,
    hasNextPage: hasNextMessagePage,
    isFetchingNextPage: isFetchingNextMessagePage,
    fetchNextPage: fetchNextMessagePage,
  } = useMessages(selectedConversationId || "", { limit: 25 })

  // Mutations
  const updateConversation = useUpdateConversation()
  const sendMessage = useSendMessage(
    selectedConversationId || "",
    data?.data?.session.activeOrganizationId || "",
    data?.data?.session.userId || ""
  )

  const conversations = (conversationsData?.data || []) as Conversation[]

  // Handle conversation selection - update URL params
  const handleSelectConversation = (conversationId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("conversation", conversationId)
    router.push(`/chat?${params.toString()}`, { scroll: false })
  }

  const selectedConversation = conversations.find(
    (c) => c._id === selectedConversationId
  )

  const handleSendMessage = (text: string) => {
    sendMessage.mutate({ text })
  }

  const handleUpdateConversation = (updates: Partial<Conversation>) => {
    if (selectedConversationId) {
      updateConversation.mutate({
        conversationId: selectedConversationId,
        updates,
      })
    }
  }

  return (
    <div className="flex h-full">
      {/* Conversation List - Sidebar */}
      <div className="w-85 shrink-0 flex flex-col border-r">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoadingConversations}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </div>

      {/* Message Thread - Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onUpdateConversation={handleUpdateConversation}
            isLoading={isLoadingMessages}
            isSending={sendMessage.isPending}
            hasNextPage={hasNextMessagePage}
            isFetchingNextPage={isFetchingNextMessagePage}
            fetchNextPage={fetchNextMessagePage}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-card/50">
            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No conversation selected
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Select a conversation from the list to start chatting with your
              visitors
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
