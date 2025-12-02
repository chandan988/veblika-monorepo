import dotenv from "dotenv"

dotenv.config()

const allowedOrigins = (() => {
  const fallbacks = [
    "http://localhost:3000", // Next.js app
    "http://localhost:5173", // Widget UI (Vite)
    "*", // Allow all origins for widget embedding
  ]

  // Deduplicate while preserving order
  return Array.from(new Set([...fallbacks]))
})()

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
  },
  cors: {
    origin: allowedOrigins,
  },

  auth: {
    serviceUrl: process.env.BETTER_AUTH_URL || "http://localhost:8000",
  },
  client: {
    url: process.env.CLIENT_URL || "http://localhost:3000",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    gmailPubsubTopic: process.env.GMAIL_PUBSUB_TOPIC || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
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
