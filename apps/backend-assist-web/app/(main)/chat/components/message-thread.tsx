"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { ChatHeader } from "./chat-header"
import { MessageBubble } from "./message-bubble"
import { MessageInput } from "./message-input"
import { MessageSquare, Loader2 } from "lucide-react"
import type { Conversation, Message } from "@/types/chat"

interface MessageThreadProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (text: string) => void
  onUpdateConversation?: (updates: Partial<Conversation>) => void
  isLoading?: boolean
  isSending?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

export function MessageThread({
  conversation,
  messages,
  onSendMessage,
  onUpdateConversation,
  isLoading,
  isSending,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage = () => {},
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const previousScrollHeight = useRef<number>(0)

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (isInitialLoad && messages.length > 0 && !isLoading) {
      // Use requestAnimationFrame for smoother initial scroll
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
        setIsInitialLoad(false)
      })
    }
  }, [messages.length, isLoading, isInitialLoad])

  // Reset initial load state when conversation changes
  useEffect(() => {
    setIsInitialLoad(true)
    setShouldAutoScroll(true)
  }, [conversation._id])

  // Auto-scroll to bottom when new messages arrive (but only if user was at bottom)
  useEffect(() => {
    if (!isInitialLoad && shouldAutoScroll && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, shouldAutoScroll, isInitialLoad])

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (!isFetchingNextPage && messagesContainerRef.current && previousScrollHeight.current > 0) {
      const container = messagesContainerRef.current
      const newScrollHeight = container.scrollHeight
      const heightDifference = newScrollHeight - previousScrollHeight.current
      container.scrollTop = heightDifference
      previousScrollHeight.current = 0
    }
  }, [isFetchingNextPage])

  // Infinite scroll observer for loading older messages (scroll to top)
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          // Save current scroll height before fetching
          if (messagesContainerRef.current) {
            previousScrollHeight.current = messagesContainerRef.current.scrollHeight
          }
          fetchNextPage()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Detect if user is at the bottom of the scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    
    setShouldAutoScroll(isAtBottom)
  }, [])

  const handleStatusChange = (status: "open" | "pending" | "closed", closedReason?: any) => {
    const updates: any = { status }
    if (status === "closed" && closedReason) {
      updates.closedReason = closedReason
    }
    onUpdateConversation?.(updates)
  }

  const handleAssignmentChange = (memberId: string | null) => {
    onUpdateConversation?.({ assignedMemberId: memberId } as Partial<Conversation>)
  }

  const handlePriorityChange = (priority: "low" | "normal" | "high" | "urgent") => {
    onUpdateConversation?.({ priority } as Partial<Conversation>)
  }

  // Check if message is consecutive (same sender, within 5 minutes)
  const isConsecutiveMessage = (
    current: Message,
    previous: Message | undefined
  ) => {
    if (!previous) return false
    if (current.senderType !== previous.senderType) return false
    if (!current.createdAt || !previous.createdAt) return false

    const currentTime = new Date(current.createdAt).getTime()
    const previousTime = new Date(previous.createdAt).getTime()
    const fiveMinutes = 5 * 60 * 1000

    return currentTime - previousTime < fiveMinutes
  }

  const contactName = conversation.contactId?.name

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        onStatusChange={handleStatusChange}
        onAssignmentChange={handleAssignmentChange}
        onPriorityChange={handlePriorityChange}
      />

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 opacity-50" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1 opacity-70">Start the conversation</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Infinite scroll trigger at top for loading older messages */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Loading older messages...</span>
                  </div>
                )}
              </div>
            )}
            
            {messages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                contactName={contactName}
                isConsecutive={isConsecutiveMessage(
                  message,
                  messages[index - 1]
                )}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Footer / Input Area */}
      <div className="shrink-0">
        {conversation.status === "closed" ? (
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary px-3 py-1.5 rounded text-sm font-medium">
                Chat Completed
              </div>
            </div>
          </div>
        ) : (
          <MessageInput
            onSendMessage={onSendMessage}
            isSending={isSending}
            isDisabled={false}
          />
        )}
      </div>
    </div>
  )
}
