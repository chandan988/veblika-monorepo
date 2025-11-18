import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(_: Request) {
  const result = await auth.api.registerSSOProvider({
    body: {
      providerId: "google",
      issuer: "https://accounts.google.com",
      domain: "google.com",
      oidcConfig: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        discoveryEndpoint:
          "https://accounts.google.com/.well-known/openid-configuration",
        scopes: ["openid", "email", "profile"],
        pkce: true,
        mapping: {
          id: "sub",
          email: "email",
          emailVerified: "email_verified",
          name: "name",
          image: "picture",
        },
      },
    },
  })

  return NextResponse.json(result)
}
