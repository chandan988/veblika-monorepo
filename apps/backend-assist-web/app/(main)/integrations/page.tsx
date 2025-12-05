"use client"

import { useState } from "react"
import { WebchatIntegrations } from "@/components/integrations/webchat-integrations"
import { GmailIntegrations } from "@/components/integrations/gmail-integrations"
import {
  MessageSquare,
  Mail,
  MessageCircle,
  ExternalLink,
  Plug,
  ChevronLeft,
} from "lucide-react"
import { Card } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { useSession } from "@/hooks/useSession"

type IntegrationType = "webchat" | "gmail" | null

export default function IntegrationsPage() {
  const { data } = useSession()
  const [activeIntegration, setActiveIntegration] =
    useState<IntegrationType>(null)

  const handleBack = () => setActiveIntegration(null)

  if (activeIntegration === "webchat") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="pl-0 hover:pl-2 transition-all"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Integrations
          </Button>
        </div>
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              Webchat
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your website chat widgets and settings
            </p>
          </div>
          <WebchatIntegrations orgId={data?.data?.session.activeOrganizationId || ""} />
        </div>
      </div>
    )
  }

  if (activeIntegration === "gmail") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="pl-0 hover:pl-2 transition-all"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Integrations
          </Button>
        </div>
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Mail className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              Gmail
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your Gmail connections and email synchronization
            </p>
          </div>
          <GmailIntegrations orgId={data?.data?.session.activeOrganizationId || ""} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your favorite tools and services to streamline your workflow
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Webchat Card */}
        <Card className="p-6 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Webchat</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add a live chat widget to your website to engage with visitors in
              real-time.
            </p>
          </div>

          <div className="mt-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActiveIntegration("webchat")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <Button
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-none"
              onClick={() => setActiveIntegration("webchat")}
            >
              <Plug className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </Card>

        {/* Gmail Card */}
        <Card className="p-6 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4 border border-red-100 dark:border-red-800">
              <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Gmail</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect your Gmail account to sync emails and reply directly from
              the dashboard.
            </p>
          </div>

          <div className="mt-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActiveIntegration("gmail")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <Button
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-none"
              onClick={() => setActiveIntegration("gmail")}
            >
              <Plug className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </Card>

        {/* WhatsApp Card (Coming Soon) */}
        <Card className="p-6 flex flex-col h-full opacity-75 bg-muted/30">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-800">
                <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                Coming Soon
              </Badge>
            </div>
            <h3 className="text-xl font-bold mb-2">SMTP</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect your SMTP server to send and receive emails directly from
              the platform.
            </p>
          </div>

          <div className="mt-auto flex gap-3">
            <Button variant="outline" className="flex-1" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <Button className="flex-1" disabled variant="secondary">
              <Plug className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
