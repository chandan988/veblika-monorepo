"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar } from "@workspace/ui/components/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { MoreVertical, Shield, UserMinus, Crown, User as UserIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

interface Member {
  id: string
  userId: string
  role: string
  createdAt: Date
  user?: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function MembersList() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [dynamicRoles, setDynamicRoles] = useState<any[]>([])

  useEffect(() => {
    loadMembers()
    loadDynamicRoles()
  }, [])

  const loadDynamicRoles = async () => {
    try {
      const { data } = await authClient.organization.listRoles({})
      if (data) {
        setDynamicRoles(data as any[])
      }
    } catch (error) {
      console.error("Failed to load dynamic roles", error)
    }
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      const { data } = await authClient.organization.listMembers()
      if (data && data.members) {
        setMembers(data.members)
      }
    } catch (error) {
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })

      if (error) {
        toast.error(error.message || "Failed to remove member")
      } else {
        toast.success("Member removed successfully")
        loadMembers()
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setRemovingMember(null)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setUpdatingRole(memberId)
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
      })
      toast.success("Role updated successfully")
      loadMembers()
    } catch (error) {
      toast.error("Failed to update role")
    } finally {
      setUpdatingRole(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading members...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {member.user?.image ? (
                          <img src={member.user.image} alt={member.user.name} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm">
                            {member.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">{member.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {updatingRole === member.id ? (
                      <Select
                        defaultValue={member.role}
                        onValueChange={(value) => handleUpdateRole(member.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="projectManager">Project Manager</SelectItem>
                          <SelectItem value="supportAgent">Support Agent</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          {dynamicRoles.length > 0 && (
                            <>
                              <SelectItem value="separator" disabled>
                                --- Custom Roles ---
                              </SelectItem>
                              {dynamicRoles.map((role) => (
                                <SelectItem key={role.id} value={role.role}>
                                  {role.role}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 w-fit">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setUpdatingRole(member.id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setRemovingMember(member.id)}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              This member will lose access to the organization and all its resources.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removingMember && handleRemoveMember(removingMember)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
