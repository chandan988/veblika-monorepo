"use client"

import { useState } from "react"
import { ConversationList } from "@/components/chat/conversation-list"
import { MessageThreadWebchat } from "@/components/chat/message-thread-webchat"
import {
  useConversations,
  useUpdateConversation,
} from "@/hooks/use-conversations"
import { useMessages, useSendMessage } from "@/hooks/use-messages"
import { MessageSquare } from "lucide-react"
import type { Conversation } from "@/types/chat"
import { useSession } from "@/hooks/useSession"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Badge } from "@workspace/ui/components/badge"

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >()
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "pending" | "closed">("all")
  const { data } = useSession()

  // Fetch conversations - get ALL webchat conversations
  const { data: conversationsData, isLoading: isLoadingConversations } =
    useConversations({
      orgId: data?.data?.session.activeOrganizationId,
      channel: "webchat", // Only webchat conversations
    })

  // Fetch messages for selected conversation
  const { messages = [], isLoading: isLoadingMessages } = useMessages(
    selectedConversationId || ""
  )

  // Mutations
  const updateConversation = useUpdateConversation()
  const sendMessage = useSendMessage(
    selectedConversationId || "",
    data?.data?.session.activeOrganizationId || "",
    data?.data?.session.userId || ""
  )

  const allConversations = (conversationsData?.data || []) as Conversation[]

  // Filter conversations by status
  const conversations = statusFilter === "all"
    ? allConversations
    : allConversations.filter(c => c.status === statusFilter)

  const selectedConversation = allConversations.find(
    (c) => c._id === selectedConversationId
  )

  // Count conversations by status
  const statusCounts = {
    all: allConversations.length,
    open: allConversations.filter(c => c.status === "open").length,
    pending: allConversations.filter(c => c.status === "pending").length,
    closed: allConversations.filter(c => c.status === "closed").length,
  }

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
    <div className="flex flex-col h-[calc(100vh-190px)] gap-4">
      {/* Header with Status Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Web Chat</h1>
          <p className="text-sm text-muted-foreground">
            Manage conversations from your website chat widget
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-auto">
          <TabsList className="bg-muted">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              Open
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.open}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2">
              Closed
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.closed}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content - Takes remaining height */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Conversation List */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Message Thread */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full overflow-hidden">
          {selectedConversation ? (
            <MessageThreadWebchat
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onUpdateConversation={handleUpdateConversation}
              isLoading={isLoadingMessages}
              isSending={sendMessage.isPending}
            />
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No conversation selected</p>
                <p className="text-sm">
                  Select a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
