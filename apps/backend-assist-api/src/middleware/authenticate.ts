import { Request, Response, NextFunction } from "express"
import { Session, User } from "better-auth"
import { fromNodeHeaders } from "better-auth/node"
import { config } from "../config/index"
// import { auth } from "../auth"

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
    const { auth } = await import("../auth")
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }

    req.session = session.session
    req.user = session.user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ success: false, error: "Authentication failed" })
  }
}

export default isAuth
