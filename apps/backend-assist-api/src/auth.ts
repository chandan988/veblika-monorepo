import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins/organization"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import mongoose from "mongoose"
import { config } from "./config"
import { emailService } from "./services/email"
import { verificationEmailHtml } from "./services/email/templates/verification-email"
import { resetPasswordHtml } from "./services/email/templates/reset-password"
import { invitationEmailHtml } from "./services/email/templates/invitation-email"

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
const from = config.email.from

// Base URL for the application
const baseUrl = config.client.url

export const auth = betterAuth({
  baseURL: config.auth.serviceUrl,
  // Allow all origins for all environments
  trustedOrigins: ["https://*.veblika.com","https://social.veblika.com],
  advanced: {
    crossSubDomainCookies: {
            enabled: true,
            domain: "veblika.com"
        },
    // disableOriginCheck: true,
    // disableCSRFCheck: true
  },

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

  // Database hooks to auto-set active organization on session creation
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            // Get user's organizations
            console.log(
              "Setting active organization for session user:",
              session.userId
            )
            const db = mongoose.connection.db!
            const organizations = await db
              .collection("member")
              .findOne({ userId: new mongoose.Types.ObjectId(session.userId) })
            console.log("User organizations:", organizations)

            // If user has at least one organization, set it as active
            if (organizations) {
              return {
                data: {
                  ...session,
                  activeOrganizationId: organizations.organizationId.toString(),
                },
              }
            }

            return {
              data: session,
            }
          } catch (error) {
            console.error(
              "Error setting active organization on session:",
              error
            )
            // Return session as-is if there's an error
            return {
              data: session,
            }
          }
        },
      },
    },
  },

  // Plugins
  plugins: [
    // Organization plugin for multi-tenancy
    organization({
      // Organization creation settings
      allowUserToCreateOrganization: true,
      organizationLimit: 1,

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

      // Organization hooks to set active organization after creation
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          try {
            console.log(
              `🏢 Setting newly created organization as active: ${organization.name}`
            )
            // Note: The session will be updated automatically by Better Auth
            // when we call setActiveOrganization from the client after organization creation
          } catch (error) {
            console.error("Error in afterCreateOrganization hook:", error)
          }
        },
      },
    }),
  ],

  // Social providers
  socialProviders: {
    google: {
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      redirectURI: `${config.auth.serviceUrl}/api/auth/callback/google`,
    },
  },
})
