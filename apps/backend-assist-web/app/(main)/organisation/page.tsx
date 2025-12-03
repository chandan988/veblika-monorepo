"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Building2,
  Users,
  Mail,
  Plus,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"

// Form schemas
const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
})

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin", "owner"] as const),
})

export default function OrganisationPage() {
  const { data: organizations, isPending: loadingOrgs } =
    authClient.useListOrganizations()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const hasOrganization = organizations && organizations.length > 0
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const currentOrg =
    organizations?.find((org) => org.id === selectedOrgId) || organizations?.[0]

  // Set initial selected org when organizations load
  useState(() => {
    if (organizations && organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0]!.id)
    }
  })

  // Create organization form
  const createOrgForm = useForm<z.infer<typeof createOrgSchema>>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  })

  // Invite member form
  const inviteForm = useForm<z.infer<typeof inviteMemberSchema>>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  })

  const handleCreateOrganization = async (
    values: z.infer<typeof createOrgSchema>
  ) => {
    try {
      const result = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
      })

      if (result.data) {
        // Set the newly created organization as active in the session
        await authClient.organization.setActive({
          organizationId: result.data.id,
        })

        setIsCreateDialogOpen(false)
        createOrgForm.reset()
        // Select the newly created organization
        setSelectedOrgId(result.data.id)
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
    }
  }

  const handleInviteMember = async (
    values: z.infer<typeof inviteMemberSchema>
  ) => {
    if (!currentOrg) return

    try {
      await authClient.organization.inviteMember({
        email: values.email,
        role: values.role,
        organizationId: currentOrg.id,
      })
      setIsInviteDialogOpen(false)
      inviteForm.reset()
    } catch (error) {
      console.error("Failed to invite member:", error)
    }
  }

  if (loadingOrgs) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Main organization management UI
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization profile, team members, and invitations.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Set up a new organization to collaborate with your team
              </DialogDescription>
            </DialogHeader>

            <Form {...createOrgForm}>
              <form
                onSubmit={createOrgForm.handleSubmit(handleCreateOrganization)}
                className="space-y-4"
              >
                <FormField
                  control={createOrgForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Inc."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            const slug = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                            createOrgForm.setValue("slug", slug)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createOrgForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="acme-inc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createOrgForm.formState.isSubmitting}
                >
                  {createOrgForm.formState.isSubmitting
                    ? "Creating..."
                    : "Create Organization"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Show message if no organizations */}
      {!hasOrganization ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Organizations Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {`You haven't created or joined any organizations yet. Create one to
              get started with your team.`}
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Organization Selector */}
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Organization
                </p>
                {organizations && organizations.length > 1 ? (
                  <Select
                    value={selectedOrgId}
                    onValueChange={setSelectedOrgId}
                    defaultValue={selectedOrgId}
                  >
                    <SelectTrigger className="h-8 w-[200px] border-0 bg-transparent p-0 text-lg font-semibold shadow-none focus:ring-0 hover:text-primary transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <h2 className="text-lg font-semibold">{currentOrg?.name}</h2>
                )}
              </div>
            </div>
            {!hasOrganization && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Organization
              </Button>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview" className="gap-2">
                <Building2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="invitations" className="gap-2">
                <Mail className="h-4 w-4" />
                Invitations
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="space-y-4 animate-in fade-in-50 duration-300"
            >
              {currentOrg && <OrganizationOverview organization={currentOrg} />}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent
              value="members"
              className="space-y-4 animate-in fade-in-50 duration-300"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Team Members</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage who has access to this organization
                  </p>
                </div>
                <Dialog
                  open={isInviteDialogOpen}
                  onOpenChange={setIsInviteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your organization
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...inviteForm}>
                      <form
                        onSubmit={inviteForm.handleSubmit(handleInviteMember)}
                        className="space-y-4"
                      >
                        <FormField
                          control={inviteForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="colleague@example.com"
                                  {...field}
                                  autoFocus
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={inviteForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={inviteForm.formState.isSubmitting}
                        >
                          {inviteForm.formState.isSubmitting
                            ? "Sending..."
                            : "Send Invitation"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              {currentOrg && <MembersList organizationId={currentOrg.id} />}
            </TabsContent>

            {/* Invitations Tab */}
            <TabsContent
              value="invitations"
              className="space-y-4 animate-in fade-in-50 duration-300"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Pending Invitations</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage outstanding invitations
                  </p>
                </div>
              </div>
              {currentOrg && <InvitationsList organizationId={currentOrg.id} />}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

interface Organization {
  id: string
  name: string
  slug: string
  createdAt: Date | string
  logo?: string | null
  metadata?: Record<string, unknown>
}

function OrganizationOverview({
  organization,
}: {
  organization: Organization
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border">
              <AvatarImage
                src={organization.logo || ""}
                alt={organization.name}
              />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {organization.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{organization.name}</h3>
              <p className="text-muted-foreground">@{organization.slug}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Created On
              </p>
              <p className="font-medium">
                {new Date(organization.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Organization ID
              </p>
              <p className="font-mono text-sm bg-muted p-1 rounded w-fit">
                {organization.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationStats organizationId={organization.id} />
        </CardContent>
      </Card>
    </div>
  )
}

function OrganizationStats({ organizationId }: { organizationId: string }) {
  const { data: membersData } = useQuery({
    queryKey: ["members", organizationId],
    queryFn: async () =>
      authClient.organization.listMembers({ query: { organizationId } }),
  })

  const { data: invitationsData } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: async () =>
      authClient.organization.listInvitations({ query: { organizationId } }),
  })

  const members = membersData?.data?.members
  const invitations = invitationsData?.data
  const pendingInvitations =
    invitations?.filter((inv: { status: string }) => inv.status === "pending")
      .length || 0

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Total Members
          </p>
          <p className="text-2xl font-bold">{members?.length || 0}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
        <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Pending Invitations
          </p>
          <p className="text-2xl font-bold">{pendingInvitations}</p>
        </div>
      </div>
    </div>
  )
}

function MembersList({ organizationId }: { organizationId: string }) {
  const { data: membersData, isPending } = useQuery({
    queryKey: ["members", organizationId],
    queryFn: async () =>
      authClient.organization.listMembers({ query: { organizationId } }),
  })
  const members = membersData?.data?.members

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No members yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(
            (member: {
              id: string
              user: { name?: string; email?: string; image?: string }
              role: string
              createdAt: Date
            }) => (
              <TableRow key={member.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.image} />
                    <AvatarFallback>
                      {member.user.name?.charAt(0).toUpperCase() ||
                        member.user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user.name || "User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={member.role === "owner" ? "default" : "secondary"}
                  >
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Card>
  )
}

function InvitationsList({ organizationId }: { organizationId: string }) {
  const { data: invitationsData, isPending } = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: async () =>
      authClient.organization.listInvitations({ query: { organizationId } }),
  })
  const invitations = invitationsData?.data

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await authClient.organization.cancelInvitation({
        invitationId,
      })
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No invitations sent yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map(
            (invitation: {
              id: string
              email: string
              role: string
              status: string
              expiresAt: Date
            }) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  {invitation.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{invitation.role}</Badge>
                </TableCell>
                <TableCell>
                  {invitation.status === "pending" && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                  {invitation.status === "accepted" && (
                    <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Accepted
                    </Badge>
                  )}
                  {invitation.status === "rejected" && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Rejected
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {invitation.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
