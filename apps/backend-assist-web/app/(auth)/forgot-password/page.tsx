"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@workspace/ui/components/form"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { ArrowLeft, Mail } from "lucide-react"

const forgetPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
})

type ForgetPasswordFormValues = z.infer<typeof forgetPasswordSchema>

export default function ForgetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgetPasswordFormValues>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgetPasswordFormValues) => {
    setIsLoading(true)

    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/reset-password",
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to send reset email")
      } else {
        toast.success("Password reset email sent!")
        setEmailSent(true)
      }
    } catch (error) {
      toast.error("An error occurred while sending reset email")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription>
            {emailSent
              ? "Check your email for a password reset link"
              : "Enter your email address and we'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {`We've sent a password reset link to`}
                  <span className="font-medium text-foreground">{form.getValues("email")}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {`Didn't receive the email? Check your spam folder or`}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    try again
                  </button>
                </p>
              </div>
            </div>
          ) : (
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
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the email address associated with your account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
