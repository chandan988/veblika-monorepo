"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar } from "@workspace/ui/components/avatar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Building2, Crown, Shield, User } from "lucide-react"
import { toast } from "sonner"

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  members?: Array<{
    id: string
    userId: string
    role: string
  }>
}

export function OrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    setIsPending(true)
    try {
      const { data: orgsData } = await authClient.organization.list()
      const { data: activeOrgData } = await authClient.organization.getFullOrganization()
      
      if (orgsData) setOrganizations(orgsData)
      if (activeOrgData) setActiveOrg(activeOrgData)
    } catch (error) {
      toast.error("Failed to load organizations")
    } finally {
      setIsPending(false)
    }
  }

  const handleSetActive = async (orgId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: orgId })
      toast.success("Active organization updated")
      loadOrganizations()
    } catch (error) {
      toast.error("Failed to set active organization")
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!organizations?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organizations</CardTitle>
          <CardDescription>You don't belong to any organizations yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a new organization to get started with team collaboration.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {organizations.map((org) => {
        const isActive = activeOrg?.id === org.id
        const memberInfo = org.members?.find((m) => m.userId === org.id)
        const role = memberInfo?.role || "member"

        return (
          <Card key={org.id} className={isActive ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{org.name}</CardTitle>
                      {isActive && <Badge variant="secondary">Active</Badge>}
                    </div>
                    <CardDescription>@{org.slug}</CardDescription>
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(role)} className="flex items-center gap-1">
                  {getRoleIcon(role)}
                  {role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {org.members?.length || 0} member{org.members?.length !== 1 ? "s" : ""}
                </div>
                {!isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetActive(org.id)}
                  >
                    Set as Active
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

