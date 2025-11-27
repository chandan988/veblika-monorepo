"use client"

import { useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { useTickets } from "@/hooks/use-tickets"
import { eventBus } from "@/utils/event-bus"

const statusColors: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-slate-100 text-slate-700 border-slate-200",
  closed: "bg-slate-200 text-slate-600 border-slate-300",
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
}

const StatusBadge = ({ value }: { value: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${
      statusColors[value] || "bg-slate-100 text-slate-700 border-slate-200"
    }`}
  >
    {value.replace("-", " ")}
  </span>
)

const PriorityBadge = ({ value }: { value: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${
      priorityColors[value] || "bg-slate-100 text-slate-700 border-slate-200"
    }`}
  >
    {value}
  </span>
)

const formatDate = (input?: string) => {
  if (!input) return "--"
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return "--"
  return date.toLocaleString()
}

export default function TicketsPage() {
  const queryClient = useQueryClient()
  const listParams = useMemo(
    () => ({ page: 1, limit: 25, source: "gmail", sortBy: "createdAt", sortOrder: "desc" as const }),
    []
  )
  const { data, isLoading, isFetching, error, refetch } = useTickets(listParams)

  useEffect(() => {
    return eventBus.on("gmail:new_message", () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", listParams] })
    })
  }, [queryClient, listParams])

  const tickets = data?.tickets || []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground">
          Gmail emails are parsed into structured tickets as soon as a watch notification arrives.
        </p>
      </div>

      <Card className="max-w-5xl">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Gmail Tickets</CardTitle>
            <CardDescription>
              Showing the {tickets.length ? "latest" : "recent"} Gmail conversations converted into tickets.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load tickets. Please try again later.
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground">
              Watch is active but no Gmail conversations have been turned into tickets yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {ticket.title || "(no subject)"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {ticket.requesterName || ticket.requesterEmail || "Unknown sender"}
                        {ticket.requesterEmail ? ` | ${ticket.requesterEmail}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={ticket.status} />
                      <PriorityBadge value={ticket.priority} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    {ticket.description?.slice(0, 200) || "No description captured from the email."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Channel: {ticket.channel || "gmail"}</span>
                    <span>Source: {ticket.source || "gmail"}</span>
                    <span>Created: {formatDate(ticket.createdAt)}</span>
                    <span>Last message: {formatDate(ticket.lastMessageAt || ticket.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && tickets.length ? (
            <p className="text-xs text-muted-foreground">
              Showing page {pagination.page} of {Math.max(pagination.totalPages, 1)} | {pagination.total} total tickets
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
