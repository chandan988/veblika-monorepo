"use client"

import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { MessageSquare } from "lucide-react"
import { ConversationItemWebchat } from "./conversation-item-webchat"
import { ConversationItemGmail } from "./conversation-item-gmail"
import type { Conversation } from "@/types/chat"

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  isLoading?: boolean
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Conversation List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-3 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No conversations</p>
              <p className="text-xs mt-1 opacity-70">
                New chats will appear here
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation._id
              const handleSelect = () => onSelectConversation(conversation._id)

              // Render different components based on channel
              if (conversation.channel === "gmail") {
                return (
                  <ConversationItemGmail
                    key={conversation._id}
                    conversation={conversation}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                  />
                )
              }

              // Default to webchat
              return (
                <ConversationItemWebchat
                  key={conversation._id}
                  conversation={conversation}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                />
              )
            })
          )}
        </div>
      </div>
    </Card>
  )
}
