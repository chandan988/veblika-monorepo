import express, { Express, Request, Response } from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import cookieParser from "cookie-parser"
import { config } from "../config/index"
import { httpLogger } from "../config/logger"

export const expressLoader = (app: Express): void => {
  // Security middleware
  app.use(helmet())

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  )

  app.use(cookieParser())
  // Body parser
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Compression
  app.use(compression())

  // HTTP request logging (pino)
  app.use(httpLogger)

  // Health check
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  })
}
