"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLogout, useSession } from "@/hooks/use-session"
import { useInvitation, useAcceptInvitation } from "@/hooks/use-members"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import {
  clearInvitation,
  getInvitation,
  saveInvitation,
} from "@/utils/invitation-storage"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  let invitationId = searchParams.get("id")
  const sessionQuery = useSession()
  const user = sessionQuery.data?.data?.user
  const isLoadingSession = sessionQuery.isPending
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedAccept, setHasAttemptedAccept] = useState(false)
  const { mutateAsync: logout } = useLogout({
    redirect: false,
  })

  // Save invitation to localStorage when page loads with ID in URL
  // This ensures the token persists across browser tabs and through email verification flow
  useEffect(() => {
    if (invitationId) {
      // We'll save to localStorage once we have the invitation details (email)
      // This is handled after invitation data is fetched
    }
  }, [invitationId])

  // Check for pending invitation in localStorage if no ID in URL
  useEffect(() => {
    if (!invitationId && user) {
      const pendingInvitation = getInvitation()
      if (
        pendingInvitation &&
        pendingInvitation.email.toLowerCase() === user.email?.toLowerCase()
      ) {
        // Redirect to accept-invite with the stored token
        router.push(`/accept-invite?id=${pendingInvitation.inviteToken}`)
      }
    }
  }, [invitationId, user, router])

  // Use the invitation ID from URL parameter
  if (!invitationId) {
    const pendingInvitation = getInvitation()
    if (
      pendingInvitation &&
      user?.email?.toLowerCase() === pendingInvitation.email.toLowerCase()
    ) {
      invitationId = pendingInvitation.inviteToken
    }
  }

  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useInvitation(invitationId || undefined)

  const { mutateAsync: acceptInvitation } = useAcceptInvitation()

  // Save invitation to localStorage once we have the invitation data
  // This ensures the token persists across browser tabs and through email verification flow
  useEffect(() => {
    if (invitationId && invitation && invitation.email) {
      // Get role from invitation (roleId.name) - convert to 'admin' | 'user'
      const role =
        invitation.roleId?.name?.toLowerCase() === "admin" ? "admin" : "user"
      saveInvitation(
        invitationId,
        invitation.email,
        role,
        invitation.userExists
      )
    }
  }, [invitationId, invitation])

  useEffect(() => {
    if (!invitationId) {
      return
    }

    // Wait for session to load
    if (isLoadingSession || isLoadingInvitation) {
      return
    }

    // If invitation is invalid or expired, do nothing (show error state)
    if (invitationError || !invitation) {
      return
    }

    // Flow 1: User is not logged in
    // Check if user already exists - either from invitation.userExists or localStorage
    // localStorage can tell us if user just signed up (they went through signup flow)
    if (!user) {
      const pendingInvitation = getInvitation()

      // If localStorage says userExists is false but we have the invitation stored,
      // it means user just completed signup and verified email - redirect to login
      // Otherwise use invitation.userExists from the API
      const userAlreadySignedUp =
        pendingInvitation &&
        pendingInvitation.inviteToken === invitationId &&
        pendingInvitation.userExists === false

      // User exists if: API says so OR user just completed signup flow
      const shouldRedirectToLogin = invitation.userExists || userAlreadySignedUp

      if (shouldRedirectToLogin) {
        // User exists in database (or just created account), redirect to login
        router.push(
          `/login?inviteToken=${invitationId}&email=${encodeURIComponent(invitation.email)}`
        )
      } else {
        // User doesn't exist and hasn't signed up yet, redirect to signup
        router.push(
          `/signup?inviteToken=${invitationId}&email=${encodeURIComponent(invitation.email)}`
        )
      }
      return
    }

    // Flow 2: User is logged in with wrong email - show error
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(
        `Wrong email. This invitation was sent to ${invitation.email}. Please log in with the correct email account.`
      )
      return
    }

    // Flow 3: User is logged in with correct email - show manual accept button (handled in render)
  }, [
    invitationId,
    user,
    isLoadingSession,
    invitation,
    isLoadingInvitation,
    invitationError,
    router,
    acceptInvitation,
    isProcessing,
    hasAttemptedAccept,
  ])

  // Loading state
  if (isLoadingSession || isLoadingInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
        <div className="w-full max-w-lg rounded-lg border bg-card p-10 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-card-foreground">
              Loading invitation...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // No invitation ID
  if (!invitationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
        <div className="w-full max-w-lg rounded-lg border bg-card p-10 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold text-card-foreground">Invalid Link</h1>
            <p className="text-center text-muted-foreground">
              This invitation link is invalid or incomplete. Please check the
              link and try again.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Email mismatch or other acceptance error
  if (error) {
    const isEmailMismatch = error.toLowerCase().includes("wrong email")

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
        <div className="w-full max-w-lg rounded-lg border bg-card p-10 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold text-card-foreground">
              {isEmailMismatch
                ? "Wrong Email Account"
                : "Cannot Accept Invitation"}
            </h1>
            <p className="text-center text-muted-foreground">{error}</p>
            {isEmailMismatch && user && (
              <div className="w-full rounded-lg border bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current email:</span>
                  <span className="font-medium text-card-foreground">
                    {user.email}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Required email:</span>
                  <span className="font-medium text-destructive">
                    {invitation?.email}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full mt-4">
              <button
                onClick={() => {
                  // Log out and redirect to login page
                  logout().then(() => {
                    router.push(
                      `/login?inviteToken=${invitationId}&email=${encodeURIComponent(invitation?.email || "")}`
                    )
                  })
                }}
                className="rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Log in with Correct Email
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-lg border bg-background px-6 py-2.5 text-foreground hover:bg-accent transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Invitation error (invalid, expired, or already processed)
  if (invitationError || !invitation) {
    const errorMessage =
      invitationError instanceof Error
        ? invitationError.message
        : "Invitation not found or has expired"

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
        <div className="w-full max-w-lg rounded-lg border bg-card p-10 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Clock className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold text-card-foreground">
              Invitation Expired
            </h1>
            <p className="text-center text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground text-center">
              Please contact the person who invited you to send a new
              invitation.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Processing invitation
  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
        <div className="w-full max-w-lg rounded-lg border bg-card p-10 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold text-card-foreground">
              Accepting Invitation
            </h1>
            <p className="text-center text-muted-foreground">
              Please wait while we add you to{" "}
              <strong className="text-card-foreground">{invitation.orgId.name}</strong>...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Manual accept handler for logged-in users
  const handleManualAccept = async () => {
    if (isProcessing || hasAttemptedAccept) return
    setIsProcessing(true)
    setHasAttemptedAccept(true)
    setError(null)

    try {
      const result = await acceptInvitation(invitationId)

      // Clear any pending invitation from session storage
      clearInvitation()

      // Redirect to dashboard with new org
      window.location.href = `/`
    } catch (err) {
      console.error("Error accepting invitation:", err)
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation"
      setError(message)
      setIsProcessing(false)
      setHasAttemptedAccept(false)
    }
  }

  // Valid invitation - show details with manual accept button
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted px-4">
      <div className="w-full max-w-xl rounded-lg border bg-card p-10 shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-card-foreground">
              You&apos;ve Been Invited!
            </h1>
            <p className="text-muted-foreground text-lg">
              <strong className="text-card-foreground">
                {invitation.invitedBy.metadata?.name || "A team member"}
              </strong>{" "}
              invited you to join
            </p>
          </div>

          <div className="w-full rounded-lg border bg-muted/50 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Organization:</span>
              <span className="font-semibold text-card-foreground text-lg">
                {invitation.orgId.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Role:</span>
              <span className="font-medium text-card-foreground">
                {invitation.roleId.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-medium text-card-foreground">
                {invitation.email}
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </div>

          {!user ? (
            <button
              onClick={() =>
                router.push(
                  `/signup?inviteToken=${invitationId}&email=${encodeURIComponent(invitation.email)}`
                )
              }
              className="w-full rounded-lg bg-primary px-6 py-3.5 text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-lg"
            >
              Accept Invitation
            </button>
          ) : (
            <button
              onClick={handleManualAccept}
              disabled={isProcessing}
              className="w-full rounded-lg bg-primary px-6 py-3.5 text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
      <div className="w-full max-w-lg rounded-lg border bg-card p-10 shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-card-foreground">
            Loading invitation...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInviteContent />
    </Suspense>
  )
}
