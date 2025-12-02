import express, { Express, Request, Response } from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import cookieParser from "cookie-parser"
import { config } from "../config/index"
import { httpLogger } from "../config/logger"
import { toNodeHandler } from "better-auth/node"
import isAuth from "../middleware/authenticate"

export const expressLoader = async (app: Express): Promise<void> => {
  // Security middleware
  app.use(helmet())

  // CORS - MUST be before auth routes
  app.use(
    cors({
      origin: [...config.cors.origin],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )

  console.log("✅ CORS middleware initialized")

  // Handle preflight requests
  // app.options("*", cors())

  // Auth routes - MUST be after CORS
  const { auth } = await import("../auth")
  // app.all("/api/auth/*splat", toNodeHandler(auth))
  app.all('/api/auth/{*any}', toNodeHandler(auth));

  console.log("✅ Auth middleware initialized")

  app.use(cookieParser())
  // Body parser
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Compression
  app.use(compression())

  // HTTP request logging (pino)
  // app.use(httpLogger)

  console.log("✅ Express middleware initialized")

  // Health check
  app.get("/health",isAuth, (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  })
}
