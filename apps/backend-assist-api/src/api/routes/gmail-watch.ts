import { Router } from "express"
import { google } from "googleapis"
import isAuth from "../../middleware/authenticate"
import { config } from "../../config/index"
import { User } from "../models/previous-user-model"

const router = Router()

router.post("/gmail/watch", isAuth, async (req, res) => {
  try {
    console.log("[gmail-watch] Watch request", {
      authUserId: req.user?.id,
      topicConfigured: Boolean(config.google.gmailPubsubTopic),
      googleClientConfigured: Boolean(config.google.clientId && config.google.clientSecret),
    })
    const authUserId = req.user?.id
    const sessionEmail = req.user?.email?.toLowerCase()
    let user = authUserId
      ? await User.findOne({ authUserId })
      : undefined
    if (!user && sessionEmail) {
      console.log("[gmail-watch] No user found by authUserId, trying email match")
      user = await User.findOne({ email: sessionEmail })
    }
    if (!user || !user.gmailAccessToken) {
      console.warn("[gmail-watch] User not linked to Gmail", {
        authUserId,
        hasAccessToken: Boolean(user?.gmailAccessToken),
        hasRefreshToken: Boolean(user?.gmailRefreshToken),
      })
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

    console.log("[gmail-watch] Calling gmail.users.watch", {
      topic: config.google.gmailPubsubTopic,
      labelIds: ["INBOX"],
    })
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
    if (!user.authUserId && authUserId) {
      console.warn("[gmail-watch] User missing authUserId, setting from session", {
        userId: user._id?.toString(),
        sessionSub: authUserId,
      })
      user.authUserId = authUserId
    }

    console.log("[gmail-watch] Updating user record with watch metadata", {
      userId: user._id?.toString(),
      authUserId: user.authUserId,
      historyId: user.gmailHistoryId,
      watchExpiration: user.gmailWatchExpiration,
    })
    await user.save()

    res.json({ message: "Gmail watch initialized", watch: data })
  } catch (err: any) {
    console.error("[gmail-watch] Watch error", {
      message: err?.message,
      responseStatus: err?.code || err?.response?.status,
      responseData: err?.response?.data,
      stack: err?.stack,
    })
    res.status(500).json({
      message: "Gmail watch setup failed",
      error: err?.message,
    })
  }
})

export default router
