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

  const watchActive = useMemo(() => {
    if (typeof data?.watchActive === "boolean") return data.watchActive
    if (!data?.watchExpiration) return false
    const expiresAt = new Date(data.watchExpiration).getTime()
    return Number.isNaN(expiresAt) ? false : expiresAt > Date.now()
  }, [data?.watchActive, data?.watchExpiration])

  const watchExpirationLabel = data?.watchExpiration
    ? new Date(data.watchExpiration).toLocaleString()
    : undefined

  const connectionPillClass = clsx(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    isConnected
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700"
  )

  const watchPillClass = clsx(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    watchActive
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700"
  )

  return (
    <Card id="integrations" className="max-w-4xl">
      <CardHeader>
        <CardTitle>Gmail</CardTitle>
        <CardDescription>
          Connect a Gmail inbox to ingest conversations into tickets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Connection</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={connectionPillClass}>{statusLabel}</span>
              {data?.connectedEmail ? (
                <span className="truncate text-sm font-medium text-muted-foreground">
                  {data.connectedEmail}
                </span>
              ) : null}
            </div>
            {data?.historyId ? (
              <p className="text-xs text-muted-foreground">
                History ID: <span className="font-mono">{data.historyId}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Connect Gmail to start syncing conversations.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Watch status</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={watchPillClass}>
                {watchActive ? "Watch started" : "Awaiting watch"}
              </span>
              {watchExpirationLabel ? (
                <span className="text-xs text-muted-foreground">
                  Expires {watchExpirationLabel}
                </span>
              ) : null}
            </div>
            {!isConnected ? (
              <p className="text-xs text-muted-foreground">
                Connect Gmail first to enable watch notifications.
              </p>
            ) : null}
          </div>
        </div>

        {!hasGoogleClientId ? (
          <p className="text-xs text-yellow-500">
            Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env to connect Gmail.
          </p>
        ) : null}

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
              disabled={watchMutation.isPending || !hasGoogleClientId}
              onClick={handleWatchClick}
              className={clsx(
                "min-w-[160px]",
                watchActive
                  ? "bg-green-600 hover:bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {watchMutation.isPending
                ? "Starting..."
                : watchActive
                  ? "Watch Started"
                  : "Start Watch"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
