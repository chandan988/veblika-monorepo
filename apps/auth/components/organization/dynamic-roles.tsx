"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Plus, Trash2, Edit, Shield } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@workspace/ui/components/checkbox"

interface RolePermissions {
  [resource: string]: string[]
}

interface DynamicRole {
  id: string
  role: string
  organizationId: string
  permission: RolePermissions
  createdAt: Date
  updatedAt?: Date
}

export function DynamicRoles() {
  const [roles, setRoles] = useState<DynamicRole[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<DynamicRole | null>(null)
  
  // Available resources and their actions
  const availablePermissions = {
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    team: ["create", "update", "delete"],
    project: ["create", "read", "update", "delete", "share"],
    ticket: ["create", "read", "update", "delete", "assign"],
  }

  // Load roles
  const loadRoles = async () => {
    setLoading(true)
    try {
      const { data, error } = await authClient.organization.listRoles({})
      if (error) {
        toast.error(error.message || "Failed to load roles")
      } else if (data) {
        setRoles(data as DynamicRole[])
      }
    } catch (error) {
      toast.error("Failed to load roles")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Create or update role
  const handleSaveRole = async (
    roleName: string,
    permissions: RolePermissions,
    isEdit: boolean = false
  ) => {
    try {
      if (isEdit && editRole) {
        const { error } = await (authClient.organization.updateRole as any)({
          roleName: editRole.role,
          data: {
            permission: permissions,
          },
        })
        
        if (error) {
          toast.error(error.message || "Failed to update role")
          return false
        }
        toast.success("Role updated successfully")
      } else {
        const { error } = await authClient.organization.createRole({
          role: roleName,
          permission: permissions,
        })
        
        if (error) {
          toast.error(error.message || "Failed to create role")
          return false
        }
        toast.success("Role created successfully")
      }
      
      await loadRoles()
      return true
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
      return false
    }
  }

  // Delete role
  const handleDeleteRole = async (roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return
    }

    try {
      const { error } = await authClient.organization.deleteRole({
        roleName: roleName,
      } as any)
      
      if (error) {
        toast.error(error.message || "Failed to delete role")
      } else {
        toast.success("Role deleted successfully")
        await loadRoles()
      }
    } catch (error) {
      toast.error("Failed to delete role")
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dynamic Roles</h2>
          <p className="text-muted-foreground">
            Create and manage custom roles with specific permissions
          </p>
        </div>
        <CreateRoleDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSave={handleSaveRole}
          availablePermissions={availablePermissions}
        />
      </div>

      <Button onClick={loadRoles} variant="outline" disabled={loading}>
        {loading ? "Loading..." : "Refresh Roles"}
      </Button>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{role.role}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditRole(role)
                      setCreateOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteRole(role.role)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Created {new Date(role.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(role.permission).map(([resource, actions]) =>
                    (actions as string[]).map((action) => (
                      <Badge key={`${resource}-${action}`} variant="secondary" className="text-xs">
                        {resource}:{action}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No custom roles created yet.
              <br />
              Create your first role to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editRole && (
        <CreateRoleDialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open)
            if (!open) setEditRole(null)
          }}
          onSave={async (name, permissions) => {
            const success = await handleSaveRole(name, permissions, true)
            if (success) {
              setEditRole(null)
              setCreateOpen(false)
            }
            return success
          }}
          availablePermissions={availablePermissions}
          initialRole={editRole}
          isEdit
        />
      )}
    </div>
  )
}

function CreateRoleDialog({
  open,
  onOpenChange,
  onSave,
  availablePermissions,
  initialRole,
  isEdit = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (roleName: string, permissions: RolePermissions) => Promise<boolean>
  availablePermissions: RolePermissions
  initialRole?: DynamicRole
  isEdit?: boolean
}) {
  const [roleName, setRoleName] = useState(initialRole?.role || "")
  const [selectedPermissions, setSelectedPermissions] = useState<RolePermissions>(
    initialRole?.permission || {}
  )
  const [saving, setSaving] = useState(false)

  const togglePermission = (resource: string, action: string) => {
    setSelectedPermissions((prev) => {
      const current = prev[resource] || []
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action]
      
      if (updated.length === 0) {
        const { [resource]: _, ...rest } = prev
        return rest
      }
      
      return {
        ...prev,
        [resource]: updated,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roleName.trim()) {
      toast.error("Role name is required")
      return
    }

    if (Object.keys(selectedPermissions).length === 0) {
      toast.error("Please select at least one permission")
      return
    }

    setSaving(true)
    const success = await onSave(roleName, selectedPermissions)
    setSaving(false)
    
    if (success) {
      setRoleName("")
      setSelectedPermissions({})
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the role name and permissions"
              : "Define a custom role with specific permissions for your organization"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              placeholder="e.g., Support Manager, Developer"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={isEdit}
            />
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="space-y-4">
              {Object.entries(availablePermissions).map(([resource, actions]) => (
                <Card key={resource}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">
                      {resource}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {actions.map((action) => (
                        <div key={action} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${resource}-${action}`}
                            checked={selectedPermissions[resource]?.includes(action) || false}
                            onCheckedChange={() => togglePermission(resource, action)}
                          />
                          <label
                            htmlFor={`${resource}-${action}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {action}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

