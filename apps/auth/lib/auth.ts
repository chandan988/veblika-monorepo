import { APIError, betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"
import { organization } from "better-auth/plugins/organization"
import { admin as adminPlugin } from "better-auth/plugins"
import { MongoClient, ObjectId } from "mongodb"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { resetPasswordHtml } from "./email/templates/reset-password"
import { email } from "./email"
import { verificationEmailHtml } from "./email/templates/verfication-email"
import { invitationEmailHtml } from "./email/templates/invitation-email"
import {
  ac,
  owner,
  admin,
  member,
  projectManager,
  supportAgent,
  viewer,
} from "./permissions"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set")
}

// Create MongoDB client
const client = new MongoClient(process.env.DATABASE_URL)

// Connect to MongoDB
let connectionPromise: Promise<MongoClient> | null = null

const from = process.env.DEFAULT_FROM_EMAIL || "no-reply.Veblika.com"

async function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = client.connect()
    console.log("Connecting to MongoDB...")
  }
  await connectionPromise
  console.log("MongoDB connected successfully")
  return client
}

// Establish connection
await connectToDatabase()

const db = client.db()

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  trustedOrigins: ["*"],
  database: mongodbAdapter(db, {
    client: client,
  }),
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  user: {
    additionalFields: {
      resellerId: {
        type: "string",
        required: false,
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

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      console.log("Auth request path:", ctx.path)
      // Todo : Social login reseller logic
      if (ctx.path === "/sign-up/email") {
        // Get the hostname from headers
        const host = ctx.headers?.get("host")
        console.log("Sign-up request from host:", host)
        const reseller = await db.collection("reseller").findOne({ host: host })
        if (!reseller) {
          throw new APIError("NOT_ACCEPTABLE", {
            message: "Reseller not found for the given host",
          })
        }

        return {
          context: {
            ...ctx,
            body: {
              ...ctx.body,
              resellerId: reseller._id,
            },
          },
        }
      }
    }),
  },

  plugins: [
    organization({
      // Access Control
      // ac,
      // roles: {
      //   owner,
      //   admin,
      //   member,
      //   projectManager,
      //   supportAgent,
      //   viewer,
      // },

      // Allow users to create organizations
      allowUserToCreateOrganization: true,

      // Require email verification for invitations
      requireEmailVerificationOnInvitation: true,

      // Send invitation email
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation/${data.id}`

        await email.sendEmail({
          from,
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          html: await invitationEmailHtml(
            inviteLink,
            data.organization.name,
            data.inviter.user.name,
            data.role
          ),
        })
      },

      // // Organization hooks
      // organizationHooks: {
      //   // Before creating organization
      //   beforeCreateOrganization: async ({ organization, user }) => {
      //     console.log(
      //       `User ${user.email} is creating organization: ${organization.name}`
      //     )
      //     return {
      //       data: {
      //         ...organization,
      //         metadata: {
      //           ...organization.metadata,
      //           createdBy: user.id,
      //           createdAt: new Date().toISOString(),
      //         },
      //       },
      //     }
      //   },

      //   // After creating organization
      //   afterCreateOrganization: async ({ organization, member, user }) => {
      //     console.log(
      //       `Organization ${organization.name} created successfully by ${user.email}`
      //     )
      //     // Here you can add logic to create default resources, send notifications, etc.
      //   },

      //   // After accepting invitation
      //   afterAcceptInvitation: async ({
      //     invitation,
      //     member,
      //     user,
      //     organization,
      //   }) => {
      //     console.log(
      //       `${user.email} accepted invitation to ${organization.name}`
      //     )
      //     // Setup user account, assign default resources
      //   },

      //   // Before adding member
      //   beforeAddMember: async ({ member, user, organization }) => {
      //     console.log(`Adding ${user.email} to ${organization.name}`)
      //     return { data: member }
      //   },

      //   // After adding member
      //   afterAddMember: async ({ member, user, organization }) => {
      //     console.log(`${user.email} added to ${organization.name}`)
      //     // Send welcome email or create default resources
      //   },

      //   // Before removing member
      //   beforeRemoveMember: async ({ member, user, organization }) => {
      //     console.log(`Removing ${user.email} from ${organization.name}`)
      //     // Cleanup user's resources
      //   },

      //   // After removing member
      //   afterRemoveMember: async ({ member, user, organization }) => {
      //     console.log(`${user.email} removed from ${organization.name}`)
      //   },

      //   // Before updating member role
      //   beforeUpdateMemberRole: async ({
      //     member,
      //     newRole,
      //     user,
      //     organization,
      //   }) => {
      //     console.log(
      //       `Updating ${user.email} role in ${organization.name} to ${newRole}`
      //     )
      //     return {
      //       data: {
      //         role: newRole,
      //       },
      //     }
      //   },

      //   // After updating member role
      //   afterUpdateMemberRole: async ({
      //     member,
      //     previousRole,
      //     user,
      //     organization,
      //   }) => {
      //     console.log(
      //       `Role updated from ${previousRole} to ${member.role} for ${user.email}`
      //     )
      //   },

      //   // Team hooks
      //   afterCreateTeam: async ({ team, user, organization }) => {
      //     console.log(`Team ${team.name} created in ${organization.name}`)
      //     // Create default team resources
      //   },

      //   beforeDeleteTeam: async ({ team, user, organization }) => {
      //     console.log(`Deleting team ${team.name}`)
      //     // Backup team data
      //   },
      // },

      // // Dynamic Access Control (optional - if you want runtime role creation)
      // dynamicAccessControl: {
      //   enabled: true,
      //   maximumRolesPerOrganization: 20,
      // },
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
