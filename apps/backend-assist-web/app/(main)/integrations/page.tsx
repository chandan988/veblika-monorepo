"use client"

import {
  MessageSquare,
  Mail,
  Settings,
  ArrowRight,
  Inbox,
  Globe,
} from "lucide-react"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSession } from "@/hooks/useSession"
import { useIntegrations } from "@/hooks/use-integrations"
import Link from "next/link"
import { useOrganisationStore } from "@/stores/organisation-store"

export default function IntegrationsPage() {
  const { data } = useSession()
  const { activeOrganisation } = useOrganisationStore()
  const orgId = activeOrganisation?._id || ""
  const { data: integrations = [], isLoading } = useIntegrations(orgId)

  // Group integrations by channel
  const webchatIntegrations = integrations.filter(
    (i: any) => i.channel === "webchat"
  )
  const gmailIntegrations = integrations.filter(
    (i: any) => i.channel === "gmail"
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect and manage your communication channels
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Webchat Integration Card */}
        <Link href="/integrations/webchat" className="group">
          <Card className="p-6 h-full transition-all hover:shadow-lg hover:border-primary/50">
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                {webchatIntegrations.length > 0 && (
                  <Badge
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {webchatIntegrations.length} Active
                  </Badge>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Webchat</h3>
                <p className="text-sm text-muted-foreground">
                  Embed a chat widget on your website to engage with visitors in
                  real-time
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Website chat widget</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  Configure
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </Link>

        {/* Gmail Integration Card */}
        <Link href="/integrations/gmail" className="group">
          <Card className="p-6 h-full transition-all hover:shadow-lg hover:border-primary/50">
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                {gmailIntegrations.length > 0 && (
                  <Badge
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {gmailIntegrations.length} Connected
                  </Badge>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Gmail</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Gmail accounts to manage email conversations and
                  receive notifications
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Inbox className="h-4 w-4" />
                  <span>Email integration</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  Configure
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      {integrations.length > 0 && (
        <Card className="p-6 bg-muted/50">
          <div className="flex items-center gap-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {integrations.length} Total Integration
                {integrations.length !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {integrations.filter((i: any) => i.status === "active").length}{" "}
                active •{" "}
                {integrations.length -
                  integrations.filter((i: any) => i.status === "active")
                    .length}{" "}
                inactive
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
