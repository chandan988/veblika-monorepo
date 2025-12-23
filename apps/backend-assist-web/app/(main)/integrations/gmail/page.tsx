"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Mail, Loader2, Trash2, Play, Square, Clock, ArrowLeft } from "lucide-react"
import { useIntegrations } from "@/hooks/use-integrations"
import Link from "next/link"
import {
  useGenerateGmailAuthUrl,
  useGmailOAuthCallback,
  useDeleteGmailIntegration,
  useStartGmailWatch,
  useStopGmailWatch,
} from "@/hooks/use-gmail-integration"
import { oauth2Utils } from "@/utils/oauth-utils"
import { toast } from "sonner"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useSession } from "@/hooks/useSession"
import { useOrganisationStore } from "@/stores/organisation-store"

export default function GmailIntegrations() {
  const { data } = useSession()
  const { activeOrganisation } = useOrganisationStore()
  const orgId = activeOrganisation?._id || ""
  const [isConnecting, setIsConnecting] = useState(false)
  const [watchingId, setWatchingId] = useState<string | null>(null)
  const [deleteIntegrationId, setDeleteIntegrationId] = useState<string | null>(
    null
  )

  const { data: integrations = [], isLoading } = useIntegrations(orgId, "gmail")
  const generateAuthUrl = useGenerateGmailAuthUrl()
  const handleCallback = useGmailOAuthCallback()
  const deleteIntegration = useDeleteGmailIntegration()
  const startWatch = useStartGmailWatch()
  const stopWatch = useStopGmailWatch()

  const handleConnectGmail = async () => {
    setIsConnecting(true)
    try {
      // Step 1: Generate OAuth URL
      const { authUrl, state } = await generateAuthUrl.mutateAsync({ orgId })
      console.log(authUrl, "auth url")

      // Step 2: Open OAuth popup
      const redirectUrl = `${window.location.origin}/oauth/callback`
      const params = await oauth2Utils.openWithLoginUrlAndGetAllParams(
        authUrl,
        redirectUrl
      )

      if (params.error) {
        toast.error(`OAuth Error: ${params.error_description || params.error}`)
        return
      }

      if (!params.code) {
        toast.error("No authorization code received")
        return
      }

      // Step 3: Handle callback with code and state
      await handleCallback.mutateAsync({
        code: params.code,
        state: params.state || state,
        orgId,
      })

      toast.success("Gmail account connected successfully!")
    } catch (error) {
      console.error("Gmail connection error:", error)
      toast.error("Failed to connect Gmail account")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleStartWatch = async (integrationId: string) => {
    setWatchingId(integrationId)
    try {
      await startWatch.mutateAsync(integrationId)
      toast.success(
        "Gmail watch started! You'll receive real-time notifications."
      )
    } catch (error) {
      console.error("Start watch error:", error)
      toast.error("Failed to start Gmail watch")
    } finally {
      setWatchingId(null)
    }
  }

  const handleStopWatch = async (integrationId: string) => {
    setWatchingId(integrationId)
    try {
      await stopWatch.mutateAsync(integrationId)
      toast.success("Gmail watch stopped")
    } catch (error) {
      console.error("Stop watch error:", error)
      toast.error("Failed to stop Gmail watch")
    } finally {
      setWatchingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteIntegrationId) return

    try {
      await deleteIntegration.mutateAsync(deleteIntegrationId)
      toast.success("Gmail account disconnected")
      setDeleteIntegrationId(null)
    } catch (error) {
      console.error("Disconnect error:", error)
      toast.error("Failed to disconnect Gmail account")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  const getWatchExpirationText = (expiration?: string | Date) => {
    if (!expiration) return null
    const expiryDate = new Date(expiration)
    const now = new Date()
    const diffMs = expiryDate.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )

    if (diffMs < 0) return "Expired"
    if (diffDays > 0) return `Expires in ${diffDays}d ${diffHours}h`
    if (diffHours > 0) return `Expires in ${diffHours}h`
    return "Expires soon"
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/integrations" className="hover:text-foreground transition-colors">
          Integrations
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Gmail</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/integrations">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Mail className="h-8 w-8 text-red-600" />
                Gmail Integration
              </h1>
              <p className="text-muted-foreground mt-1">
                Connect and manage your Gmail accounts
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={handleConnectGmail}
            disabled={isConnecting || integrations.length > 0}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Connect Gmail Account
              </>
            )}
          </Button>
          {integrations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Only one Gmail account can be connected
            </p>
          )}
        </div>
      </div>

      {/* Integration List */}
      {integrations.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-semibold mb-2">
            No Gmail accounts connected
          </h3>
          <p className="text-muted-foreground mb-6">
            Connect your Gmail account to start receiving emails and managing
            conversations
          </p>
          <Button onClick={handleConnectGmail} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Your First Account"
            )}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => {
            const isWatching = !!integration.credentials?.watchExpiration
            const watchExpiration = integration.credentials?.watchExpiration

            return (
              <Card key={integration._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {integration.channelEmail ||
                        integration.credentials?.email}
                      {isWatching && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200 bg-green-50"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                          Watching
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connected{" "}
                      {new Date(
                        integration.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </p>
                    {isWatching && watchExpiration && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {getWatchExpirationText(
                          watchExpiration as string | Date
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Connected
                    </Badge>

                    {isWatching ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStopWatch(integration._id)}
                        disabled={watchingId === integration._id}
                      >
                        {watchingId === integration._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Square className="h-4 w-4 mr-2" />
                            Stop Watch
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartWatch(integration._id)}
                        disabled={watchingId === integration._id}
                      >
                        {watchingId === integration._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Watch
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteIntegrationId(integration._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteIntegrationId}
        onOpenChange={(open) => !open && setDeleteIntegrationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the Gmail account. You will stop receiving
              emails from this account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteIntegration.isPending ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
