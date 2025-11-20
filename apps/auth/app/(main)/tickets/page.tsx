"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Loader2 } from "lucide-react"

interface TicketItem {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  source?: string
  sourceMetadata?: {
    gmail?: {
      snippet?: string
      messageId?: string
      receivedAt?: string
    }
  }
  requesterName?: string
  requesterEmail?: string
  updatedAt?: string
  createdAt?: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<{ data: { data: TicketItem[] } }>("/tickets")
      setTickets(response?.data?.data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">All emails converted to tickets appear here.</p>
        </div>
        <Button onClick={loadTickets} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {tickets.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No tickets yet. Connect Gmail and send yourself a test email to see it appear here.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket._id} className="border border-slate-200">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{ticket.title}</CardTitle>
                <CardDescription>
                  {ticket.requesterName || ticket.requesterEmail || "Unknown requester"} ·{" "}
                  {ticket.sourceMetadata?.gmail?.receivedAt
                    ? new Date(ticket.sourceMetadata.gmail.receivedAt).toLocaleString()
                    : new Date(ticket.createdAt || "").toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {ticket.status || "open"}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {ticket.priority || "medium"}
                </Badge>
                {ticket.source === "gmail" ? (
                  <Badge className="bg-amber-100 text-amber-700">Gmail</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {ticket.sourceMetadata?.gmail?.snippet || ticket.description || "No description"}
              </p>
              {ticket.sourceMetadata?.gmail?.messageId ? (
                <p className="text-[11px] text-slate-400">Message ID: {ticket.sourceMetadata.gmail.messageId}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
