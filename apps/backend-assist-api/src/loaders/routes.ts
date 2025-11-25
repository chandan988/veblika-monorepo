import { Express, Router } from "express"
import { config } from "../config/index"
import { notFoundHandler } from "../middleware/not-found"
import { errorHandler } from "../middleware/error-handler"

// Import routes here
import ticketRoutes from "../api/routes/ticket-routes"
import googleGmailAuthRoutes from "../api/routes/google-gmail-auth"
import gmailWatchRoutes from "../api/routes/gmail-watch"
import gmailWebhookRoutes from "../api/routes/gmail-webhook"
import gmailMessagesRoutes from "../api/routes/gmail-messages"
import notificationsRoutes from "../api/routes/notifications"

export const routesLoader = (app: Express): void => {
  const router = Router()

  // API routes
  router.use("/tickets", ticketRoutes)
  router.use("/auth", googleGmailAuthRoutes)
  router.use("/", gmailWatchRoutes)
  router.use("/", gmailWebhookRoutes)
  router.use("/", gmailMessagesRoutes)
  router.use("/notifications", notificationsRoutes)

  // Example route
  router.get("/", (req, res) => {
    res.json({
      message: "Backend Assist API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    })
  })

  // Mount all routes on API prefix
  app.use(config.api.prefix, router)

  // 404 handler (must be after all routes)
  app.use(notFoundHandler)

  // Error handler (must be last)
  app.use(errorHandler)
}
