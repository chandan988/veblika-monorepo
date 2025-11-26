"use client"

import { useEffect, useState, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Building2, Check, X, Loader2, AlertCircle } from "lucide-react"

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>
}) {
  const router = useRouter()

  const { invitationId } = use(params)
  console.log(use(params))

  const { data: session, isPending: sessionLoading } = authClient.useSession()

  interface Invitation {
    id: string
    email: string
    role: string
    status: string
    organizationId: string
    organization?: {
      name: string
    }
    inviter?: {
      user: {
        name?: string
      }
    }
  }

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId) return

      try {
        setLoading(true)
        const { data, error } = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        })

        if (error) {
          setError(error.message || "Failed to load invitation")
        } else if (data) {
          setInvitation(data as Invitation)
        }
      } catch (err) {
        setError("Failed to load invitation details")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if user is logged in
    if (session?.user && !sessionLoading) {
      fetchInvitation()
    } else if (!sessionLoading) {
      setLoading(false)
    }
  }, [invitationId, session, sessionLoading])

  const handleAccept = async () => {
    setProcessing(true)
    setError("")

    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (error) {
        setError(error.message || "Failed to accept invitation")
      } else {
        // Successfully accepted - redirect to organization page
        router.push("/organisation")
      }
    } catch (err) {
      setError("An error occurred while accepting the invitation")
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    setError("")

    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      })

      if (error) {
        setError(error.message || "Failed to reject invitation")
      } else {
        // Successfully rejected - redirect to home
        router.push("/")
      }
    } catch (err) {
      setError("An error occurred while rejecting the invitation")
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  // Show loading state
  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  // User must be logged in to accept/reject invitations
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Login Required
            </CardTitle>
            <CardDescription>
              You need to be logged in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please log in or create an account to accept the invitation to
                join the organization.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() =>
                  router.push(
                    `/login?redirect=/accept-invitation/${invitationId}`
                  )
                }
                className="w-full"
              >
                Log In
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/signup?redirect=/accept-invitation/${invitationId}`
                  )
                }
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if invitation not found or failed to load
  if (error && !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if invitation is already accepted/rejected
  if (invitation?.status !== "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation {invitation?.status}</CardTitle>
            <CardDescription>
              This invitation has already been {invitation?.status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/organisation")}
              className="w-full"
            >
              Go to Organizations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show invitation details and accept/reject options
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">
            You&apos;ve Been Invited!
          </CardTitle>
          <CardDescription className="text-center">
            You&apos;ve been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="font-semibold">{invitation?.organization?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold capitalize">{invitation?.role}</p>
            </div>
            {invitation?.inviter?.user?.name && (
              <div>
                <p className="text-sm text-muted-foreground">Invited by</p>
                <p className="font-semibold">{invitation.inviter.user.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Your Email</p>
              <p className="font-semibold">{invitation?.email}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Email Mismatch Warning */}
          {session.user.email?.toLowerCase() !==
            invitation?.email?.toLowerCase() && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This invitation was sent to {invitation?.email}, but you&apos;re
                logged in as {session.user.email}. You may need to log in with
                the correct account.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleReject}
              variant="outline"
              disabled={processing}
              className="flex-1 gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Accept Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
