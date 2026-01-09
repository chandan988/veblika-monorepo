"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import {
  Plus,
  Shield,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/hooks/use-roles"
import { usePermissions } from "@/components/ability-provider"
import { PermissionGuard, AccessDenied } from "@/components/permission-guard"
import { PermissionButton } from "@/components/permission-button"
import { Role, PERMISSION_CATEGORIES } from "@/types/permissions"
import { toast } from "sonner"

interface RoleFormData {
  name: string
  description: string
  permissions: string[]
}

/**
 * Role Editor Component
 * Allows viewing, creating, editing, and deleting roles
 * Respects user permissions for each action
 */
export function RoleEditor() {
  const { data: roles, isLoading } = useRoles()
  const { can } = usePermissions()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const canEditRole = can("role:edit")
  const canDeleteRole = can("role:delete")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <PermissionGuard
      permission="role:view"
      fallback={
        <AccessDenied message="You don't have permission to view roles." />
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Roles & Permissions</h2>
            <p className="text-muted-foreground">
              Manage roles and their permissions for your organisation
            </p>
          </div>
          <PermissionButton
            permission="role:create"
            onClick={() => setIsCreateDialogOpen(true)}
            fallback="disable"
            disabledTooltip="You don't have permission to create roles"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </PermissionButton>
        </div>

        {/* Roles List */}
        <div className="grid gap-4">
          {roles?.map((role) => (
            <RoleCard
              key={role._id}
              role={role}
              canEdit={canEditRole && !role.isSystem}
              canDelete={canDeleteRole && !role.isSystem}
              onEdit={() => {
                setSelectedRole(role)
                setIsEditDialogOpen(true)
              }}
              onDelete={() => {
                setSelectedRole(role)
                setIsDeleteDialogOpen(true)
              }}
              onView={() => {
                setSelectedRole(role)
                setIsViewDialogOpen(true)
              }}
            />
          ))}
        </div>

        {/* Create Role Dialog */}
        <RoleFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          mode="create"
        />

        {/* Edit Role Dialog */}
        {selectedRole && (
          <RoleFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            mode="edit"
            role={selectedRole}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {selectedRole && (
          <DeleteRoleDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            role={selectedRole}
          />
        )}

        {/* View Permissions Dialog */}
        {selectedRole && (
          <ViewPermissionsDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            role={selectedRole}
          />
        )}
      </div>
    </PermissionGuard>
  )
}

/**
 * Individual Role Card
 */
function RoleCard({
  role,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onView,
}: {
  role: Role
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}) {
  return (
    <div className="border rounded-lg p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
            <h3 className="font-semibold text-lg">{role.name}</h3>
            {role.isSystem && (
              <span className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-md">
                System
              </span>
            )}
            {role.isDefault && (
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-md">
                Default
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-muted-foreground text-sm mt-2">
              {role.description}
            </p>
          )}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              {role.permissions.length} permission(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {role.permissions.slice(0, 5).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                >
                  {perm}
                </span>
              ))}
              {role.permissions.length > 5 && (
                <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
                  +{role.permissions.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Role Create/Edit Form Dialog
 */
function RoleFormDialog({
  open,
  onOpenChange,
  mode,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  role?: Role
}) {
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions || []
  )
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(PERMISSION_CATEGORIES))
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
    },
  })

  // Reset form when dialog opens/closes or role changes
  useEffect(() => {
    if (open) {
      reset({
        name: role?.name || "",
        description: role?.description || "",
      })
      setSelectedPermissions(role?.permissions || [])
    }
  }, [open, role, reset])

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (mode === "create") {
        await createRole.mutateAsync({
          name: data.name,
          description: data.description,
          permissions: selectedPermissions,
        })
        toast.success("Role created successfully")
      } else if (role) {
        await updateRole.mutateAsync({
          roleId: role._id,
          data: {
            name: data.name,
            description: data.description,
            permissions: selectedPermissions,
          },
        })
        toast.success("Role updated successfully")
      }
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Failed to save role"
      toast.error(errorMessage)
    }
  }

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const toggleCategory = (permissions: string[]) => {
    const allSelected = permissions.every((p) =>
      selectedPermissions.includes(p)
    )
    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !permissions.includes(p))
      )
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...permissions])])
    }
  }

  const toggleCategoryExpansion = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const isLoading = createRole.isPending || updateRole.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {mode === "create" ? "Create Role" : "Edit Role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new custom role with specific permissions"
              : "Update the role's name, description, and permissions"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-1 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Role name is required" })}
                  placeholder="e.g., Senior Agent"
                  disabled={role?.isSystem}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1.5">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Brief description of this role"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <Label>Permissions</Label>
              <p className="text-sm text-muted-foreground mt-1.5 mb-4">
                Select the permissions this role should have
              </p>

              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                {Object.entries(PERMISSION_CATEGORIES).map(
                  ([key, category]) => {
                    const isExpanded = expandedCategories.has(key)
                    const allSelected = category.permissions.every((p) =>
                      selectedPermissions.includes(p.key)
                    )
                    const someSelected = category.permissions.some((p) =>
                      selectedPermissions.includes(p.key)
                    )

                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`category-${key}`}
                            checked={allSelected}
                            onCheckedChange={() =>
                              toggleCategory(
                                category.permissions.map((p) => p.key)
                              )
                            }
                            className={
                              someSelected && !allSelected ? "opacity-50" : ""
                            }
                          />
                          <Label
                            htmlFor={`category-${key}`}
                            className="font-semibold cursor-pointer flex-1"
                          >
                            {category.label}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategoryExpansion(key)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {isExpanded && (
                          <div className="ml-8 grid grid-cols-2 gap-3 pt-1">
                            {category.permissions.map((perm) => (
                              <div
                                key={perm.key}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  id={perm.key}
                                  checked={selectedPermissions.includes(
                                    perm.key
                                  )}
                                  onCheckedChange={() =>
                                    togglePermission(perm.key)
                                  }
                                />
                                <Label
                                  htmlFor={perm.key}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {perm.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Check className="h-4 w-4" />
                {selectedPermissions.length} permission(s) selected
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : mode === "create"
                  ? "Create Role"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Delete Role Confirmation Dialog
 */
function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}) {
  const deleteRole = useDeleteRole()

  const handleDelete = async () => {
    try {
      await deleteRole.mutateAsync(role._id)
      toast.success("Role deleted successfully")
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Failed to delete role"
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the role &ldquo;{role.name}&rdquo;?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteRole.isPending}
          >
            {deleteRole.isPending ? "Deleting..." : "Delete Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * View Permissions Dialog
 */
function ViewPermissionsDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(PERMISSION_CATEGORIES))
  )

  const toggleCategoryExpansion = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Group permissions by category
  const permissionsByCategory = Object.entries(PERMISSION_CATEGORIES).map(
    ([key, category]) => {
      const rolePermissions = category.permissions.filter((p) =>
        role.permissions.includes(p.key)
      )
      return {
        key,
        category,
        rolePermissions,
      }
    }
  )

  const totalPermissions = role.permissions.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {role.name} - Permissions
          </DialogTitle>
          <DialogDescription>
            {role.description || "View all permissions attached to this role"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {/* Role Info */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {role.isSystem && (
                <span className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-md">
                  System Role
                </span>
              )}
              {role.isDefault && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-md">
                  Default Role
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              {totalPermissions} permission(s) attached
            </div>
          </div>

          {/* Permissions by Category */}
          <div className="space-y-4">
            {permissionsByCategory.map(({ key, category, rolePermissions }) => {
              if (rolePermissions.length === 0) return null

              const isExpanded = expandedCategories.has(key)

              return (
                <div
                  key={key}
                  className="border rounded-lg bg-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpansion(key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{category.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {rolePermissions.length} of{" "}
                          {category.permissions.length} permissions
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {rolePermissions.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-start gap-2 p-2 rounded-md bg-card"
                          >
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">
                                {perm.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {perm.key}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {totalPermissions === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No permissions attached to this role
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RoleEditor
