"use client"

import { GmailConnectCard } from "@/components/integrations/gmail-connect-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect external tools to power your support workspace.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GmailConnectCard />

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Once Gmail is linked, every inbound email becomes a ticket automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Click “Connect Gmail” to authorize with Google OAuth.</p>
            <p>2. Start a Gmail watch to let Google push new message notifications to your webhook.</p>
            <p>3. Each new email appears instantly under Tickets with the subject, snippet, attachments, and sender.</p>
            <p>4. Comment on tickets to reply to the email thread directly from the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
