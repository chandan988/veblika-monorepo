import { betterAuth } from "better-auth"
import { createAuthMiddleware, APIError, getOAuthState } from "better-auth/api"

import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { nextCookies } from "better-auth/next-js"
import { resetPasswordHtml } from "./email/templates/reset-password"
import { email } from "./email"
import { verificationEmailHtml } from "./email/templates/verfication-email"
import { getDatabase } from "./mongodb"
const from = process.env.DEFAULT_FROM_EMAIL || "no-reply.Veblika.com"

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  trustedOrigins: [
    "https://*.backendassist.com",
    "http://localhost:*",
    "https://*.veblika.com",
    "https://*.vebxai.com",
  ],

  // trustedOrigins: async (request) => {
  //   if (!request) {
  //     return ["https://*.backendassist.com", "http://localhost:*"]
  //   }

  //   // Get all host entries from reseller_app collection
  //   const resellerApps = await getDatabase()
  //     .db.collection("reseller_app")
  //     .find({}, { host: 1, _id: 0 })
  //     .toArray()

  //   // Here use Set to avoid duplicate origins
  //   // Todo : 1 ) Cache this result to avoid DB query on every request
  //   // 2 ) Validate the origin
  //   const originsSet = new Set<string>()
  //   resellerApps.forEach((app: { host: string }) => {
  //     originsSet.add("https://*.backendassist.com")
  //     originsSet.add("http://localhost:*")
  //     if (app?.host) {
  //       originsSet.add(`https://${app.host}`)
  //     }
  //   })
  //   console.log("Trusted origins:", Array.from(originsSet))
  //   return Array.from(originsSet)
  // },
  // advanced: {
  //   crossSubDomainCookies: {
  //           enabled: true,
  //           domain: "veblika.com"
  //       },
  //   // disableOriginCheck: true,
  //   // disableCSRFCheck: true
  // },

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain:
        process.env.NODE_ENV === "production" ? "backendassist.com" : undefined,
    },
    // defaultCookieAttributes: {
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: "none",
    // },
  },
  database: mongodbAdapter(getDatabase().db, {
    client: getDatabase().client,
  }),
  user: {
    additionalFields: {
      resellerId: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "admin",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
    maxPasswordLength: 20,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await email.sendEmail({
        from,
        to: user.email,
        subject: "Reset your password",
        html: await resetPasswordHtml(url, user.name),
      })
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,

    async sendVerificationEmail({ user, url }) {
      await email.sendEmail({
        from,
        to: user.email,
        subject: "Verify your email address",
        // html: `<a href="${url}">Verify your email address</a>`,
        html: await verificationEmailHtml(url, user.name),
      })
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return
      }
      const origin = ctx.headers?.get("origin") || ctx.headers?.get("referer")
      if (!origin) {
        throw new APIError("BAD_REQUEST", {
          message: "Origin header is missing",
        })
      }

      const host = new URL(origin).host
      console.log(host, "Host manual sign-up")
      const resellerApp = await getDatabase()
        .db.collection("reseller_app")
        .findOne({ host: host })
      if (!resellerApp) {
        throw new APIError("NOT_ACCEPTABLE", {
          message: "Reseller app not found for the given host",
        })
      }

      // Get role from request body - defaults to 'admin' if not provided
      // When signing up via invitation, role should be 'user'
      const requestedRole = ctx.body?.role
      const role = requestedRole === "user" ? "user" : "admin"
      console.log(
        "hooks.before - requestedRole:",
        requestedRole,
        "final role:",
        role
      )

      return {
        context: {
          ...ctx,
          body: {
            ...ctx.body,
            resellerId: resellerApp.resellerId,
            role: role,
          },
        },
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (!ctx) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Context is missing in user creation",
            })
          }

          const origin =
            ctx.headers?.get("origin") || ctx.headers?.get("referer")
          if (!origin) {
            throw new APIError("BAD_REQUEST", {
              message: "Origin header is missing",
            })
          }

          const host = new URL(origin).host
          const resellerApp = await getDatabase()
            .db.collection("reseller_app")
            .findOne({ host: host })
          if (!resellerApp) {
            throw new APIError("NOT_ACCEPTABLE", {
              message: "Reseller app not found for the given host",
            })
          }

          // Try to get role from OAuth state (for Google signup)
          // This is set via additionalData in signIn.social()
          let role = user.role
          try {
            const oauthState = await getOAuthState()
            if (oauthState?.role) {
              role = oauthState.role === "user" ? "user" : "admin"
              console.log("OAuth state role:", role)
            }
          } catch {
            console.log("No OAuth state found")
          }

          console.log("Final role being saved:", role)

          return {
            data: {
              ...user,
              resellerId: resellerApp.resellerId,
              role: role,
            },
          }
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // mapProfileToUser: (profile) => ({
      //   displayName: profile.name,
      //   username: generateUsernameFromEmail(profile.email),
      //   avatarUrl: profile.picture,
      //   email: profile.email,
      //   isVerified: profile.email_verified,
      // }),
    },
  },
  plugins: [nextCookies()],
})
