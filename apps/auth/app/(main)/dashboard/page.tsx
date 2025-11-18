"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Building2, Users, Ticket, FolderKanban } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    organizations: 0,
    members: 0,
    tickets: 0,
    projects: 0,
  })
  const [activeOrg, setActiveOrg] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: orgs } = await authClient.organization.list()
      const { data: org } = await authClient.organization.getFullOrganization()
      
      if (orgs) {
        setStats((prev) => ({ ...prev, organizations: orgs.length }))
      }
      
      if (org) {
        setActiveOrg(org)
        setStats((prev) => ({
          ...prev,
          members: org.members?.length || 0,
        }))
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    }
  }

  const statsCards = [
    {
      title: "Organizations",
      value: stats.organizations,
      icon: Building2,
      href: "/organizations",
      description: "Total organizations",
      color: "text-blue-600",
    },
    {
      title: "Team Members",
      value: stats.members,
      icon: Users,
      href: "/team",
      description: "Active members",
      color: "text-green-600",
    },
    {
      title: "Projects",
      value: stats.projects,
      icon: FolderKanban,
      href: "/projects",
      description: "Active projects",
      color: "text-purple-600",
    },
    {
      title: "Tickets",
      value: stats.tickets,
      icon: Ticket,
      href: "/tickets",
      description: "Open tickets",
      color: "text-orange-600",
    },
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your workspace.
        </p>
      </div>

      {activeOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Active Organization</CardTitle>
            <CardDescription>Currently working in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{activeOrg.name}</h3>
                <p className="text-sm text-muted-foreground">@{activeOrg.slug}</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/organizations">Switch Organization</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link href="/organizations">
                <Building2 className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/organizations">
                <Users className="mr-2 h-4 w-4" />
                Invite Team Member
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/projects">
                <FolderKanban className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/tickets">
                <Ticket className="mr-2 h-4 w-4" />
                Create Ticket
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
