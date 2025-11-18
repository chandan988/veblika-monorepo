"use client"

import { authClient } from "@/lib/auth-client"
export default function MainPage() {
  const session = authClient.useSession()
  // console.log("Session in auth app:", session)
  return <div>Main Page</div>
}
