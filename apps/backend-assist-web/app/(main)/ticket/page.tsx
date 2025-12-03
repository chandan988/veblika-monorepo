"use client"

import { useConversations, useConversation } from "@/hooks/use-conversations"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import {
  Search,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Filter,
  ChevronDown,
  MoreHorizontal,
  MessageCircle,
} from "lucide-react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSession } from "@/hooks/useSession"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"

export default function TicketPage() {
  const { data } = useSession()
  const orgId = data?.data?.session.activeOrganizationId
  const { data: conversationsData, isLoading } = useConversations({ orgId })

  const conversations = conversationsData?.data || []

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const selectedConversationQuery = useConversation(selectedConversationId || "")
  const conversation = selectedConversationQuery.data

  const { data: rawMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return []
      const res = await api.get(`/conversations/${selectedConversationId}/messages`)
      return res.data.data
    },
    enabled: !!selectedConversationId,
  })

  const [replyText, setReplyText] = useState("")
  const [internalNote, setInternalNote] = useState(false)

  const handleSend = async () => {
    if (!selectedConversationId || !replyText.trim()) return

    try {
      await api.post(`/conversations/${selectedConversationId}/messages?orgId=${orgId}`, { text: replyText, internal: internalNote })

      setReplyText("")
      setInternalNote(false)
    } catch (err) {
      console.error("Failed to send message", err)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Left Sidebar - Navigation Filters */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-9 bg-muted/50"
          />
        </div>

        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Default Group */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">
              Default
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                All Tickets
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                All undelivered messages
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                All unresolved tickets
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                New and my open tickets
              </Button>
            </div>
          </div>

          {/* Shared Group */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2">
              Shared
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                My Open and pending Tickets
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                MY Overdue
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                Open Tickets in my Groups
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                Urgent and high priority
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Ticket List */}
      <div className="flex-1 min-w-0 flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 border-b">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((ticket: any) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedConversationId(ticket._id)}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group ${selectedConversationId === ticket._id ? 'bg-muted/30' : ''}`}
                >
                  {/* Avatar Placeholder */}
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm truncate">
                          {ticket.lastMessagePreview || "No messages yet"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">
                            #{ticket._id.slice(-4)}
                          </span>
                          <span>•</span>
                          <span>
                            {ticket.contactId?.name || "Unknown User"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {ticket.lastMessageAt
                          ? new Date(ticket.lastMessageAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "New"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`
                        ${ticket.status === "open" ? "text-green-600 border-green-200 bg-green-50" : ""}
                        ${ticket.status === "pending" ? "text-yellow-600 border-yellow-200 bg-yellow-50" : ""}
                        ${ticket.status === "closed" ? "text-slate-600 border-slate-200 bg-slate-50" : ""}
                      `}
                    >
                      {ticket.status}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Badge>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Ticket Detail / Filters */}
      <div className="w-96 flex-shrink-0 flex flex-col gap-6">
        {selectedConversationId && conversation ? (
          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold">{conversation.sourceMetadata?.subject || conversation.subject || 'Untitled'}</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  From: {conversation.contactId?.email || conversation.contactId?.name || 'Unknown'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge className="mt-1">{conversation.status}</Badge>
              </div>
            </div>

            <div className="p-3 border rounded-md bg-background">
              <div className="prose max-w-none break-words">
                {conversation.description || conversation.sourceMetadata?.snippet || conversation.lastMessagePreview}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Attachments</h4>
              <div className="space-y-2">
                {messagesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : (
                  (rawMessages || []).flatMap((m: any) => (m.attachments || [])).map((att: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-2 border rounded p-2">
                      <div className="flex items-center gap-3">
                        {att.type?.startsWith('image') ? (
                          <img src={att.url} alt={att.name} className="h-12 w-12 object-cover rounded" onClick={() => window.open(att.url, '_blank')} />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">PDF</div>
                        )}
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-[200px]">{att.name}</div>
                          <div className="text-xs text-muted-foreground">{Math.round(((att.size || 0) / 1024))} KB</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={att.url} target="_blank" rel="noreferrer" className="text-xs underline">Preview</a>
                        <a href={att.url} download className="text-xs underline">Download</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Conversation</h4>
              <div className="space-y-3 max-h-56 overflow-y-auto p-2 border rounded">
                {messagesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : (rawMessages || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet</div>
                ) : (
                  (rawMessages || []).map((m: any) => (
                    <div key={m._id} className={`p-2 rounded ${m.direction === 'inbound' ? 'bg-white' : 'bg-muted/20'}`}>
                      <div className="text-xs text-muted-foreground">{m.direction === 'inbound' ? (conversation.contactId?.name || conversation.contactId?.email) : 'You'} • {new Date(m.createdAt || Date.now()).toLocaleString()}</div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{m.body?.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Reply</h4>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded mb-2"
                placeholder="Write a reply..."
              />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} />
                  <span>Marked as internal note</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setReplyText(''); setInternalNote(false); }}>Cancel</Button>
                  <Button onClick={handleSend} className="bg-blue-600 text-white">Send</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="link" className="text-xs h-auto p-0">
                show applied filters
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                className="pl-9 bg-muted/50"
              />
            </div>

            {/* Static Filters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Agents include
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal text-muted-foreground"
                >
                  Any agent
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Groups include
                </label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[2.5rem]">
                  <Badge variant="secondary" className="gap-1">
                    My Groups
                    <span className="cursor-pointer hover:text-destructive">
                      ×
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Sentiment
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal text-muted-foreground"
                >
                  Any
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal text-muted-foreground"
                >
                  Any time
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Closed at
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal text-muted-foreground"
                >
                  Any time
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Resolved at
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal text-muted-foreground"
                >
                  Any time
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </div>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              Apply
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
