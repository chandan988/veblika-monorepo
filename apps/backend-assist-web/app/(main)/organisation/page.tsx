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
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Building2, Users, Mail, Plus, Trash2, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react"
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

// Form schemas
const createOrgSchema = z.object({
    name: z.string().min(2, "Organization name must be at least 2 characters").max(100, "Name is too long"),
    slug: z.string()
        .min(2, "Slug must be at least 2 characters")
        .max(50, "Slug is too long")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
})

const inviteMemberSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["member", "admin", "owner"] as const),
})

export default function OrganisationPage() {
    const { data: organizations, isPending: loadingOrgs } = authClient.useListOrganizations()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

    const hasOrganization = organizations && organizations.length > 0
    const [selectedOrgId, setSelectedOrgId] = useState<string>("")
    const currentOrg = organizations?.find(org => org.id === selectedOrgId) || organizations?.[0]

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

    const handleCreateOrganization = async (values: z.infer<typeof createOrgSchema>) => {
        try {
            const result = await authClient.organization.create({
                name: values.name,
                slug: values.slug,
            })
            setIsCreateDialogOpen(false)
            createOrgForm.reset()
            // Select the newly created organization
            if (result.data) {
                setSelectedOrgId(result.data.id)
            }
        } catch (error) {
            console.error("Failed to create organization:", error)
        }
    }

    const handleInviteMember = async (values: z.infer<typeof inviteMemberSchema>) => {
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Main organization management UI
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground">
                        Manage your organizations, members, and invitations
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Organization</DialogTitle>
                            <DialogDescription>
                                Set up a new organization to collaborate with your team
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...createOrgForm}>
                            <form onSubmit={createOrgForm.handleSubmit(handleCreateOrganization)} className="space-y-4">
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
                                                        const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                                        createOrgForm.setValue('slug', slug)
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
                                <Button type="submit" className="w-full" disabled={createOrgForm.formState.isSubmitting}>
                                    {createOrgForm.formState.isSubmitting ? "Creating..." : "Create Organization"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Show message if no organizations */}
            {!hasOrganization ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by creating your first organization
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Organization
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Organization Selector */}
                    {organizations && organizations.length > 1 && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <Label htmlFor="org-select" className="whitespace-nowrap">Current Organization:</Label>
                                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                                        <SelectTrigger id="org-select" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((org) => (
                                                <SelectItem key={org.id} value={org.id}>
                                                    {org.name} ({org.slug})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                <TabsContent value="overview" className="space-y-4">
                    {currentOrg && <OrganizationOverview organization={currentOrg} />}
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Team Members</h2>
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
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
                                    <form onSubmit={inviteForm.handleSubmit(handleInviteMember)} className="space-y-4">
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                                        <Button type="submit" className="w-full" disabled={inviteForm.formState.isSubmitting}>
                                            {inviteForm.formState.isSubmitting ? "Sending..." : "Send Invitation"}
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {currentOrg && <MembersList organizationId={currentOrg.id} />}
                </TabsContent>

                {/* Invitations Tab */}
                <TabsContent value="invitations" className="space-y-4">
                    {currentOrg && <InvitationsList organizationId={currentOrg.id} />}
                </TabsContent>
            </Tabs>
                </>
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

function OrganizationOverview({ organization }: { organization: Organization }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{organization.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Slug</p>
                        <p className="font-medium">{organization.slug}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">
                            {new Date(organization.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
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
        queryKey: ['members', organizationId],
        queryFn: async () => authClient.organization.listMembers({ query: { organizationId } }),
    })

    const { data: invitationsData } = useQuery({
        queryKey: ['invitations', organizationId],
        queryFn: async () => authClient.organization.listInvitations({ query: { organizationId } }),
    })

    const members = membersData?.data?.members
    const invitations = invitationsData?.data
    const pendingInvitations = invitations?.filter((inv: { status: string }) => inv.status === "pending").length || 0

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="text-2xl font-bold">{members?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Invitations</span>
                <span className="text-2xl font-bold">{pendingInvitations}</span>
            </div>
        </div>
    )
}

function MembersList({ organizationId }: { organizationId: string }) {
    const { data: membersData, isPending } = useQuery({
        queryKey: ['members', organizationId],
        queryFn: async () => authClient.organization.listMembers({ query: { organizationId } }),
    })
    const members = membersData?.data?.members

    if (isPending) {
        return <div className="text-center py-8 text-muted-foreground">Loading members...</div>
    }

    if (!members || members.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No members yet</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4">
            {members.map((member: { id: string; user: { name?: string; email?: string }; role: string }) => (
                <Card key={member.id}>
                    <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="font-semibold text-primary">
                                    {member.user.name?.charAt(0).toUpperCase() || member.user.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium">{member.user.name || "User"}</p>
                                <p className="text-sm text-muted-foreground">{member.user.email}</p>
                            </div>
                        </div>
                        <Badge variant="secondary">{member.role}</Badge>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function InvitationsList({ organizationId }: { organizationId: string }) {
    const { data: invitationsData, isPending } = useQuery({
        queryKey: ['invitations', organizationId],
        queryFn: async () => authClient.organization.listInvitations({ query: { organizationId } }),
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
        return <div className="text-center py-8 text-muted-foreground">Loading invitations...</div>
    }

    if (!invitations || invitations.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No invitations sent yet</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4">
            {invitations.map((invitation: { id: string; email: string; role: string; status: string }) => (
                <Card key={invitation.id}>
                    <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">{invitation.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {invitation.role}
                                    </Badge>
                                    {invitation.status === "pending" && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            <Clock className="h-3 w-3" />
                                            Pending
                                        </Badge>
                                    )}
                                    {invitation.status === "accepted" && (
                                        <Badge variant="default" className="text-xs gap-1 bg-green-500">
                                            <CheckCircle className="h-3 w-3" />
                                            Accepted
                                        </Badge>
                                    )}
                                    {invitation.status === "rejected" && (
                                        <Badge variant="destructive" className="text-xs gap-1">
                                            <XCircle className="h-3 w-3" />
                                            Rejected
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        {invitation.status === "pending" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
