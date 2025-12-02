"use client"

import { Avatar } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Clock, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Conversation } from "@/types/chat"

interface ConversationItemWebchatProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
}

export function ConversationItemWebchat({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemWebchatProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
        isSelected
          ? "bg-primary/10 border border-primary/20 shadow-sm scale-[0.98]"
          : "bg-card hover:bg-muted/60 border border-transparent hover:border-border hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0 border-2 border-background shadow-sm">
          <div className="flex items-center justify-center h-full w-full bg-linear-to-br from-blue-500 to-blue-600 text-white font-semibold text-base">
            {conversation.contactId?.name?.[0]?.toUpperCase() || "?"}
          </div>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold truncate text-sm">
              {conversation.contactId?.name ||
                conversation.contactId?.email ||
                "Anonymous Visitor"}
            </p>
            <span className="text-xs text-muted-foreground/80 flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                  addSuffix: true,
                })}
              </span>
            </span>
          </div>

          <p className="text-sm text-muted-foreground/90 truncate leading-relaxed">
            {conversation.lastMessagePreview || "No messages yet"}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-xs px-2 py-0.5 ${getStatusColor(conversation.status)}`}
            >
              {conversation.status}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/70 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
              <MessageSquare className="h-3 w-3" />
              <span>Web</span>
            </div>
            {conversation.tags?.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {conversation.tags && conversation.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{conversation.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
