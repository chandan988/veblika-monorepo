"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthSession } from "@/hooks/use-auth-session"
import { Spinner } from "@/components/ui/spinner"

export function ProfileSettings() {
  const { user, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No user session found. Please login.
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  const displayName = user.name || user.email || "User";
  const displayEmail = user.email || "No email";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <p className="text-sm text-muted-foreground">Update your personal information</p>

      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold">Profile details</h3>

        <div className="mt-6 space-y-4">
          {/* Profile row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || ""} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {user.emailVerified ? "Verified" : "Not verified"}
                </div>
              </div>
            </div>
            <div className="md:flex md:justify-end">
              <Button variant="outline">Change photo</Button>
            </div>
          </div>

          {/* Email row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="text-sm">Email Address</div>
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
              <div className="text-sm text-muted-foreground">{displayEmail}</div>
              <Button variant="outline" className="md:mt-0" disabled>
                Change Email address
              </Button>
            </div>
          </div>
          
          {/* User ID row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="text-sm">User ID</div>
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
              <div className="text-sm text-muted-foreground font-mono">{user.id}</div>
            </div>
          </div>
          
          {/* Account Created row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="text-sm">Account Created</div>
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
              <div className="text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>

          {/* Phone row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="text-sm">Phone number</div>
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
              <div className="text-sm text-muted-foreground">+91 36498264892387283</div>
              <Button variant="outline">Change phone number</Button>
            </div>
          </div>

          {/* Theme row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="text-sm">Theme</div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <div className="h-6 w-6 rounded-full bg-orange-500" />
              <div className="h-6 w-6 rounded-full bg-pink-500" />
              <div className="h-6 w-6 rounded-full bg-green-500" />
              <div className="h-6 w-6 rounded-full bg-blue-500" />
              <div className="h-6 w-6 rounded-full bg-slate-800" />
              <Button variant="outline">Change</Button>
            </div>
          </div>
        </div>

        <h3 className="mt-6 text-lg font-semibold">Security</h3>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 border-b pb-4">
            <div className="text-sm">Password</div>
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
              <Input readOnly value="cdms[kmvsio" className="w-full md:w-48" />
              <Button variant="outline">Change password</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3">
            <div className="text-sm">Account Termination</div>
            <div>
              <Button variant="destructive">Delete account</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ProfileSettings
