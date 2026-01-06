"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { getInvitation } from "@/utils/invitation-storage"

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const emailParam = searchParams.get("email")
  const inviteToken = searchParams.get("inviteToken")
  const [isLoading, setIsLoading] = useState(false)

  // Check localStorage for pending invitation on page load
  // This handles the case when user comes back after email verification
  useEffect(() => {
    // If no inviteToken in URL, check localStorage for pending invitation
    if (!inviteToken) {
      const pendingInvitation = getInvitation()
      if (pendingInvitation) {
        // Redirect to login with the stored invitation token
        router.replace(
          `/login?inviteToken=${pendingInvitation.inviteToken}&email=${encodeURIComponent(pendingInvitation.email)}`
        )
      }
    }
  }, [inviteToken, router])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam || "",
      password: "",
    },
  })

  // Update email field when emailParam changes
  useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam)
    }
  }, [emailParam, form])

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        ...(inviteToken && {
          callbackURL: `${process.env.NEXT_PUBLIC_CLIENT_URL}/accept-invite?id=${inviteToken}`,
        }),
        // callbackURL: redirectTo || process.env.NEXT_PUBLIC_CLIENT_URL,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to login")
      } else {
        toast.success("Login successful!")
        // Redirect after successful login
        if (inviteToken) {
          // If coming from invitation flow, redirect to accept-invite page
          router.push(`/accept-invite?id=${inviteToken}`)
        } else {
          // Check localStorage for pending invitation
          const pendingInvitation = getInvitation()
          if (
            pendingInvitation &&
            pendingInvitation.email.toLowerCase() === data.email.toLowerCase()
          ) {
            router.push(`/accept-invite?id=${pendingInvitation.inviteToken}`)
          } else if (redirectTo) {
            router.push(redirectTo)
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred during login")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: inviteToken
          ? `${process.env.NEXT_PUBLIC_CLIENT_URL}/accept-invite?id=${inviteToken}`
          : redirectTo || process.env.NEXT_PUBLIC_CLIENT_URL,
        additionalData: {
          role: inviteToken ? "user" : "admin",
        },
      })
    } catch (error) {
      toast.error("Failed to login with Google")
      console.error(error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 text-base font-medium"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
              Or sign in with email
            </span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        disabled={isLoading || !!emailParam}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    {emailParam && (
                      <p className="text-xs text-muted-foreground">
                        Email locked for invitation
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forget-password"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {`Don't have an account?`}
            <Link
              href={`/signup${inviteToken ? `?inviteToken=${inviteToken}${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ""}` : ""}`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
