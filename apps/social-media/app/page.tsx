"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  const { data: session, isPending } = authClient.useSession()
  console.log("Session in server app:", session)

  if (isPending) {
    return <div>Loading session...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Server App - Protected Page</h1>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Session Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
}
