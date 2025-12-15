"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { formatDistanceToNow } from "date-fns"
import type { Conversation } from "@/types/chat"
import { cn } from "@workspace/ui/lib/utils"
import { User } from "lucide-react"

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const contactName = conversation.contactId?.name || "Support"
  // Generating a fake ID if not present just for visual match to screenshot "Support #111"
  const displayId = conversation._id.substring(0, 4)

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 transition-all duration-200 border-b border-border/40 hover:bg-muted/50",
        isSelected && "bg-muted/60"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 border border-border/50">
          <AvatarFallback className="bg-background text-muted-foreground">
            <User className="h-5 w-5 opacity-50" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {contactName}
              </span>
              <span className="text-xs font-medium text-muted-foreground/80">
                #{displayId}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: false,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground truncate max-w-[85%]">
              {conversation.lastMessagePreview || "dummy text"}
            </p>
            <div className="h-4 w-4 rounded-full border border-border flex items-center justify-center shrink-0">
              <User className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
