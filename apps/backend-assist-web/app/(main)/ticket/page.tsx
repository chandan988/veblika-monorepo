"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useConversations, useUpdateConversation } from "@/hooks/use-conversations"
import { useMessages } from "@/hooks/use-messages"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Search,
  Mail,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"
import {
  TicketListItem,
  TicketListSkeleton,
  TicketDetailSheet
} from "./components"
import { useOrganisationStore } from "@/stores/organisation-store"
import { usePermissionsStore } from "@/stores/permissions-store"

// Sidebar filter items
const defaultFilters = [
  { id: "all", label: "All Tickets" },
  { id: "my-tickets", label: "My Tickets" },
  { id: "unassigned", label: "Unassigned Tickets" },
  { id: "open", label: "Open Tickets" },
  { id: "closed", label: "Closed Tickets" },
]

const sharedFilters = [
  { id: "open-pending", label: "My Open and pending Tickets" },
  { id: "overdue", label: "MY Overdue" },
  { id: "group-tickets", label: "Open Tickets in my Groups" },
  { id: "urgent", label: "Urgent and high priority" },
]

export default function TicketPage() {
  const { data } = useSession()
  const { activeOrganisation } = useOrganisationStore()
  const { memberId: currentMemberId } = usePermissionsStore()
  const orgId = activeOrganisation?._id
  const searchParams = useSearchParams()
  const router = useRouter()

  const selectedConversationId = searchParams.get('conversation')

  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSearchQuery, setFilterSearchQuery] = useState("")
  const [replyText, setReplyText] = useState("")

  // Sheet and selection states
  const [sheetOpen, setSheetOpen] = useState(false)
  const [checkedTickets, setCheckedTickets] = useState<Set<string>>(new Set())

  // Filter states
  const [agentsFilter, setAgentsFilter] = useState<string>("")
  const [sentimentFilter, setSentimentFilter] = useState<string>("")
  const [createdFilter, setCreatedFilter] = useState<string>("")
  const [closedAtFilter, setClosedAtFilter] = useState<string>("")
  const [resolvedAtFilter, setResolvedAtFilter] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  // Compute filters based on sidebar selection and dropdown filters
  const getConversationFilters = () => {
    let assignedMemberId: string | undefined
    let status: "open" | "pending" | "closed" | undefined

    // Sidebar filter takes precedence
    switch (activeFilter) {
      case "my-tickets":
        assignedMemberId = currentMemberId || undefined
        break
      case "unassigned":
        assignedMemberId = "unassigned"
        break
      case "open":
        status = "open"
        break
      case "closed":
        status = "closed"
        break
      default:
        // Use dropdown filter if no specific sidebar filter
        if (agentsFilter === "me" && currentMemberId) {
          assignedMemberId = currentMemberId
        } else if (agentsFilter === "unassigned") {
          assignedMemberId = "unassigned"
        }
        break
    }

    return { assignedMemberId, status }
  }

  const { assignedMemberId: filterAssignedMemberId, status: filterStatus } = getConversationFilters()

  const {
    data: conversationsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useConversations({
    orgId,
    channel: "gmail",
    assignedMemberId: filterAssignedMemberId,
    status: filterStatus,
  })

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  })

  const allConversations = conversationsData?.data || []

  const conversations = allConversations.filter((conv: any) => {
    const matchesSearch = !searchQuery ||
      conv.sourceMetadata?.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const selectedConversation = allConversations.find((c: any) => c._id === selectedConversationId)
  const { messages = [], isLoading: messagesLoading, hasNextPage: hasNextMessagePage, isFetchingNextPage: isFetchingNextMessagePage, fetchNextPage: fetchNextMessagePage } = useMessages(selectedConversationId || "", { limit: 5, orgId: orgId || "" })

  const queryClient = useQueryClient()
  const updateConversationMutation = useUpdateConversation()

  const handleUpdateTicket = (updates: { status?: "open" | "pending" | "closed"; assignedMemberId?: string | null; priority?: "low" | "normal" | "high" | "urgent" }) => {
    if (!selectedConversationId) return
    updateConversationMutation.mutate({
      conversationId: selectedConversationId,
      updates,
    })
  }

  const handleSelectConversation = (conversationId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('conversation', conversationId)
    router.push(`/ticket?${params.toString()}`, { scroll: false })
    setSheetOpen(true)
  }

  const handleCheckTicket = (ticketId: string, checked: boolean) => {
    const newChecked = new Set(checkedTickets)
    if (checked) {
      newChecked.add(ticketId)
    } else {
      newChecked.delete(ticketId)
    }
    setCheckedTickets(newChecked)
  }

  const getLatestMessagePreview = (ticketId: string) => {
    // This would ideally come from the ticket data, but for now return a placeholder
    return "Click to view the full conversation..."
  }

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

  // Gmail email sending mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (payload: {
      to: string
      subject: string
      body: string
      htmlBody: string
      threadId?: string
      inReplyTo?: string
      references?: string
      cc?: string
      bcc?: string
    }) => {
      if (!selectedConversation?.integrationId) throw new Error('No integration found')
      // Handle both string and object integrationId
      const integrationId = typeof selectedConversation.integrationId === 'object'
        ? (selectedConversation.integrationId as any)?._id
        : selectedConversation.integrationId

      if (!integrationId) throw new Error('Invalid integration ID')
      if (!orgId) throw new Error('Organization ID is required')

      return api.post(`/organisations/${orgId}/integrations/gmail/${integrationId}/send`, payload)
    },
    onSuccess: () => {
      toast.success("Email sent successfully!", {
        description: "Your email has been delivered",
      })
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
    onError: (error: any) => {
      toast.error("Failed to send email", {
        description: error?.response?.data?.error || error.message || "Please try again",
      })
    },
  })


  const handleSendEmail = (data: {
    to: string
    subject: string
    body: string
    htmlBody: string
    threadId?: string
    inReplyTo?: string
    references?: string
    cc?: string
    bcc?: string
  }) => {
    sendEmailMutation.mutate(data)
  }


  const showAppliedFilters = () => {
    setShowFilters(!showFilters)
  }

  const applyFilters = () => {
    console.log("Applying filters:", {
      agentsFilter,
      sentimentFilter,
      createdFilter,
      closedAtFilter,
      resolvedAtFilter
    })
  }

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Left Sidebar - Filter Categories */}
      <div className="w-64 border-r border-border flex flex-col h-full shrink-0">
        <div className="p-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-4">
            {/* Default Section */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Default</h3>
              <div className="space-y-1">
                {defaultFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                      activeFilter === filter.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shared Section */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Shared</h3>
              <div className="space-y-1">
                {sharedFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                      activeFilter === filter.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Second Shared Section */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Shared</h3>
              <div className="space-y-1">
                {sharedFilters.map((filter) => (
                  <button
                    key={`shared2-${filter.id}`}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                      activeFilter === filter.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Middle Section - Ticket List */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="divide-y divide-border">
            {isLoading ? (
              <TicketListSkeleton />
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Mail className="h-12 w-12 mb-4 text-muted-foreground/20" />
                <p className="font-medium text-muted-foreground">No tickets found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Email tickets will appear here"}
                </p>
              </div>
            ) : (
              <>
                {conversations.map((ticket: any) => (
                  <TicketListItem
                    key={ticket._id}
                    ticket={ticket}
                    isSelected={selectedConversationId === ticket._id}
                    isChecked={checkedTickets.has(ticket._id)}
                    onSelect={() => handleSelectConversation(ticket._id)}
                    onCheck={(checked) => handleCheckTicket(ticket._id, checked)}
                    onStatusChange={(status) => {
                      updateConversationMutation.mutate({
                        conversationId: ticket._id,
                        updates: { status },
                      })
                    }}
                    onAssignmentChange={(memberId) => {
                      updateConversationMutation.mutate({
                        conversationId: ticket._id,
                        updates: { assignedMemberId: memberId },
                      })
                    }}
                    onPriorityChange={(priority) => {
                      updateConversationMutation.mutate({
                        conversationId: ticket._id,
                        updates: { priority },
                      })
                    }}
                    latestMessage={getLatestMessagePreview(ticket._id)}
                  />
                ))}

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="py-4 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more tickets...</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Ticket Detail Sheet */}
      <TicketDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        ticket={selectedConversation || null}
        messages={messages}
        messagesLoading={messagesLoading}
        onSendEmail={handleSendEmail}
        onUpdateTicket={handleUpdateTicket}
        isSending={sendEmailMutation.isPending}
        hasNextPage={hasNextMessagePage}
        isFetchingNextPage={isFetchingNextMessagePage}
        fetchNextPage={fetchNextMessagePage}
      />

      {/* Right Sidebar - Filters - FIXED: Added shrink-0 */}
      <div className="w-72 border-l border-border flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-foreground">Filters</h3>
            <button
              onClick={showAppliedFilters}
              className="text-xs text-primary hover:underline"
            >
              show applied filters
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-5">
            {/* Agents Include */}
            <div className="space-y-2">
              <label className="text-sm text-foreground flex items-center gap-1">
                Agents include
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </label>
              <Select value={agentsFilter} onValueChange={setAgentsFilter}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any agent</SelectItem>
                  <SelectItem value="me">Me</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Sentiment</label>
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Created */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Created</label>
              <Select value={createdFilter} onValueChange={setCreatedFilter}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Closed at */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Closed at</label>
              <Select value={closedAtFilter} onValueChange={setClosedAtFilter}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolved at */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Resolved at</label>
              <Select value={resolvedAtFilter} onValueChange={setResolvedAtFilter}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        {/* Apply Button */}
        <div className="p-4 border-t border-border shrink-0">
          <Button
            onClick={applyFilters}
            className="w-full"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}