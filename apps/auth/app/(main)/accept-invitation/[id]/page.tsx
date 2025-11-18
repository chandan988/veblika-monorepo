"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "sonner"
import { Building2, Check, X, AlertCircle } from "lucide-react"

interface InvitationData {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
  organization: {
    id: string
    name: string
    slug: string
    logo?: string | null
  }
  inviter: {
    user: {
      name: string
      email: string
    }
  }
}

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const invitationId = params.id as string

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvitation()
  }, [invitationId])

  const loadInvitation = async () => {
    setLoading(true)
    try {
      const { data, error } = await authClient.organization.getInvitation({
        query: {
          id: invitationId,
        },
      })

      if (error) {
        setError(error.message || "Failed to load invitation")
      } else if (data) {
        setInvitation(data as unknown as InvitationData)
      } else {
        setError("Invitation not found")
      }
    } catch (err) {
      setError("An error occurred while loading the invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (error) {
        toast.error(error.message || "Failed to accept invitation")
      } else {
        toast.success("Invitation accepted! Welcome to the team.")
        setTimeout(() => {
          router.push("/organizations")
        }, 2000)
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      })

      if (error) {
        toast.error(error.message || "Failed to reject invitation")
      } else {
        toast.success("Invitation rejected")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription>{error || "This invitation is no longer valid."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isAlreadyActioned = invitation.status !== "pending"

  return (
    <div className="container mx-auto py-16 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            {invitation.organization.logo ? (
              <img
                src={invitation.organization.logo}
                alt={invitation.organization.name}
                className="h-16 w-16 rounded-lg"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <div>
              <CardTitle className="text-2xl">You're Invited!</CardTitle>
              <CardDescription>Join {invitation.organization.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isExpired ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              <p className="font-semibold">This invitation has expired.</p>
              <p className="text-sm">Please contact the organization administrator for a new invitation.</p>
            </div>
          ) : isAlreadyActioned ? (
            <div className="rounded-lg bg-muted p-4">
              <p className="font-semibold">This invitation has already been {invitation.status}.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Organization:</span>
                  <span className="text-sm">{invitation.organization.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Invited by:</span>
                  <span className="text-sm">{invitation.inviter.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Your role:</span>
                  <span className="text-sm font-semibold capitalize">{invitation.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expires:</span>
                  <span className="text-sm">{new Date(invitation.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleAccept}
                  disabled={accepting || rejecting}
                >
                  {accepting ? (
                    "Accepting..."
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Accept Invitation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={accepting || rejecting}
                >
                  {rejecting ? (
                    "Rejecting..."
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
