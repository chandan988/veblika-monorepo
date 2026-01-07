"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  MoreVertical,
  User,
  Phone,
  Video,
  X,
  Archive,
  Flag,
  Trash2,
} from "lucide-react"
import type { Conversation } from "@/types/chat"
import { cn } from "@workspace/ui/lib/utils"
import { AssignmentDropdown } from "@/components/assignment-dropdown"
import { StatusDropdown } from "@/components/status-dropdown"
import { PriorityDropdown, type Priority } from "@/components/priority-dropdown"
import type { ClosedReason } from "@/components/closed-reason-dropdown"
import { usePermissionsStore } from "@/stores/permissions-store"

interface ChatHeaderProps {
  conversation: Conversation & { 
    assignedMemberId?: string | null
    closedReason?: ClosedReason
    priority?: Priority
  }
  onStatusChange?: (status: "open" | "pending" | "closed", closedReason?: ClosedReason) => void
  onAssignmentChange?: (memberId: string | null) => void
  onPriorityChange?: (priority: Priority) => void
  onClose?: () => void
}

export function ChatHeader({
  conversation,
  onStatusChange,
  onAssignmentChange,
  onPriorityChange,
  onClose,
}: ChatHeaderProps) {
  const { can } = usePermissionsStore()

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "open":
        return "bg-primary/10 text-primary border-primary/20"
      case "pending":
        return "bg-secondary/10 text-secondary-foreground border-secondary/20"
      case "closed":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "?"
    return name.charAt(0).toUpperCase()
  }

  const contactName = conversation.contactId?.name || "Support"
  const displayId = conversation._id.substring(0, 4)

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background shrink-0 h-[72px]">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-10 w-10 shrink-0 border border-border/50">
          <AvatarFallback className="bg-background text-muted-foreground">
            <User className="h-5 w-5 opacity-50" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-foreground">
              {contactName}
            </h3>
            <span className="text-sm font-medium text-muted-foreground/80">
              #{displayId}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-light">
            Click here to contact info
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Status Dropdown */}
        <StatusDropdown
          status={conversation.status || "open"}
          closedReason={conversation.closedReason}
          onStatusChange={(status, closedReason) => {
            onStatusChange?.(status, closedReason)
          }}
          variant="badge"
        />

        {/* Priority Dropdown */}
        <PriorityDropdown
          priority={conversation.priority || "normal"}
          onPriorityChange={(priority) => onPriorityChange?.(priority)}
          compact
        />

        {/* Assignment Dropdown */}
        {can("chat:assign") && (
          <AssignmentDropdown
            assignedMemberId={conversation.assignedMemberId}
            onAssign={(memberId) => onAssignmentChange?.(memberId)}
            compact
          />
        )}

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/70 hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Flag className="h-4 w-4 mr-2" />
              Flag
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
