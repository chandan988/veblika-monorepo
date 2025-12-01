import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins/organization"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import mongoose from "mongoose"
import { config } from "./config"
import { emailService } from "./services/email"
import { verificationEmailHtml } from "./services/email/templates/verification-email"
import { resetPasswordHtml } from "./services/email/templates/reset-password"
import { invitationEmailHtml } from "./services/email/templates/invitation-email"

console.log(process.env)
console.log(config.google)

// Database connection
if (!config.mongodb.uri) {
  throw new Error("MONGODB_URI environment variable is not set")
}

// Ensure mongoose is connected before initializing auth
if (mongoose.connection.readyState !== 1) {
  throw new Error(
    "MongoDB connection must be established before initializing auth"
  )
}

// MongoDB client for Better Auth
const mongoClient = mongoose.connection.getClient()

// Default email sender
const from = process.env.DEFAULT_FROM_EMAIL || "noreply@veblika.com"

// Base URL for the application
const baseUrl = config.client.url

export const auth = betterAuth({
  baseURL: "http://localhost:8000",
  trustedOrigins: ["http://localhost:3000", "http://localhost:8000"],

  database: mongodbAdapter(mongoose.connection.db!, {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,

    sendResetPassword: async ({ user, url }) => {
      try {
        await emailService.sendEmail({
          from,
          to: user.email,
          subject: "Reset Your Password - Veblika",
          html: resetPasswordHtml(url, user.name),
        })
        console.log(`✉️ Password reset email sent to: ${user.email}`)
      } catch (error) {
        console.error("Failed to send password reset email:", error)
        throw error
      }
    },
  },

  // Email verification
  emailVerification: {
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      try {
        await emailService.sendEmail({
          from,
          to: user.email,
          subject: "Verify Your Email Address - Veblika",
          html: verificationEmailHtml(url, user.name),
        })
        console.log(`✉️ Verification email sent to: ${user.email}`)
      } catch (error) {
        console.error("Failed to send verification email:", error)
        throw error
      }
    },
  },

  // Plugins
  plugins: [
    // Organization plugin for multi-tenancy
    organization({
      // Organization creation settings
      allowUserToCreateOrganization: true,

      // Require email verification for invitations
      requireEmailVerificationOnInvitation: false,

      // Send invitation email
      async sendInvitationEmail(data) {
        try {
          const inviteLink = `${baseUrl}/accept-invitation/?id=${data.id}&email=${data.email}`

          // console.log(data,"Invitation Data")
          // throw new Error("Intentional Error for Testing")

          await emailService.sendEmail({
            from,
            to: data.email,
            subject: `You've been invited to join ${data.organization.name} - Veblika`,
            html: invitationEmailHtml(
              inviteLink,
              data.organization.name,
              data.inviter.user.name,
              data.role
            ),
          })
          console.log(`✉️ Invitation email sent to: ${data.email}`)
        } catch (error) {
          console.error("Failed to send invitation email:", error)
          throw error
        }
      },
    }),
  ],

  // Social providers
  socialProviders: {
    google: {
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    },
  },
})
