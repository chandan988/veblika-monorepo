"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { useCreateOrganisation, useCheckSlug } from "@/hooks/use-organisations"
import { useSession } from "@/hooks/use-session"

const createOrganisationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers, and hyphens allowed"
    ),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
})

type FormData = z.infer<typeof createOrganisationSchema>

interface CreateOrganisationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrganisationModal({
  open,
  onOpenChange,
}: CreateOrganisationModalProps) {
  const session = useSession()
  const [debouncedSlug, setDebouncedSlug] = useState("")
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false)

  const createOrganisation = useCreateOrganisation()
  const { data: isSlugAvailable, isLoading: isCheckingSlug } =
    useCheckSlug(debouncedSlug)

  const form = useForm<FormData>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  })

  const name = form.watch("name")
  const slug = form.watch("slug")

  // Auto-generate slug from name only if user hasn't manually edited it
  useEffect(() => {
    if (name && !hasManuallyEditedSlug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50)
      form.setValue("slug", generatedSlug)
    }
  }, [name, hasManuallyEditedSlug, form])

  // Debounce slug for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (slug && slug.length >= 3) {
        setDebouncedSlug(slug)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [slug])

  const onSubmit = async (data: FormData) => {
    try {
      await createOrganisation.mutateAsync({
        name: data.name,
        slug: data.slug,
        logo: data.logo || undefined,
      })
      form.reset()
      setHasManuallyEditedSlug(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create organisation:", error)
    }
  }

  const handleClose = () => {
    form.reset()
    setHasManuallyEditedSlug(false)
    onOpenChange(false)
  }

  const getSlugStatus = () => {
    if (!slug || slug.length < 3) return null
    if (isCheckingSlug) {
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking availability...
        </span>
      )
    }
    if (isSlugAvailable) {
      return <span className="text-xs text-green-500">✓ Slug is available</span>
    }
    return <span className="text-xs text-red-500">✗ Slug is already taken</span>
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Create Organisation</DialogTitle>
          <DialogDescription className="text-center">
            Create a new organisation to manage your team and resources.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Company" {...field} />
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">/</span>
                      <Input
                        placeholder="my-company"
                        {...field}
                        onChange={(e) => {
                          setHasManuallyEditedSlug(true)
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                          field.onChange(value)
                        }}
                      />
                    </div>
                  </FormControl>
                  {!form.formState.errors.slug && (
                    <FormDescription>{getSlugStatus()}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  createOrganisation.isPending ||
                  (slug.length >= 3 && !isSlugAvailable)
                }
              >
                {createOrganisation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organisation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {createOrganisation.isError && (
          <p className="text-sm text-red-500 text-center">
            {createOrganisation.error instanceof Error
              ? createOrganisation.error.message
              : "Failed to create organisation"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}