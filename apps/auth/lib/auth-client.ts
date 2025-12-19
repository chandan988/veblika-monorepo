import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { adminClient } from "better-auth/client/plugins"
import {
  ac,
  owner,
  admin,
  member,
  projectManager,
  supportAgent,
  viewer,
} from "./permissions"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
  plugins: [organizationClient()],
})
