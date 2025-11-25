import dotenv from "dotenv"

dotenv.config()

// const allowedOrigins = (() => {
//   const fromEnv =
//     process.env.CORS_ORIGIN
//       ?.split(",")
//       .map((o) => o.trim())
//       .filter(Boolean) || []

//   const fromClient = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []

//   const fallbacks = ["http://localhost:3000", "http://localhost:3001"]

//   // Deduplicate while preserving order
//   return Array.from(new Set([...fromEnv, ...fromClient, ...fallbacks]))
// })()

const allowedOrigins = ["http://localhost:3000"]

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/backend-assist",
  },
  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
  },
  cors: {
    origin: allowedOrigins,
  },

  auth: {
    serviceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET || "change-me",
    secret: process.env.BETTER_AUTH_SECRET || "change-me-secret-32-chars-min",
  },
  client: {
    url: process.env.CLIENT_URL || "http://localhost:3000",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    gmailPubsubTopic: process.env.GMAIL_PUBSUB_TOPIC || "",
  },
  email: {
    from: process.env.DEFAULT_FROM_EMAIL || "noreply@veblika.com",
    smtp: {
      host: process.env.SMTP_HOST || "email-smtp.ap-south-1.amazonaws.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || false,
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  },
}
