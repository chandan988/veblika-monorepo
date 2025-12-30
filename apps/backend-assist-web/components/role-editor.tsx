"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/use-roles"
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

  const canEditRole = can("role:edit")
  const canDeleteRole = can("role:delete")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <PermissionGuard 
      permission="role:view" 
      fallback={<AccessDenied message="You don't have permission to view roles." />}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Roles & Permissions</h2>
            <p className="text-gray-600">
              Manage roles and their permissions for your organisation
            </p>
          </div>
          <PermissionButton
            permission="role:create"
            onClick={() => setIsCreateDialogOpen(true)}
            fallback="disable"
            disabledTooltip="You don't have permission to create roles"
          >
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
}: {
  role: Role
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{role.name}</h3>
            {role.isSystem && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                System
              </span>
            )}
            {role.isDefault && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
                Default
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-gray-600 text-sm mt-1">{role.description}</p>
          )}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">
              {role.permissions.length} permission(s)
            </p>
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 5).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {perm}
                </span>
              ))}
              {role.permissions.length > 5 && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                  +{role.permissions.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
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
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save role"
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
      setSelectedPermissions((prev) => [
        ...new Set([...prev, ...permissions]),
      ])
    }
  }

  const isLoading = createRole.isPending || updateRole.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Role" : "Edit Role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new custom role with specific permissions"
              : "Update the role's name, description, and permissions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Role name is required" })}
                placeholder="e.g., Senior Agent"
                disabled={role?.isSystem}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
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
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <Label>Permissions</Label>
            <p className="text-sm text-gray-500 mb-4">
              Select the permissions this role should have
            </p>

            <div className="space-y-6 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {Object.entries(PERMISSION_CATEGORIES).map(
                ([key, category]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`category-${key}`}
                        checked={category.permissions.every((p) =>
                          selectedPermissions.includes(p.key)
                        )}
                        onCheckedChange={() =>
                          toggleCategory(category.permissions.map((p) => p.key))
                        }
                      />
                      <Label
                        htmlFor={`category-${key}`}
                        className="font-semibold cursor-pointer"
                      >
                        {category.label}
                      </Label>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      {category.permissions.map((perm) => (
                        <div
                          key={perm.key}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={perm.key}
                            checked={selectedPermissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
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
                  </div>
                )
              )}
            </div>

            <p className="text-sm text-gray-500 mt-2">
              {selectedPermissions.length} permission(s) selected
            </p>
          </div>

          <DialogFooter>
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
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to delete role"
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the role &ldquo;{role.name}&rdquo;? This action
            cannot be undone.
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

export default RoleEditor
