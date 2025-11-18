import { Express, Router } from "express"
import { config } from "../config/index"
import { notFoundHandler } from "../middleware/not-found"
import { errorHandler } from "../middleware/error-handler"

// Import routes here
import ticketRoutes from "../api/routes/ticket-routes"

export const routesLoader = (app: Express): void => {
  const router = Router()

  // API routes
  router.use("/tickets", ticketRoutes)

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
