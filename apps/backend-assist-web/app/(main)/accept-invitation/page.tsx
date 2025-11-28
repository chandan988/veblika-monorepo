"use client"
import { useSession } from "@/hooks/useSession"
import { api } from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import queryString from "query-string"
import { useEffect } from "react"

// API Usage: You can now access the API at: GET /api/v1/users/by-email?email=user@example.com

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = queryString.parse(searchParams.toString())
  const invitationId = query.id as string
  const email = query.email as string

  const { data: sessionData, isPending: isSessionLoading } = useSession()
  const { data: userResponse, isPending: isUserLoading, error } = useQuery({
    queryKey: ["getUserByEmail", email],
    queryFn: async () => {
      if (!email) throw new Error("Email is required")
      const response = await api.get("/users/by-email", {
        params: {
          email: email,
        },
      })
      return response.data
    },
    enabled: !!email,
    retry: false,
  })

  useEffect(() => {
    if (isSessionLoading || isUserLoading) return
    if (!email || !invitationId) return

    // User doesn't exist (404 or error) - redirect to signup
    if (error || !userResponse?.data) {
      const encodedEmail = encodeURIComponent(email)
      const encodedId = encodeURIComponent(invitationId)
      router.push(`/signup?email=${encodedEmail}&invitationId=${encodedId}`)
      return
    }

    // User exists - check if they have a session
    if (sessionData?.data?.session) {
      // Has session - go directly to accept invitation page
      router.push(`/accept-invitation/${invitationId}`)
    } else {
      // No session - redirect to login
      const encodedEmail = encodeURIComponent(email)
      const encodedId = encodeURIComponent(invitationId)
      router.push(`/login?email=${encodedEmail}&invitationId=${encodedId}`)
    }
  }, [email, invitationId, userResponse, error, sessionData, isSessionLoading, isUserLoading, router])

  // Show loading state while determining where to redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing invitation...</p>
      </div>
    </div>
  )
}
