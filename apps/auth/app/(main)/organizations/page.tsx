"use client"

import { CreateOrganization } from "@/components/organization/create-organization"
import { OrganizationList } from "@/components/organization/organization-list"
import { InviteMember } from "@/components/organization/invite-member"
import { MembersList } from "@/components/organization/members-list"
import { DynamicRoles } from "@/components/organization/dynamic-roles"
import { PermissionChecker } from "@/components/organization/permission-checker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Building2, Users, UserPlus, Shield } from "lucide-react"

export default function OrganizationDashboard() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations, teams, and members
          </p>
        </div>
        <CreateOrganization />
      </div>

      <Tabs defaultValue="organizations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
              <CardDescription>
                Organizations you own or are a member of
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4 mt-6">
          <div className="flex justify-end mb-4">
            <InviteMember />
          </div>
          <MembersList />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Manage pending invitations to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invitation management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-6">
          <DynamicRoles />
          <div className="mt-6">
            <PermissionChecker />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
