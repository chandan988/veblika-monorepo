"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Dialog } from "@workspace/ui/components/dialog"
import { Card } from "@workspace/ui/components/card"
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
import {
  Copy,
  Check,
  MessageSquare,
  Code,
  Settings,
  Trash2,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import {
  useCreateWebchatIntegration,
  useIntegrations,
  useGetEmbedScript,
  useDeleteIntegration,
} from "@/hooks/use-integrations"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { useSession } from "@/hooks/useSession"

export default function WebchatIntegrations() {
  const { data } = useSession()
  const orgId = data?.data?.session.activeOrganizationId || ""
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newIntegrationName, setNewIntegrationName] = useState("")
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | undefined
  >()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [deleteIntegrationId, setDeleteIntegrationId] = useState<string | null>(
    null
  )

  const { data: integrations = [], isLoading } = useIntegrations(
    orgId,
    "webchat"
  )
  const { data: embedScript } = useGetEmbedScript(selectedIntegrationId || "")
  const createIntegration = useCreateWebchatIntegration()
  const deleteIntegration = useDeleteIntegration()

  const handleCreateIntegration = async () => {
    if (!newIntegrationName.trim()) return

    try {
      await createIntegration.mutateAsync({
        name: newIntegrationName,
        orgId,
      })
      setNewIntegrationName("")
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Failed to create integration:", error)
    }
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDelete = async () => {
    if (!deleteIntegrationId) return

    try {
      await deleteIntegration.mutateAsync(deleteIntegrationId)
      if (selectedIntegrationId === deleteIntegrationId) {
        setSelectedIntegrationId(undefined)
      }
      setDeleteIntegrationId(null)
    } catch (error) {
      console.error("Failed to delete integration:", error)
    }
  }

  const selectedIntegration = integrations.find(
    (i: any) => i._id === selectedIntegrationId
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/integrations"
          className="hover:text-foreground transition-colors"
        >
          Integrations
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Webchat</span>
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
                <MessageSquare className="h-8 w-8 text-blue-600" />
                Webchat Integration
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your website chat widgets
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={integrations.length > 0}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Create New Integration
          </Button>
          {integrations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Only one webchat integration allowed
            </p>
          )}
        </div>
      </div>

      {/* Integration List */}
      {integrations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-semibold mb-2">
            No webchat integrations yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first webchat integration to start receiving messages
            from your website
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Your First Integration
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration: any) => (
            <Card key={integration._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created{" "}
                    {new Date(integration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      integration.status === "active" ? "default" : "secondary"
                    }
                  >
                    {integration.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedIntegrationId(
                        selectedIntegrationId === integration._id
                          ? undefined
                          : integration._id
                      )
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {selectedIntegrationId === integration._id
                      ? "Hide"
                      : "Configure"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteIntegrationId(integration._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Configuration Details */}
              {selectedIntegrationId === integration._id && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Credentials */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Integration ID
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={integration._id || ""}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(integration._id || "", "integrationId")
                          }
                        >
                          {copiedField === "integrationId" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Organization ID
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={integration.orgId || ""}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopy(integration.orgId || "", "orgId")
                          }
                        >
                          {copiedField === "orgId" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Embed Script */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Embed Script
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(embedScript || "", "embedScript")
                        }
                        disabled={!embedScript}
                      >
                        {copiedField === "embedScript" ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Script
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        <code>{embedScript || "Loading..."}</code>
                      </pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Copy this script and paste it just before the closing{" "}
                      {"</body>"} tag on your website
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Create Webchat Integration
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="integration-name">Integration Name</Label>
                  <Input
                    id="integration-name"
                    placeholder="e.g., Main Website Chat"
                    value={newIntegrationName}
                    onChange={(e) => setNewIntegrationName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateIntegration}
                    disabled={
                      !newIntegrationName.trim() || createIntegration.isPending
                    }
                  >
                    {createIntegration.isPending
                      ? "Creating..."
                      : "Create Integration"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Dialog>
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
              This will permanently delete this webchat integration. This action
              cannot be undone. All associated data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteIntegration.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
