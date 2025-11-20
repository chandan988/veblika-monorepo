"use client"

import { useGoogleLogin } from "@react-oauth/google"
import clsx from "clsx"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { useGmailIntegration } from "@/hooks/use-gmail-integration"
import { Badge } from "@workspace/ui/components/badge"
import { Loader2, PlugZap } from "lucide-react"

export function GmailConnectCard() {
  const { status, loading, connect, disconnect, startWatch } = useGmailIntegration()

  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "https://mail.google.com https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    onSuccess: async (response) => {
      try {
        await connect(response.code)
        toast.success("Gmail linked successfully")
      } catch (err: any) {
        toast.error(err?.message || "Failed to connect Gmail")
      }
    },
    onError: (err) => {
      console.error("Gmail connect failed", err)
      toast.error("Gmail connect failed")
    },
  })

  const handleConnectClick = () => {
    if (status.connected) {
      disconnect()
        .then(() => toast.success("Gmail disconnected"))
        .catch((err) => toast.error(err?.message || "Failed to disconnect Gmail"))
      return
    }
    login()
  }

  const handleWatchClick = async () => {
    try {
      await startWatch()
      toast.success("Gmail watch started")
    } catch (err: any) {
      toast.error(err?.message || "Failed to start Gmail watch")
    }
  }

  const buttonLabel = status.connected ? "Disconnect Gmail" : loading ? "Checking..." : "Connect Gmail"

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-primary" />
            <CardTitle>Gmail</CardTitle>
          </div>
          <CardDescription>Link your Gmail inbox to automatically turn emails into support tickets.</CardDescription>
        </div>
        <Badge className={clsx("text-xs", status.connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
          {status.connected ? "Connected" : "Disconnected"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          className={clsx(
            "w-full",
            status.connected ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
          )}
          onClick={handleConnectClick}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {buttonLabel}
        </Button>

        <p className="text-xs text-muted-foreground">
          Connection uses Google OAuth. Once connected, start a Gmail watch to receive new messages instantly.
        </p>

        <Button type="button" variant="outline" className="w-full" onClick={handleWatchClick} disabled={!status.connected}>
          Start Gmail Watch
        </Button>

        {status.watchExpiration ? (
          <p className="text-xs text-muted-foreground">
            Watch expires {new Date(status.watchExpiration).toLocaleString()}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
