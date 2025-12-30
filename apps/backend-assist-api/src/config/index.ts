import dotenv from "dotenv"

dotenv.config()

// Allow all origins for all environments
const allowedOrigins = true

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/veblika-assist",
  },
  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
    baseUrl: process.env.APP_BASE_URL || "http://localhost:8000",
  },
  cors: {
    origin: allowedOrigins,
  },

  auth: {
    authUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
  },
  client: {
    url: process.env.CLIENT_URL || "http://localhost:3003",
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
  aws: {
    region: process.env.AWS_REGION || "ap-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    s3: {
      bucket: process.env.AWS_S3_BUCKET || "veblika-assist-attachments",
      endpoint: process.env.AWS_S3_ENDPOINT || undefined, // For S3-compatible services like MinIO
    },
  },
}
