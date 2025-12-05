"use client"

import { authClient } from "@/lib/auth-client"

export default function HomePage() {
  const { data } = authClient.useSession()

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
