import dotenv from "dotenv"

dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/backend-assist",
  },
  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || "http://localhost:3000",
  },
  auth: {
    serviceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET || "change-me",
  },
  client: {
    url: process.env.CLIENT_URL || "http://localhost:3001",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    gmailPubsubTopic: process.env.GMAIL_PUBSUB_TOPIC || "",
  },
}
