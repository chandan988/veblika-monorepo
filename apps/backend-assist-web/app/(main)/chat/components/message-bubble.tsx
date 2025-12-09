"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { format } from "date-fns"
import type { Message } from "@/types/chat"
import { cn } from "@workspace/ui/lib/utils"
import { CheckCheck } from "lucide-react"

interface MessageBubbleProps {
  message: Message
  contactName?: string
  isConsecutive?: boolean
}

export function MessageBubble({
  message,
  contactName,
  isConsecutive = false,
}: MessageBubbleProps) {
  const isAgent = message.senderType === "agent"
  const isSystem = message.senderType === "system"

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full font-medium">
          {message.body.text}
        </div>
      </div>
    )
  }

  const getInitials = (name?: string) => {
    if (!name) return "?"
    return name.charAt(0).toUpperCase()
  }

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%] animate-in fade-in-0 slide-in-from-bottom-1 duration-200 group",
        isAgent ? "ml-auto flex-row-reverse" : "mr-auto",
        isConsecutive ? "mt-0.5" : "mt-4"
      )}
    >
      {/* Avatar */}
      {!isConsecutive && !isAgent ? (
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
            {getInitials(contactName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        !isAgent && <div className="w-8 shrink-0" />
      )}

      <div
        className={cn(
          "flex flex-col gap-0.5",
          isAgent ? "items-end" : "items-start"
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            "relative px-3 py-2 text-[13px] leading-relaxed transition-all min-w-20",
            "group-hover:shadow-md",
            isAgent
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
              : "bg-muted/80 text-foreground rounded-2xl rounded-bl-md border border-border/40"
          )}
        >
          <p className="whitespace-pre-wrap wrap-break-word">
            {message.body.text}
          </p>
        </div>

        {/* Timestamp and Status */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 text-[10px] font-medium",
            isAgent ? "flex-row-reverse" : "flex-row",
            "text-muted-foreground/60"
          )}
        >
          <span>
            {message.createdAt
              ? format(new Date(message.createdAt), "h:mm a")
              : "Sending..."}
          </span>
          {isAgent && message.createdAt && (
            <CheckCheck className="h-3 w-3 text-primary/60" />
          )}
        </div>
      </div>
    </div>
  )
}
