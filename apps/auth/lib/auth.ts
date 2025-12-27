import { APIError, betterAuth } from "better-auth"

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
  ],
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
      domain: process.env.NODE_ENV === "production" ? "backendassist.com" : undefined,
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
        defaultValue: "user",
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
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (!ctx) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Context is missing in user creation",
            })
          }

          const host = ctx.headers?.get("host")
          const reseller = await getDatabase().db
            .collection("reseller")
            .findOne({ host: host })
          if (!reseller) {
            throw new APIError("NOT_ACCEPTABLE", {
              message: "Reseller not found for the given host",
            })
          }
          return { data: { ...user, resellerId: reseller._id } }
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
})
