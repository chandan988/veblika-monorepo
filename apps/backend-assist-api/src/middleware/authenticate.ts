import { Request, Response, NextFunction } from "express"
import { config } from "../config/index"

// Example session response:
// {
//     "session": {
//         "expiresAt": "2025-11-25T06:26:25.510Z",
//         "token": "pXWdhOVLvDfx8Vyz4xlBMrjIjYbFiwZT",
//         "createdAt": "2025-11-18T06:26:25.511Z",
//         "updatedAt": "2025-11-18T06:26:25.511Z",
//         "ipAddress": "127.0.0.1",
//         "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
//         "userId": "6914a6e4a16c4359e60108bd",
//         "id": "691c11911930d07608350b77"
//     },
//     "user": {
//         "name": "Rahul",
//         "email": "rkrahul8181@gmail.com",
//         "emailVerified": true,
//         "image": "https://lh3.googleusercontent.com/a/ACg8ocI3zc0Tpt9PksSn3pJbZFf69wZ7216GnJEUZLTSF3C95wWTXlA=s96-c",
//         "createdAt": "2025-11-12T15:25:24.890Z",
//         "updatedAt": "2025-11-14T09:52:25.025Z",
//         "id": "6914a6e4a16c4359e60108bd"
//     }
// }

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        sub?: string
        name: string
        email: string
        emailVerified: boolean
        image: string
        createdAt: string
        updatedAt: string
      }
      session?: {
        id: string
        token: string
        expiresAt: string
        createdAt: string
        updatedAt: string
        ipAddress: string
        userAgent: string
        userId: string
      }
    }
  }
}

interface SessionResponse {
  session: {
    id: string
    token: string
    expiresAt: string
    createdAt: string
    updatedAt: string
    ipAddress: string
    userAgent: string
    userId: string
  }
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string
    createdAt: string
    updatedAt: string
  }
}

const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies["better-auth.session_token"]
    console.log("Authenticating request, token:", token)

    if (!token) {
      res
        .status(401)
        .json({ success: false, error: "Authentication token not found" })
      return
    }

    const sessionResponse = await fetch(`${config.auth.serviceUrl}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!sessionResponse.ok) {
      res
        .status(401)
        .json({ success: false, error: "Invalid or expired session" })
      return
    }

    const sessionData: SessionResponse = await sessionResponse.json()

    req.user = {
      ...sessionData.user,
      sub: sessionData.user.id,
    }
    req.session = sessionData.session

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ success: false, error: "Authentication failed" })
  }
}

export default isAuth
