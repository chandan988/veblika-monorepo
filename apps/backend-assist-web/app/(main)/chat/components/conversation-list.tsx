"use client"

import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Search,
  MessageSquare,
  Loader2,
  ChevronDown,
  ArrowUpDown,
  Filter,
  MoreVertical,
} from "lucide-react"
import { ConversationItem } from "./conversation-item"
import type { Conversation } from "@/types/chat"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useState, useMemo } from "react"

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage = () => {},
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.contactId?.name?.toLowerCase().includes(query) ||
        c.contactId?.email?.toLowerCase().includes(query) ||
        c.lastMessagePreview?.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-card rounded-lg border">
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex-1 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border-b">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border-r border-border/40 overflow-hidden">
      {/* Search Header */}
      <div className="p-4 space-y-3">
        {/* Title with Badge & Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
            {/* <div className="bg-primary text-primary-foreground text-xs font-bold px-1.5 h-5 min-w-[20px] rounded-full flex items-center justify-center">
              4
            </div> */}
            <h2 className="text-base font-semibold text-foreground flex items-center gap-1">
              All Chats
              <ChevronDown className="h-4 w-4" />
            </h2>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpDown className="h-4 w-4 cursor-pointer hover:text-foreground" />
            <Filter className="h-4 w-4 cursor-pointer hover:text-foreground" />
            <MoreVertical className="h-4 w-4 cursor-pointer hover:text-foreground" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/40 text-sm"
          />
        </div>
      </div>

      {/* Conversation List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">
              {searchQuery ? "No results found" : "No conversations"}
            </p>
            <p className="text-xs mt-1 opacity-70">
              {searchQuery
                ? "Try a different search"
                : "New chats will appear here"}
            </p>
          </div>
        ) : (
          <>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation._id}
                onSelect={() => onSelectConversation(conversation._id)}
              />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading more...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
