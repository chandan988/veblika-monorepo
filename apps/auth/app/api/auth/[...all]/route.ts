import { auth } from "@/lib/auth"

function setCorsHeaders(res: Response, origin: string | null) {
  if (!origin) return res
  res.headers.set("Access-Control-Allow-Origin", origin)
  res.headers.set("Access-Control-Allow-Credentials", "true")
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  )
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  )
  return res
}

export const OPTIONS = async (req: Request) => {
  const origin = req.headers.get("origin")
  const headers = new Headers()
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Access-Control-Allow-Credentials", "true")
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  )
  return new Response(null, { status: 204, headers })
}

async function runHandler(req: Request) {
  const origin = req.headers.get("origin")
  const res = await auth.handler(req)
  return setCorsHeaders(res, origin)
}

export const GET = runHandler
export const POST = runHandler
export const PUT = runHandler
export const DELETE = runHandler
