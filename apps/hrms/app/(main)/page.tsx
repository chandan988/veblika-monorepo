"use client"

import { authClient } from "@/lib/auth-client"

export default function HomePage() {
  const { data } = authClient.useSession()
  console.log("Session data:", data)

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
