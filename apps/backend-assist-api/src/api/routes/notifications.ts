import { Router } from "express"
import isAuth from "../../middleware/authenticate"
import { notifications, NotificationPayload } from "../../utils/notifications"

const router = Router()

router.get("/stream", isAuth, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")

  const userId = req.user?.id

  const onNotification = (payload: NotificationPayload) => {
    if (!payload.userId || payload.userId === userId) {
      res.write(`event: message\n`)
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }
  }

  notifications.on("notification", onNotification)
  const keepAlive = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`)
    } catch {
      //
    }
  }, 25000)

  res.write(`event: hello\n`)
  res.write(`data: {"status":"connected"}\n\n`)

  req.on("close", () => {
    clearInterval(keepAlive)
    notifications.off("notification", onNotification)
  })
})

export default router
