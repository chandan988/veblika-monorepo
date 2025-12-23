import { Request, Response, NextFunction } from "express"
import { config } from "../config/index"

interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  resellerId: string
  role: string
}

interface Session {
  id: string
  userId: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: User
      session?: Session
    }
  }
}

const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract cookies from request headers
    const cookieHeader = req.headers.cookie || ""
    
    // Call external auth service to validate session
    const authServiceUrl = config.auth.authUrl
    const response = await fetch(`${authServiceUrl}/api/auth/get-session`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
      credentials: "include",
    })

    if (!response.ok) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }

    const data = await response.json()
    
    if (!data || !data.user || !data.session) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }

    req.session = data.session
    req.user = data.user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ success: false, error: "Authentication failed" })
  }
}

export default isAuth
