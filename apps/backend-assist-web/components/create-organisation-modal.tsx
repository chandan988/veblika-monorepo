"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog"
import { useCreateOrganisation, useCheckSlug } from "@/hooks/use-organisations"

// ========================================
// Form Schema
// ========================================

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

// ========================================
// Component
// ========================================

interface CreateOrganisationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateOrganisationModal({
    open,
    onOpenChange,
}: CreateOrganisationModalProps) {
    const [debouncedSlug, setDebouncedSlug] = useState("")

    const createOrganisation = useCreateOrganisation()
    const { data: isSlugAvailable, isLoading: isCheckingSlug } = useCheckSlug(debouncedSlug)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(createOrganisationSchema),
        defaultValues: {
            name: "",
            slug: "",
            logo: "",
        },
    })

    const name = watch("name")
    const slug = watch("slug")

    // Auto-generate slug from name
    useEffect(() => {
        if (name && !slug) {
            const generatedSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .slice(0, 50)
            setValue("slug", generatedSlug)
        }
    }, [name, slug, setValue])

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
            reset()
            onOpenChange(false)
        } catch (error) {
            // Error handling is done by the mutation
            console.error("Failed to create organisation:", error)
        }
    }

    const handleClose = () => {
        reset()
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
                    <DialogTitle className="text-center">
                        Create Organisation
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Create a new organisation to manage your team and resources.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Organisation Name</Label>
                        <Input
                            id="name"
                            placeholder="My Company"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">/</span>
                            <Input
                                id="slug"
                                placeholder="my-company"
                                {...register("slug")}
                                onChange={(e) => {
                                    const value = e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9-]/g, "")
                                    setValue("slug", value)
                                }}
                            />
                        </div>
                        {errors.slug ? (
                            <p className="text-xs text-red-500">{errors.slug.message}</p>
                        ) : (
                            getSlugStatus()
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="logo">Logo URL (optional)</Label>
                        <Input
                            id="logo"
                            type="url"
                            placeholder="https://example.com/logo.png"
                            {...register("logo")}
                        />
                        {errors.logo && (
                            <p className="text-xs text-red-500">{errors.logo.message}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
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
