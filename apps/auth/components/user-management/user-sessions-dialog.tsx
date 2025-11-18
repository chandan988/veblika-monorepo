"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "sonner"
import { Monitor, Smartphone, Tablet, Trash2 } from "lucide-react"

type Session = {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

type User = {
  id: string
  email: string
}

type UserSessionsDialogProps = {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSessionsDialog({ user, open, onOpenChange }: UserSessionsDialogProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const response = await authClient.admin.listUserSessions({
        userId: user.id,
      })

      if (response.data) {
        setSessions(response.data.sessions as any)
      } else {
        toast.error(response.error?.message || "Failed to fetch sessions")
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast.error("Failed to fetch sessions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchSessions()
    }
  }, [open, user.id])

  const handleRevokeSession = async (sessionToken: string) => {
    setRevoking(sessionToken)
    try {
      const response = await authClient.admin.revokeUserSession({
        sessionToken,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to revoke session")
      } else {
        toast.success("Session revoked successfully")
        fetchSessions() // Refresh the list
      }
    } catch (error) {
      console.error("Error revoking session:", error)
      toast.error("Failed to revoke session")
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAllSessions = async () => {
    setLoading(true)
    try {
      const response = await authClient.admin.revokeUserSessions({
        userId: user.id,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to revoke all sessions")
      } else {
        toast.success("All sessions revoked successfully")
        setSessions([])
      }
    } catch (error) {
      console.error("Error revoking all sessions:", error)
      toast.error("Failed to revoke all sessions")
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />
    
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>User Sessions</DialogTitle>
          <DialogDescription>
            Manage active sessions for {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
            </p>
            {sessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAllSessions}
                disabled={loading}
              >
                Revoke All Sessions
              </Button>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No active sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.userAgent)}
                          <span className="text-sm">
                            {session.userAgent?.split(" ")[0] || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{session.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(session.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(session.expiresAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {isExpired(session.expiresAt) ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeSession(session.token)}
                          disabled={revoking === session.token || isExpired(session.expiresAt)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
