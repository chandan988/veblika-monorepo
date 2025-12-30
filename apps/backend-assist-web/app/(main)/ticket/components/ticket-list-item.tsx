"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Button } from "@workspace/ui/components/button"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import {
    Copy,
    Pencil,
    Mail,
    Trash2,
    MessageSquare,
    ChevronDown,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { StatusDropdown } from "@/components/status-dropdown"
import { AssignmentDropdown } from "@/components/assignment-dropdown"

interface TicketListItemProps {
    ticket: {
        _id: string
        sourceMetadata?: {
            subject?: string
        }
        contactId?: {
            name?: string
            email?: string
        }
        status?: "open" | "pending" | "closed"
        assignedMemberId?: string | null
        lastMessageAt?: string
        createdAt?: string
    }
    isSelected?: boolean
    isChecked?: boolean
    onSelect: () => void
    onCheck?: (checked: boolean) => void
    onStatusChange?: (status: "open" | "pending" | "closed") => void
    onAssignmentChange?: (memberId: string | null) => void
    latestMessage?: string
}

export function TicketListItem({
    ticket,
    isSelected,
    isChecked,
    onSelect,
    onCheck,
    onStatusChange,
    onAssignmentChange,
    latestMessage,
}: TicketListItemProps) {
    const formatTime = (dateString?: string) => {
        if (!dateString) return "New"
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    }

    return (
        <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div
                    className={cn(
                        "flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-accent/50 min-w-0 group",
                        isSelected && "bg-accent"
                    )}
                    onClick={onSelect}
                >
                    {/* Checkbox */}
                    <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Checkbox
                            checked={isChecked}
                            onCheckedChange={onCheck}
                            className="border-muted-foreground/50"
                        />
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 bg-muted shrink-0">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                            {ticket.contactId?.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>

                    {/* Ticket Info */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h4 className="font-medium lg:max-w-[400px] text-sm text-foreground truncate">
                            {ticket.sourceMetadata?.subject || "No Subject"}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 min-w-0">
                            <span className="text-muted-foreground shrink-0">
                                #{ticket._id?.slice(-3) || "000"}
                            </span>
                            <span className="truncate min-w-0">
                                {ticket.contactId?.name || ticket.contactId?.email || "Unknown"}
                            </span>
                        </div>
                    </div>

                    {/* Action Icons - Visible on hover */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Right side - Always visible */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Status Badge */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <StatusDropdown
                                status={ticket.status || "open"}
                                onStatusChange={(status) => onStatusChange?.(status)}
                                variant="badge"
                            />
                        </div>

                        {/* Assignment */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <AssignmentDropdown
                                assignedMemberId={ticket.assignedMemberId}
                                onAssign={(memberId) => onAssignmentChange?.(memberId)}
                                compact
                            />
                        </div>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[60px] text-right">
                            {formatTime(ticket.lastMessageAt)}
                        </span>
                    </div>
                </div>
            </HoverCardTrigger>
        </HoverCard>
    )
}
