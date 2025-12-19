"use client"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import React from "react"
import { toast } from "sonner"

export default function AuthHomePage() {
  const [loading, setLoading] = React.useState(false)
  const handleLogout = async () => {
    // Implement logout logic here
    console.log("User logged out")
    setLoading(true)
    const data = await authClient.signOut()
    if(data.data?.success){
        toast.success("Logged out successfully")
    }
    setLoading(false)
  }
  return (
    <div>
      <div>Auth Home Page</div>
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  )
}
