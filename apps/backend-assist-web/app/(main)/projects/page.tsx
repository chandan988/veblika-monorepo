"use client"

import { GmailIntegrationCard } from "@/components/gmail/integration-card"

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect Gmail to automatically convert emails into tickets.
        </p>
      </div>
      <GmailIntegrationCard />
    </div>
  )
}
