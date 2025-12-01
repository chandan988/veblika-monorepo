"use client";

import { useState } from "react";
import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { MessageSquare, Mail, Globe } from "lucide-react";
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
  const [channelFilter, setChannelFilter] = useState<"all" | "webchat" | "gmail">("all");

  // Filter conversations by channel
  const filteredConversations = conversations.filter((conv) => {
    if (channelFilter === "all") return true;
    return conv.channel === channelFilter;
  });

  // Count conversations by channel
  const webchatCount = conversations.filter(c => c.channel === "webchat").length;
  const gmailCount = conversations.filter(c => c.channel === "gmail").length;

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
      {/* Channel Filter Tabs */}
      <div className="p-3 border-b">
        <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>All</span>
              {conversations.length > 0 && (
                <span className="ml-1 text-xs opacity-60">({conversations.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="webchat" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>Web</span>
              {webchatCount > 0 && (
                <span className="ml-1 text-xs opacity-60">({webchatCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="gmail" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>Email</span>
              {gmailCount > 0 && (
                <span className="ml-1 text-xs opacity-60">({gmailCount})</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* Conversation List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {channelFilter === "all" ? (
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              ) : channelFilter === "gmail" ? (
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
              ) : (
                <Globe className="h-12 w-12 mx-auto mb-2 opacity-20" />
              )}
              <p className="text-sm">
                {channelFilter === "all" 
                  ? "No conversations found" 
                  : `No ${channelFilter === "gmail" ? "email" : "webchat"} conversations`}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
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
