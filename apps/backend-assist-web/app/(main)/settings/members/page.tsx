"use client"

import { useState } from "react"
import { PermissionGuard, AccessDenied } from "@/components/permission-guard"
import { PermissionButton } from "@/components/permission-button"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  Shield, 
  Trash2, 
  Settings2,
  Loader2 
} from "lucide-react"
import { toast } from "sonner"
import { 
  useMembers, 
  useUpdateMemberRole, 
  useUpdateMemberPermissions,
  useRemoveMember 
} from "@/hooks/use-members"
import { useRoles } from "@/hooks/use-roles"
import { usePermissions } from "@/components/ability-provider"
import { Member } from "@/services/member-api"
import { PERMISSION_CATEGORIES } from "@/types/permissions"

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  
  // Role change dialog
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  
  // Permissions dialog
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedExtraPermissions, setSelectedExtraPermissions] = useState<string[]>([])
  
  // Remove dialog
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)

  // Data hooks
  const { data: members = [], isLoading, error } = useMembers()
  const { data: roles = [] } = useRoles()
  const { can, isLoaded: permissionsLoaded } = usePermissions()
  
  // Mutation hooks
  const updateRoleMutation = useUpdateMemberRole()
  const updatePermissionsMutation = useUpdateMemberPermissions()
  const removeMemberMutation = useRemoveMember()

  const canEditMember = can("member:edit")
  const canRemoveMember = can("member:remove")
  const canAssignRole = can("role:assign")

  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true
    const name = member.user?.name?.toLowerCase() || ""
    const email = member.user?.email?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const getInitials = (name?: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (slug?: string) => {
    switch (slug) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Role change handlers
  const handleOpenRoleDialog = (member: Member) => {
    setSelectedMember(member)
    setSelectedRoleId(member.role?._id || "")
    setIsRoleDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedMember || !selectedRoleId) return

    try {
      await updateRoleMutation.mutateAsync({
        memberId: selectedMember._id,
        roleId: selectedRoleId,
      })
      toast.success("Role updated successfully")
      setIsRoleDialogOpen(false)
      setSelectedMember(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update role"
      toast.error(message)
    }
  }

  // Permissions handlers
  const handleOpenPermissionsDialog = (member: Member) => {
    setSelectedMember(member)
    setSelectedExtraPermissions(member.extraPermissions || [])
    setIsPermissionsDialogOpen(true)
  }

  const handleTogglePermission = (permission: string) => {
    setSelectedExtraPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const handleUpdatePermissions = async () => {
    if (!selectedMember) return

    try {
      await updatePermissionsMutation.mutateAsync({
        memberId: selectedMember._id,
        extraPermissions: selectedExtraPermissions,
      })
      toast.success("Permissions updated successfully")
      setIsPermissionsDialogOpen(false)
      setSelectedMember(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update permissions"
      toast.error(message)
    }
  }

  // Remove handlers
  const handleOpenRemoveDialog = (member: Member) => {
    setMemberToRemove(member)
    setIsRemoveDialogOpen(true)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      await removeMemberMutation.mutateAsync(memberToRemove._id)
      toast.success("Member removed successfully")
      setIsRemoveDialogOpen(false)
      setMemberToRemove(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove member"
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PermissionGuard
      permission="member:view"
      fallback={
        <AccessDenied
          title="Access Denied"
          message="You don&apos;t have permission to view team members."
        />
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Team Members</h2>
            <p className="text-muted-foreground">
              Manage your team and their access levels
            </p>
          </div>
          <PermissionButton
            permission="member:add"
            onClick={() => setIsInviteDialogOpen(true)}
            fallback="disable"
            disabledTooltip="You don't have permission to invite members"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </PermissionButton>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members List */}
        <div className="border rounded-lg divide-y">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No members found" : "No team members yet"}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    {member.user.image && (
                      <AvatarImage src={member.user.image} alt={member.user.name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.user.name || "Unknown"}</span>
                      {member.isOwner && (
                        <Badge variant="default" className="text-xs">
                          Owner
                        </Badge>
                      )}
                      {member.extraPermissions?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.extraPermissions.length} extra
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={getRoleBadgeVariant(member.role?.slug)}>
                    {member.isOwner ? "Owner" : member.role?.name || "No Role"}
                  </Badge>

                  {!member.isOwner && (canEditMember || canAssignRole || canRemoveMember) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canAssignRole && (
                          <DropdownMenuItem onClick={() => handleOpenRoleDialog(member)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                        )}
                        {canEditMember && (
                          <DropdownMenuItem onClick={() => handleOpenPermissionsDialog(member)}>
                            <Settings2 className="h-4 w-4 mr-2" />
                            Extra Permissions
                          </DropdownMenuItem>
                        )}
                        {canRemoveMember && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenRemoveDialog(member)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">
              {members.filter((m) => m.isOwner).length}
            </p>
            <p className="text-sm text-muted-foreground">Owners</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">
              {members.filter((m) => m.role?.slug === "admin").length}
            </p>
            <p className="text-sm text-muted-foreground">Admins</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">
              {members.filter((m) => m.role?.slug === "agent").length}
            </p>
            <p className="text-sm text-muted-foreground">Agents</p>
          </div>
        </div>

        {/* Invite Dialog (placeholder) */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organisation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                The invited member will receive an email with a link to join.
                They will be assigned the default &quot;Agent&quot; role.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button disabled>
                Send Invite (Coming Soon)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedMember?.userId.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((role) => role.slug !== "owner")
                      .map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending || !selectedRoleId}
              >
                {updateRoleMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extra Permissions Dialog */}
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Extra Permissions</DialogTitle>
              <DialogDescription>
                Grant additional permissions to {selectedMember?.userId.name} beyond their role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                <div key={key} className="space-y-3">
                  <h4 className="font-medium text-sm">{category.label}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {category.permissions.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedExtraPermissions.includes(perm.key)}
                          onCheckedChange={() => handleTogglePermission(perm.key)}
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePermissions}
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Permissions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation */}
        <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {memberToRemove?.userId.name} from your organisation?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}
