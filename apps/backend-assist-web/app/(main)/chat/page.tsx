"use client"

import { useState } from "react"
import { ConversationList } from "@/components/chat/conversation-list"
import { MessageThreadWebchat } from "@/components/chat/message-thread-webchat"
import { MessageThreadGmail } from "@/components/chat/message-thread-gmail"
import {
  useConversations,
  useUpdateConversation,
} from "@/hooks/use-conversations"
import { useMessages, useSendMessage } from "@/hooks/use-messages"
import { MessageSquare } from "lucide-react"
import type { Conversation } from "@/types/chat"
import { useSession } from "@/hooks/useSession"

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >()
  const { data } = useSession()

  // Fetch conversations
  const { data: conversationsData, isLoading: isLoadingConversations } =
    useConversations({
      orgId: data?.data?.session.activeOrganizationId,
      status: "open",
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

  const conversations = (conversationsData?.data || []) as Conversation[]
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
    <div className="flex flex-col h-[calc(100vh-190px)]">
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
            // Render different message thread based on channel
            selectedConversation.channel === "gmail" ? (
              <MessageThreadGmail
                conversation={selectedConversation}
                messages={messages}
                onUpdateConversation={handleUpdateConversation}
                isLoading={isLoadingMessages}
              />
            ) : (
              <MessageThreadWebchat
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onUpdateConversation={handleUpdateConversation}
                isLoading={isLoadingMessages}
                isSending={sendMessage.isPending}
              />
            )
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
