"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  Reply,
  ReplyAll,
  Forward,
  MessageSquare,
  MoreVertical,
  Play,
  Settings2,
  Monitor,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { TicketThread } from "./ticket-thread"
import { TicketEmailComposer } from "./ticket-email-composer"
import { useState } from "react"
import { AssignmentDropdown } from "@/components/assignment-dropdown"
import { StatusDropdown } from "@/components/status-dropdown"

interface TicketDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: {
    _id: string
    integrationId?: string
    threadId?: string
    assignedMemberId?: string | null
    sourceMetadata?: {
      subject?: string
      from?: string
      to?: string
      messageIdHeader?: string
      referencesHeader?: string
    }
    contactId?: {
      name?: string
      email?: string
    }
    status?: "open" | "pending" | "closed"
    lastMessageAt?: string
    createdAt?: string
  } | null
  messages: any[]
  messagesLoading?: boolean
  onSendEmail?: (data: {
    to: string
    subject: string
    body: string
    htmlBody: string
    threadId?: string
    inReplyTo?: string
    references?: string
    cc?: string
    bcc?: string
  }) => void
  onUpdateTicket?: (updates: { status?: "open" | "pending" | "closed"; assignedMemberId?: string | null }) => void
  isSending?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

export function TicketDetailSheet({
  open,
  onOpenChange,
  ticket,
  messages,
  messagesLoading,
  onSendEmail,
  onUpdateTicket,
  isSending,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage = () => {},
}: TicketDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("conversation")
  const [showComposer, setShowComposer] = useState(false)
  const [composerMode, setComposerMode] = useState<"reply" | "replyAll" | "forward">("reply")

  const formatTime = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleSendEmail = (data: {
    to: string
    subject: string
    body: string
    htmlBody: string
    cc?: string
    bcc?: string
  }) => {
    if (!onSendEmail) return

    onSendEmail({
      ...data,
      threadId: ticket?.threadId,
      inReplyTo: ticket?.sourceMetadata?.messageIdHeader,
      references: ticket?.sourceMetadata?.referencesHeader,
    })
    setShowComposer(false)
  }

  const openComposer = (mode: "reply" | "replyAll" | "forward") => {
    setComposerMode(mode)
    setShowComposer(true)
  }

  if (!ticket) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col"
        side="right"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-0 shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground text-left">
            {ticket.sourceMetadata?.subject || "No Subject"}
          </SheetTitle>
        </SheetHeader>

        {/* Ticket Info Bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-muted">
              <AvatarFallback className="bg-muted text-muted-foreground">
                {ticket.contactId?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  #{ticket._id?.slice(-3) || "000"}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {ticket.contactId?.name ||
                    ticket.contactId?.email ||
                    "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Play className="h-3 w-3" />
                <span>00:00:00</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <StatusDropdown
              status={ticket.status || "open"}
              onStatusChange={(status) => onUpdateTicket?.({ status })}
              variant="badge"
            />

            {/* Assignment Dropdown */}
            <AssignmentDropdown
              assignedMemberId={ticket.assignedMemberId}
              onAssign={(memberId) => onUpdateTicket?.({ assignedMemberId: memberId })}
              compact
            />

            <span className="text-sm text-muted-foreground">
              {formatTime(ticket.lastMessageAt || ticket.createdAt)}
            </span>

            {/* Reply Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                  size="sm"
                >
                  <Reply className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openComposer("reply")}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openComposer("replyAll")}>
                  <ReplyAll className="h-4 w-4 mr-2" />
                  Reply All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openComposer("forward")}>
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Email Composer */}
        {showComposer && (
          <div className="p-4 border-b border-border max-h-[50%] overflow-hidden">
            <TicketEmailComposer
              defaultTo={ticket.contactId?.email || ""}
              defaultSubject={ticket.sourceMetadata?.subject || ""}
              isReply={composerMode === "reply" || composerMode === "replyAll"}
              onSend={handleSendEmail}
              onCancel={() => setShowComposer(false)}
              isSending={isSending}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 shrink-0">
            <TabsTrigger
              value="conversation"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Conversation
            </TabsTrigger>
            <TabsTrigger
              value="resolution"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Resolution
            </TabsTrigger>
            <TabsTrigger
              value="time-entry"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Time Entry
            </TabsTrigger>
            <TabsTrigger
              value="attachment"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Attachment
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="approval"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Approval
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent
            value="conversation"
            className="flex-1 m-0 overflow-hidden"
          >
            <TicketThread 
              messages={messages} 
              isLoading={messagesLoading}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          </TabsContent>

          <TabsContent value="resolution" className="flex-1 m-0 p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No resolution details available
            </div>
          </TabsContent>

          <TabsContent value="time-entry" className="flex-1 m-0 p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No time entries recorded
            </div>
          </TabsContent>

          <TabsContent value="attachment" className="flex-1 m-0 p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No attachments found
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 m-0 p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No activity logged
            </div>
          </TabsContent>

          <TabsContent value="approval" className="flex-1 m-0 p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No pending approvals
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Apply Macro
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Monitor className="h-4 w-4" />
                Remote Assist
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Remote Assist
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
