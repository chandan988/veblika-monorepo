"use client"

import clsx from "clsx"
import { useMemo } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"
import {
  useConnectGmail,
  useDisconnectGmail,
  useGmailStatus,
  useStartGmailWatch,
} from "@/hooks/use-gmail-status"

export const GmailIntegrationCard = () => {
  const { data, isLoading, isFetching } = useGmailStatus()
  const connectMutation = useConnectGmail()
  const disconnectMutation = useDisconnectGmail()
  const watchMutation = useStartGmailWatch()
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  const hasGoogleClientId = Boolean(googleClientId)

  const isConnected = Boolean(data?.connected)
  const connecting = isLoading || isFetching || connectMutation.isPending
  const disconnecting = disconnectMutation.isPending
  const working = connecting || disconnecting

  const login = useGoogleLogin({
    flow: "auth-code",
    scope:
      "https://mail.google.com https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    onSuccess: async (response) => {
      try {
        await connectMutation.mutateAsync(response.code)
        toast.success("Gmail connected successfully")
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Gmail connect failed")
      }
    },
    onError: () => toast.error("Gmail connect failed"),
  })

  const handlePrimaryClick = async () => {
    if (!hasGoogleClientId) {
      toast.error("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Gmail integration")
      return
    }

    if (isConnected) {
      try {
        await disconnectMutation.mutateAsync()
        toast.success("Gmail disconnected")
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to disconnect")
      }
      return
    }

    login()
  }

  const handleWatchClick = async () => {
    try {
      await watchMutation.mutateAsync()
      toast.success("Gmail watch started")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to start watch")
    }
  }

  const statusLabel = useMemo(() => {
    if (connecting) return "Checking status..."
    return isConnected ? "Connected" : "Not connected"
  }, [connecting, isConnected])

  return (
    <Card id="integrations" className="max-w-4xl">
      <CardHeader>
        <CardTitle>Gmail</CardTitle>
        <CardDescription>
          Connect a Gmail inbox to ingest conversations into tickets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {statusLabel}
              {data?.historyId ? (
                <span className="ml-2 text-sm text-muted-foreground">
                  History: {data.historyId}
                </span>
              ) : null}
            </p>
            {data?.watchExpiration ? (
              <p className="text-xs text-muted-foreground">
                Watch expires {new Date(data.watchExpiration).toLocaleString()}
              </p>
            ) : null}
            {!hasGoogleClientId ? (
              <p className="text-xs text-yellow-500">
                Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env to connect Gmail.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={handlePrimaryClick}
              disabled={working || !hasGoogleClientId}
              className={clsx(
                "min-w-[160px]",
                isConnected
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isConnected ? "Connected" : "Connect Gmail"}
            </Button>

            {isConnected ? (
              <Button
                type="button"
                variant="outline"
                disabled={watchMutation.isPending || !hasGoogleClientId}
                onClick={handleWatchClick}
              >
                {watchMutation.isPending ? "Starting..." : "Start Watch"}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
