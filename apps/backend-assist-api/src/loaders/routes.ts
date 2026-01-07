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
import organisationRoutes from "../api/routes/organisation-routes"
import roleRoutes from "../api/routes/role-routes"
import memberRoutes from "../api/routes/member-routes"
import {
  invitationOrgRouter,
  invitationPublicRouter,
} from "../api/routes/invitation-routes"

export const routesLoader = (app: Express): void => {
  const router = Router()

  // API routes
  router.use("/organisations", organisationRoutes)
  router.use("/organisations/:orgId/roles", roleRoutes)
  router.use("/organisations/:orgId/members", memberRoutes)
  router.use("/organisations/:orgId/invitations", invitationOrgRouter)
  router.use("/organisations/:orgId/integrations", integrationRoutes)
  router.use("/organisations/:orgId/integrations/gmail", integrationGmailRoutes)
  router.use("/organisations/:orgId/conversations", conversationRoutes)
  router.use("/organisations/:orgId/contacts", contactRoutes)
  router.use("/invitations", invitationPublicRouter)
  router.use("/widget", widgetRoutes)
  router.use("/widget", widgetLoaderRoutes)
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
