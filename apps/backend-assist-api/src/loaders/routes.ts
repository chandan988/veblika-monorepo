import { Express, Router } from "express"
import { config } from "../config/index"
import { notFoundHandler } from "../middleware/not-found"
import { errorHandler } from "../middleware/error-handler"

// Import routes here
import integrationRoutes from "../api/routes/integration-routes"
import widgetRoutes from "../api/routes/widget-routes"
import conversationRoutes from "../api/routes/conversation-routes"
import widgetLoaderRoutes from "../api/routes/widget-loader-routes"
import integrationGmailRoutes from "../api/routes/integration-gmail-routes"
import gmailWebhookRoutes from "../api/routes/gmail-webhook-routes"
import contactRoutes from "../api/routes/contact-routes"

export const routesLoader = (app: Express): void => {
  const router = Router()

  // API routes
  router.use("/integrations", integrationRoutes)
  router.use("/integrations/gmail", integrationGmailRoutes)
  router.use("/widget", widgetRoutes)
  router.use("/widget", widgetLoaderRoutes)
  router.use("/conversations", conversationRoutes)
  router.use("/contacts", contactRoutes)
  router.use("/webhook", gmailWebhookRoutes) // Public webhook endpoint

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
