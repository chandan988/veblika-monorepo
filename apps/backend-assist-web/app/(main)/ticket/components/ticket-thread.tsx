"use client"

import { useRef, useEffect } from "react"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { MoreVertical, Paperclip, Loader2 } from "lucide-react"

interface Message {
  _id: string
  body?: {
    text?: string
    html?: string
  }
  senderType?: "contact" | "agent" | "bot" | "system"
  senderId?: string
  direction?: "inbound" | "outbound"
  createdAt?: string
  metadata?: {
    subject?: string
    from?: string
    to?: string
    date?: string
  }
  attachments?: Array<{
    name?: string
    url?: string
    size?: number
    type?: string
    attachmentId?: string
  }>
}

interface TicketThreadProps {
  messages: Message[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

export function TicketThread({ 
  messages, 
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage = () => {},
}: TicketThreadProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer for loading more messages at bottom
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Extract sender info from metadata or message
  const getSenderInfo = (message: Message) => {
    // Try to get from metadata first (for gmail messages)
    if (message.metadata?.from) {
      const fromMatch = message.metadata.from.match(/^(.+?)\s*<(.+?)>/)
      if (fromMatch) {
        return {
          name: fromMatch[1]?.trim() || "Unknown",
          email: fromMatch[2]?.trim() || "",
        }
      }
      return {
        name: message.metadata.from,
        email: message.metadata.from,
      }
    }

    // Fallback based on sender type
    if (message.senderType === "agent") {
      return { name: "Support Agent", email: "" }
    }

    return { name: "Customer", email: "" }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="ml-13 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="font-medium text-foreground">No messages yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Messages in this ticket will appear here
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {messages.map((message, index) => {
          const sender = getSenderInfo(message)
          const isOutbound = message.direction === "outbound"
          const hasHtml = !!message.body?.html
          const hasText = !!message.body?.text
          const content = message.body?.html || message.body?.text || ""

          return (
            <div
              key={message._id || index}
              className="p-4 hover:bg-accent/30 transition-colors"
            >
              {/* Message Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Avatar
                    className={`h-10 w-10 shrink-0 ${isOutbound ? "bg-primary/20" : "bg-muted"}`}
                  >
                    <AvatarFallback
                      className={`text-sm font-medium ${isOutbound ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {sender.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">
                        {sender.name}
                      </p>
                      {isOutbound && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Agent
                        </span>
                      )}
                    </div>
                    {sender.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {sender.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(message.createdAt)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Email Content */}
              <div className="pl-[52px]">
                {hasHtml ? (
                  // Render HTML content (for rich emails)
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none 
                      prose-p:my-2 prose-p:leading-relaxed
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-img:max-w-full prose-img:h-auto
                      prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-3
                      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                  />
                ) : hasText ? (
                  // Render plain text with formatting
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {formatPlainText(content)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No content in this message
                  </p>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-2">
                      <Paperclip className="h-3 w-3" />
                      Attachments ({message.attachments.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {message.attachments.map((attachment, idx) => {
                        const isImage = attachment.type?.startsWith('image/')
                        const hasUrl = !!attachment.url
                        
                        // Image attachment with preview
                        if (isImage && hasUrl) {
                          return (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-colors"
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.name || "Image"}
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-medium">
                                  Click to view
                                </span>
                              </div>
                            </a>
                          )
                        }
                        
                        // File attachment
                        return (
                          <a
                            key={idx}
                            href={hasUrl ? attachment.url : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={attachment.name}
                            className={`inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs text-foreground transition-colors ${
                              hasUrl ? 'hover:bg-accent cursor-pointer' : 'cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">
                                {attachment.name || "Attachment"}
                              </p>
                              {attachment.size && (
                                <p className="text-[10px] text-muted-foreground">
                                  {formatFileSize(attachment.size)}
                                  {!hasUrl && " • Not available"}
                                </p>
                              )}
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Load more trigger at bottom */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading more messages...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

// Sanitize HTML to prevent XSS but keep formatting
function sanitizeHtml(html: string): string {
  if (!html) return ""

  // Create a temporary div to parse HTML
  // In production, use a proper sanitization library like DOMPurify
  // For now, we'll do basic cleanup
  let sanitized = html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove style tags (but keep inline styles)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Remove onclick and other event handlers
    .replace(/\s*on\w+="[^"]*"/gi, "")
    .replace(/\s*on\w+='[^']*'/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:/gi, "")

  return sanitized
}

// Format plain text - convert URLs and emails to links
function formatPlainText(text: string): React.ReactNode {
  if (!text) return null

  // Split text by URLs and emails
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

  // First, find all URLs and emails
  const parts: Array<{ type: "text" | "url" | "email"; value: string }> = []
  let lastIndex = 0

  // Combined regex for both URLs and emails
  const combinedRegex =
    /(https?:\/\/[^\s]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  let match

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) })
    }

    // Add the match
    if (match[1]) {
      parts.push({ type: "url", value: match[1] })
    } else if (match[2]) {
      parts.push({ type: "email", value: match[2] })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) })
  }

  // If no special parts found, return text as-is
  if (parts.length === 0) {
    return text
  }

  return parts.map((part, idx) => {
    if (part.type === "url") {
      return (
        <a
          key={idx}
          href={part.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {part.value}
        </a>
      )
    }
    if (part.type === "email") {
      return (
        <a
          key={idx}
          href={`mailto:${part.value}`}
          className="text-primary hover:underline"
        >
          {part.value}
        </a>
      )
    }
    return <span key={idx}>{part.value}</span>
  })
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
