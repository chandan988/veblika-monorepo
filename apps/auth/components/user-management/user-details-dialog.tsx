"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  createdAt: Date
  updatedAt: Date
  banned?: boolean
  banReason?: string
  banExpires?: Date
  role?: string
}

type UserDetailsDialogProps = {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function UserDetailsDialog({ user, open, onOpenChange, onUserUpdated }: UserDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  
  // Edit form state
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [newPassword, setNewPassword] = useState("")

  const handleUpdateUser = async () => {
    setLoading(true)
    try {
      const response = await authClient.admin.updateUser({
        userId: user.id,
        data: {
          name,
          email,
        },
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to update user")
      } else {
        toast.success("User updated successfully")
        setEditMode(false)
        onUserUpdated()
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long")
      return
    }

    setLoading(true)
    try {
      const response = await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword,
      })

      if (response.error) {
        toast.error(response.error.message || "Failed to set password")
      } else {
        toast.success("Password updated successfully")
        setNewPassword("")
      }
    } catch (error) {
      console.error("Error setting password:", error)
      toast.error("Failed to set password")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(user.name)
    setEmail(user.email)
    setEditMode(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View and edit user information
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={user.id} disabled />
              </div>
              <div className="space-y-2">
                <Label>Created At</Label>
                <Input value={new Date(user.createdAt).toLocaleString()} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Verified</Label>
                <div>
                  {user.emailVerified ? (
                    <Badge variant="default">Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Not Verified</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  {user.banned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              </div>
            </div>

            {user.banned && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <Label className="text-destructive">Ban Information</Label>
                {user.banReason && (
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span> {user.banReason}
                  </p>
                )}
                {user.banExpires && (
                  <p className="text-sm">
                    <span className="font-medium">Expires:</span>{" "}
                    {new Date(user.banExpires).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              {editMode ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)}>
                  Edit User
                </Button>
              )}
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Set a new password for this user (minimum 4 characters)
                </p>
              </div>
              
              <Button onClick={handleSetPassword} disabled={loading || !newPassword}>
                {loading ? "Updating..." : "Set Password"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
