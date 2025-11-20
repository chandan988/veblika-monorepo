import { Router } from "express"
import { google } from "googleapis"
import isAuth from "../../middleware/authenticate"
import { config } from "../../config/index"
import { User } from "../models/user-model"

const router = Router()

router.post("/gmail/watch", isAuth, async (req, res) => {
  try {
    console.log("[gmail-watch] Watch request for user", req.user?.sub)
    const user = await User.findOne({ authUserId: req.user?.sub })
    if (!user || !user.gmailAccessToken) {
      console.warn("[gmail-watch] User not linked to Gmail", req.user?.sub)
      return res.status(401).json({ message: "User not authorized for Gmail watch" })
    }

    if (!config.google.gmailPubsubTopic) {
      console.error("[gmail-watch] Missing Pub/Sub topic")
      return res.status(500).json({ message: "Gmail Pub/Sub topic not configured" })
    }

    const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)
    oauth2Client.setCredentials({
      access_token: user.gmailAccessToken,
      refresh_token: user.gmailRefreshToken || undefined,
    })

    const gmail = google.gmail({ version: "v1", auth: oauth2Client })

    const watchRes = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: config.google.gmailPubsubTopic,
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      },
    })

    const data = watchRes.data || {}
    console.log("[gmail-watch] Google watch response", data)
    if (data.expiration) {
      const ms = Number(data.expiration)
      if (!Number.isNaN(ms)) {
        user.gmailWatchExpiration = new Date(ms)
      }
    }
    if (data.historyId) {
      user.gmailHistoryId = String(data.historyId)
    }
    await user.save()

    res.json({ message: "Gmail watch initialized", watch: data })
  } catch (err: any) {
    console.error("Watch error:", err?.message || err)
    res.status(500).json({ message: "Gmail watch setup failed" })
  }
})

export default router
