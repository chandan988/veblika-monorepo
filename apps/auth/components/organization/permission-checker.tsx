"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { CheckCircle2, XCircle, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"

/**
 * Permission Checker Component
 * 
 * यह component runtime पर permissions check करने का example है
 * Dynamic roles के साथ काम करता है
 */
export function PermissionChecker() {
  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})

  const permissionsToCheck = [
    { resource: "project", action: "create", label: "Create Project" },
    { resource: "project", action: "delete", label: "Delete Project" },
    { resource: "ticket", action: "assign", label: "Assign Ticket" },
    { resource: "member", action: "create", label: "Invite Member" },
    { resource: "team", action: "create", label: "Create Team" },
    { resource: "organization", action: "update", label: "Update Organization" },
    { resource: "organization", action: "delete", label: "Delete Organization" },
  ]

  const checkPermissions = async () => {
    setChecking(true)
    setResults({})

    try {
      for (const perm of permissionsToCheck) {
        const { data, error } = await authClient.organization.hasPermission({
          permissions: {
            [perm.resource]: [perm.action],
          },
        })

        if (error) {
          console.error(`Error checking ${perm.label}:`, error)
          setResults(prev => ({
            ...prev,
            [`${perm.resource}:${perm.action}`]: false,
          }))
        } else {
          setResults(prev => ({
            ...prev,
            [`${perm.resource}:${perm.action}`]: data?.success === true,
          }))
        }
      }
      toast.success("Permissions checked successfully")
    } catch (error) {
      toast.error("Failed to check permissions")
      console.error(error)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Checker
            </CardTitle>
            <CardDescription>
              Check your current permissions in the active organization
            </CardDescription>
          </div>
          <Button onClick={checkPermissions} disabled={checking}>
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Permissions"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {permissionsToCheck.map((perm) => {
            const key = `${perm.resource}:${perm.action}`
            const hasPermission = results[key]
            const isChecked = key in results

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {isChecked ? (
                    hasPermission ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <div>
                    <p className="font-medium">{perm.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {perm.resource}:{perm.action}
                    </p>
                  </div>
                </div>
                {isChecked && (
                  <Badge variant={hasPermission ? "default" : "destructive"}>
                    {hasPermission ? "Allowed" : "Denied"}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {Object.keys(results).length === 0 && !checking && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Check Permissions" to see your current access level
          </div>
        )}
      </CardContent>
    </Card>
  )
}
