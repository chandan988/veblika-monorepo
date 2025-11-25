import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

// export const authClient = createAuthClient({
//   baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
//   // fetchOptions: {
//   //   credentials: "include",
//   //   throw: true,
//   // },
//   plugins: [organizationClient()],
// })
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
  plugins: [organizationClient()],
})
