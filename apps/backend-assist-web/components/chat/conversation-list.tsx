"use client";

import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { MessageSquare } from "lucide-react";
import { ConversationItemWebchat } from "./conversation-item-webchat";
import { ConversationItemGmail } from "./conversation-item-gmail";
import type { Conversation } from "@/types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
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
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Conversation List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation._id;
              const handleSelect = () => onSelectConversation(conversation._id);

              // Render different components based on channel
              if (conversation.channel === "gmail") {
                return (
                  <ConversationItemGmail
                    key={conversation._id}
                    conversation={conversation}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                  />
                );
              }

              // Default to webchat
              return (
                <ConversationItemWebchat
                  key={conversation._id}
                  conversation={conversation}
                  isSelected={isSelected}
                  onSelect={handleSelect}
                />
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
