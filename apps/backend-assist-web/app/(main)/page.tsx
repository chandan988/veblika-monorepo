"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@workspace/ui/components/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function Page() {
  const router = useRouter()
  const [error, setError] = useState("")

  const { data: session } = authClient.useSession()
  const { data: organizations, isPending: isOrgLoading } = authClient.useListOrganizations()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError("")

    try {
      const { data, error } = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
        metadata: values.description ? { description: values.description } : undefined,
      })

      if (error) {
        throw new Error(error.message || "Failed to create organization")
      }

      if (data) {
        router.push(`/org/${data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (isOrgLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Show existing organization if user already has one
  if (organizations && organizations.length > 0) {
    const org = organizations[0]
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Your Organization</CardTitle>
            <CardDescription>You already have an organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-lg">{org.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Slug</p>
              <p className="text-lg">{org.slug}</p>
            </div>
            {org.metadata?.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-lg">{org.metadata.description}</p>
              </div>
            )}
            <Button 
              onClick={() => router.push(`/org/${org.id}`)} 
              className="w-full"
            >
              Go to Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show create form if no organization exists
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>Welcome, {session?.user?.name || session?.user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="acme-inc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your organization..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

    </div>
  )
}