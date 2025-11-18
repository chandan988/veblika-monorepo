"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MoreHorizontal, Ban, UserCheck, Trash2, Eye, Activity } from "lucide-react"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  banned?: boolean
  banReason?: string
  banExpires?: Date
}

type UserActionsProps = {
  user: User
  onViewDetails: () => void
  onViewSessions: () => void
  onUserUpdated: () => void
}

export function UserActions({ user, onViewDetails, onViewSessions, onUserUpdated }: UserActionsProps) {
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDays, setBanDays] = useState<string>("7")
  const [loading, setLoading] = useState(false)

  const handleBanUser = async () => {
    setLoading(true)
    try {
      const banExpiresIn = banDays ? Number(banDays) * 24 * 60 * 60 : undefined // Convert days to seconds

      const response = await authClient.admin.banUser({
        userId: user.id,
        banReason: banReason || undefined,
        banExpiresIn,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to ban user")
      } else {
        toast.success(`User ${user.email} has been banned`)
        setBanDialogOpen(false)
        onUserUpdated()
      }
    } catch (error) {
      console.error("Error banning user:", error)
      toast.error("Failed to ban user")
    } finally {
      setLoading(false)
    }
  }

  const handleUnbanUser = async () => {
    setLoading(true)
    try {
      const response = await authClient.admin.unbanUser({
        userId: user.id,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to unban user")
      } else {
        toast.success(`User ${user.email} has been unbanned`)
        setUnbanDialogOpen(false)
        onUserUpdated()
      }
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast.error("Failed to unban user")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    setLoading(true)
    try {
      const response = await authClient.admin.removeUser({
        userId: user.id,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to delete user")
      } else {
        toast.success(`User ${user.email} has been deleted`)
        setDeleteDialogOpen(false)
        onUserUpdated()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onViewSessions}>
            <Activity className="mr-2 h-4 w-4" />
            View Sessions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem onClick={() => setUnbanDialogOpen(true)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {user.email}? This will prevent them from signing in and revoke all their sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="banReason">Ban Reason (Optional)</Label>
              <Input
                id="banReason"
                placeholder="Enter reason for ban"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banDays">Ban Duration (Days)</Label>
              <Input
                id="banDays"
                type="number"
                placeholder="Leave empty for permanent ban"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for permanent ban
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleBanUser} disabled={loading}>
              {loading ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unban {user.email}? They will be able to sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnbanDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUnbanUser} disabled={loading}>
              {loading ? "Unbanning..." : "Unban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {user.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={loading}
              variant="destructive"
            >
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
