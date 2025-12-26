"use client"

import { PermissionGuard, AccessDenied, Guards } from "@/components/permission-guard"
import { PermissionButton } from "@/components/permission-button"
import { usePermissions } from "@/components/ability-provider"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useOrganisationStore } from "@/stores/organisation-store"

export default function SettingsPage() {
  const { isOwner, role, permissions } = usePermissions()
  const { activeOrganisation } = useOrganisationStore()

  return (
    <PermissionGuard
      permission="organisation:view"
      fallback={
        <AccessDenied
          title="Access Denied"
          message="You don&apos;t have permission to access organisation settings."
        />
      }
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">General Settings</h2>
          <p className="text-muted-foreground">
            Manage your organisation&apos;s basic information
          </p>
        </div>

        {/* Current User Debug Info */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Your Access</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Role:</span>
            <span>{role?.name || "No role"}</span>
            <span className="text-muted-foreground">Owner:</span>
            <span>{isOwner ? "Yes" : "No"}</span>
            <span className="text-muted-foreground">Permissions:</span>
            <span>{permissions.length} granted</span>
          </div>
        </div>

        {/* Organisation Details */}
        <section className="border rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organisation Name</Label>
              <Input
                id="name"
                value={activeOrganisation?.name || ""}
                disabled
                placeholder="Organisation name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={activeOrganisation?.slug || ""}
                disabled
                placeholder="organisation-slug"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and API requests
              </p>
            </div>
          </div>

          <PermissionGuard permission="organisation:edit">
            <PermissionButton permission="organisation:edit">
              Edit Organisation
            </PermissionButton>
          </PermissionGuard>
        </section>

        {/* Danger Zone - Owner only */}
        <Guards.OwnerOnly>
          <section className="border border-destructive/20 rounded-lg p-6 bg-destructive/5">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              These actions are irreversible. Please proceed with caution.
            </p>
            <PermissionButton
              permission="organisation:delete"
              variant="destructive"
              fallback="disable"
            >
              Delete Organisation
            </PermissionButton>
          </section>
        </Guards.OwnerOnly>
      </div>
    </PermissionGuard>
  )
}
