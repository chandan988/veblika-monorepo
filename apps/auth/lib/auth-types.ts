import type { auth } from "./auth"
import { authClient } from "./auth-client"

export type Session = typeof auth.$Infer.Session
export type Invitation = typeof authClient.$Infer.Invitation