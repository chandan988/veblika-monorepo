"use client"

import { useState } from "react"
import { useConversations } from "@/hooks/use-conversations"
import { useMessages } from "@/hooks/use-messages"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Separator } from "@workspace/ui/components/separator"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Search,
  Mail,
  Clock,
  User,
  Paperclip,
  Send,
  MoreVertical,
  Tag,
  AlertCircle,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSession } from "@/hooks/useSession"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { cn } from "@workspace/ui/lib/utils"

export default function TicketPage() {
  const { data } = useSession()
  const orgId = data?.data?.session.activeOrganizationId
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "pending" | "closed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  // Fetch all email conversations
  const { data: conversationsData, isLoading } = useConversations({
    orgId,
    channel: "gmail" // Only email tickets
  })

  const allConversations = conversationsData?.data || []

  // Filter conversations by status and search
  const conversations = allConversations.filter((conv: any) => {
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    const matchesSearch = !searchQuery ||
      conv.sourceMetadata?.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Count conversations by status
  const statusCounts = {
    all: allConversations.length,
    open: allConversations.filter((c: any) => c.status === "open").length,
    pending: allConversations.filter((c: any) => c.status === "pending").length,
    closed: allConversations.filter((c: any) => c.status === "closed").length,
  }

  const selectedConversation = allConversations.find((c: any) => c._id === selectedConversationId)

  // Fetch messages for selected conversation
  const { messages = [], isLoading: messagesLoading } = useMessages(selectedConversationId || "")

  const queryClient = useQueryClient()

  const sendMutation = useMutation({
    mutationFn: async (payload: { text: string }) => {
      if (!selectedConversationId) throw new Error('No conversation selected')
      return api.post(`/conversations/${selectedConversationId}/messages?orgId=${orgId}`, {
        text: payload.text,
        internal: false
      })
    },
    onSuccess: () => {
      setReplyText("")
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  const handleSend = () => {
    if (!selectedConversationId || !replyText.trim()) return
    sendMutation.mutate({ text: replyText })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Circle className="h-3 w-3 fill-green-500 text-green-500" />
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-500" />
      case "closed":
        return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
      default:
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800"
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800"
      case "closed":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] gap-4">
      {/* Header with Status Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage support tickets from email conversations
          </p>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-auto">
          <TabsList className="bg-muted">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              Open
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.open}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2">
              Closed
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {statusCounts.closed}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Ticket List */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 h-full flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Ticket List */}
          <div className="flex-1 border rounded-lg bg-card overflow-hidden">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="p-3 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                  <Mail className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-medium">No tickets found</p>
                  <p className="text-sm">
                    {searchQuery ? "Try adjusting your search" : "Email tickets will appear here"}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {conversations.map((ticket: any) => (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedConversationId(ticket._id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all hover:bg-accent",
                        selectedConversationId === ticket._id && "bg-accent border-primary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getStatusIcon(ticket.status)}
                          <h4 className="font-medium text-sm truncate">
                            {ticket.sourceMetadata?.subject || "No Subject"}
                          </h4>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {ticket.lastMessageAt
                            ? new Date(ticket.lastMessageAt).toLocaleDateString()
                            : "New"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        <span className="truncate">
                          {ticket.contactId?.name || ticket.contactId?.email || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {ticket.lastMessagePreview || "No messages"}
                        </p>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(ticket.status))}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 h-full">
          {selectedConversation ? (
            <div className="h-full border rounded-lg bg-card flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <h2 className="font-semibold text-lg truncate">
                        {selectedConversation.sourceMetadata?.subject || "No Subject"}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {selectedConversation.contactId?.name || selectedConversation.contactId?.email}
                      </span>
                      <span>•</span>
                      <span>{selectedConversation.contactId?.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(selectedConversation.status)}>
                      {selectedConversation.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div
                        key={message._id}
                        className={cn(
                          "p-4 rounded-lg border",
                          message.senderType === "contact"
                            ? "bg-muted/50"
                            : "bg-primary/5 border-primary/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                              message.senderType === "contact"
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary text-primary-foreground"
                            )}>
                              {message.senderType === "contact"
                                ? (selectedConversation.contactId?.name?.[0] || "U")
                                : "A"}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {message.senderType === "contact"
                                  ? selectedConversation.contactId?.name || "Customer"
                                  : "Support Agent"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm whitespace-pre-wrap">{message.body?.text}</p>
                        </div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {message.attachments.length} attachment(s)
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Reply Box */}
              <div className="p-4">
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={4}
                    className="w-full p-3 border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyText("")}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={!replyText.trim() || sendMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendMutation.isPending ? "Sending..." : "Send Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border rounded-lg bg-card flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No ticket selected</p>
                <p className="text-sm">
                  Select a ticket from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
