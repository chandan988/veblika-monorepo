import express, { Express, Request, Response } from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import cookieParser from "cookie-parser"
import isAuth from "../middleware/authenticate"

export const expressLoader = async (app: Express): Promise<void> => {
  // Security middleware with relaxed settings for Better Auth
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
  )

  // CORS - MUST be before auth routes
  // Allow all origins for all environments
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
      exposedHeaders: ["Set-Cookie"],
    })
  )

  console.log("✅ CORS middleware initialized (allow all origins)")

  // Handle preflight requests
  // app.options("*", cors())

  app.use(cookieParser())
  // Body parser
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Compression
  app.use(compression())

  // HTTP request logging (pino)
  // app.use(httpLogger)

  console.log("✅ Express middleware initialized")

  // Health check (no auth required for health checks)
  app.get("/health",isAuth, (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  })

  // Admin diagnostics - SMTP verify
  app.get('/admin/diagnostics/smtp', isAuth, async (req: Request, res: Response) => {
    try {
      const { emailService } = await import('../services/email')
      if (!emailService || typeof emailService.verify !== 'function') {
        return res.status(501).json({ success: false, message: 'SMTP verify not available' })
      }

      const result = await emailService.verify()

      if (result.ok) {
        return res.status(200).json({ success: true, message: 'SMTP verified', data: { ok: true } })
      }

      return res.status(200).json({ success: false, message: 'SMTP verify failed', data: result })
    } catch (err) {
      console.error('SMTP diagnostics error', err)
      return res.status(500).json({ success: false, message: 'SMTP diagnostics error' })
    }
  })
}
