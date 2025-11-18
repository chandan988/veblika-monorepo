"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
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
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"

export function CreateOrganization() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const handleCreateOrganization = async () => {
    if (!name || !slug) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const metadata = { someKey: "someValue" }
      const { data, error } = await authClient.organization.create({
        name,
        slug, // required
        // logo: "https://example.com/logo.png",
        // metadata,
        // keepCurrentActiveOrganization: false,
      })

      if (error) {
        toast.error(error.message || "Failed to create organization")
      } else {
        toast.success("Organization created successfully!")
        setOpen(false)
        setName("")
        setSlug("")
        // Refresh the page or update the organization list
        window.location.reload()
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Organization</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new organization</DialogTitle>
          <DialogDescription>
            Organizations help you manage teams and projects together.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Organization Slug</Label>
            <Input
              id="slug"
              placeholder="acme-inc"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              This will be used in URLs: /org/{slug}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateOrganization} disabled={loading}>
            {loading ? "Creating..." : "Create Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
