import { APIError, betterAuth } from "better-auth"
import { MongoClient, ObjectId } from "mongodb"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { nextCookies } from "better-auth/next-js"
import { resetPasswordHtml } from "./email/templates/reset-password"
import { email } from "./email"
import { verificationEmailHtml } from "./email/templates/verfication-email"


console.log(process.env.DATABASE_URL)
console.log(JSON.stringify(process.env, null, 2))

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set")
}

// Create MongoDB client
// const client = new MongoClient(process.env.DATABASE_URL)

// Connect to MongoDB
// let connectionPromise: Promise<MongoClient> | null = null

const from = process.env.DEFAULT_FROM_EMAIL || "no-reply.Veblika.com"

// async function connectToDatabase() {
//   if (!connectionPromise) {
//     connectionPromise = client.connect()
//     console.log("Connecting to MongoDB...")
//   }
//   await connectionPromise
//   console.log("MongoDB connected successfully")
//   return client
// }

// // Establish connection
// await connectToDatabase()

// const db = client.db()

const client = new MongoClient(process.env.DATABASE_URL)
const db = client.db()

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  trustedOrigins: [
    "https://*.veblika.com",
    "https://support.veblika.com",
    "https://auth.veblika.com",
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
      domain: process.env.NODE_ENV === "production" ? "veblika.com" : undefined,
    },
    // defaultCookieAttributes: {
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: "none",
    // },
  },
  database: mongodbAdapter(db, {
    client: client,
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
          const reseller = await db
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
