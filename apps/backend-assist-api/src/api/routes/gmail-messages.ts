import { Router } from "express"
import { google } from "googleapis"
import isAuth from "../../middleware/authenticate"
import { config } from "../../config/index"
import { User } from "../models/user-model"
import { parseGmailMessage } from "../../utils/gmail-parser"

const router = Router()

const createClient = async (authUserId?: string) => {
  const user = await User.findOne({ authUserId })
  if (!user) {
    throw new Error("User not found")
  }
  if (!config.google.clientId || !config.google.clientSecret) {
    throw new Error("Google OAuth not configured")
  }
  if (!user.gmailAccessToken) {
    throw new Error("Gmail not connected")
  }

  const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)
  oauth2Client.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken || undefined,
  })
  const gmail = google.gmail({ version: "v1", auth: oauth2Client })
  return { gmail, user }
}

router.get("/gmail/messages", isAuth, async (req, res) => {
  try {
    console.log("[gmail-messages] List request for user", req.user?.sub)
    const { gmail } = await createClient(req.user?.sub)
    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    })
    console.log("[gmail-messages] List response count", data.messages?.length || 0)
    return res.json(data)
  } catch (err: any) {
    console.error("Gmail read error:", err)
    res.status(500).json({ message: err?.message || "Unable to fetch Gmail messages" })
  }
})

router.get("/gmail/messages/:id", isAuth, async (req, res) => {
  try {
    console.log("[gmail-messages] Fetch request", { user: req.user?.sub, id: req.params.id })
    const { gmail } = await createClient(req.user?.sub)
    const { id } = req.params
    const { data } = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    })

    let parsed = parseGmailMessage(data)

    const bodiesToFetch: Array<{ type: string; attachmentId: string }> = []
    const collectParts = (part: any) => {
      if (!part) return
      const mime = part.mimeType || ""
      const hasData = !!part.body?.data
      const hasAttachment = !!part.body?.attachmentId
      if ((mime === "text/plain" || mime === "text/html") && !hasData && hasAttachment) {
        bodiesToFetch.push({ type: mime, attachmentId: part.body.attachmentId })
      }
      if (Array.isArray(part.parts)) part.parts.forEach(collectParts)
    }
    collectParts(data?.payload)

    if ((!parsed.text || !parsed.html) && bodiesToFetch.length) {
      for (const bodyPart of bodiesToFetch) {
        try {
          const att = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: id,
            id: bodyPart.attachmentId,
          })
          const base64Data = att.data?.data || ""
          const norm = base64Data.replace(/-/g, "+").replace(/_/g, "/")
          const padLen = (4 - (norm.length % 4)) % 4
          const padded = norm + "=".repeat(padLen)
          const decoded = Buffer.from(padded, "base64").toString("utf8")
          if (bodyPart.type === "text/html") parsed.html = (parsed.html || "") + decoded
          if (bodyPart.type === "text/plain") parsed.text = (parsed.text || "") + decoded
        } catch {
          // ignore
        }
      }
    }

    console.log("[gmail-messages] Fetch success", {
      id,
      hasHtml: Boolean(parsed.html),
      hasText: Boolean(parsed.text),
      attachments: parsed.attachments?.length || 0,
    })
    res.json(parsed)
  } catch (err: any) {
    console.error("Gmail message fetch error:", err)
    res.status(500).json({ message: err?.message || "Unable to fetch Gmail message" })
  }
})

router.get("/gmail/messages/:id/attachments/:attachmentId", isAuth, async (req, res) => {
  try {
    console.log("[gmail-messages] Attachment request", {
      user: req.user?.sub,
      id: req.params.id,
      attachmentId: req.params.attachmentId,
    })
    const { gmail } = await createClient(req.user?.sub)
    const { id, attachmentId } = req.params
    const att = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: id,
      id: attachmentId,
    })

    const base64Data = att.data?.data
    if (!base64Data) {
      return res.status(404).json({ message: "Attachment data unavailable" })
    }

    const norm = base64Data.replace(/-/g, "+").replace(/_/g, "/")
    const padLen = (4 - (norm.length % 4)) % 4
    const padded = norm + "=".repeat(padLen)
    const buffer = Buffer.from(padded, "base64")

    const filename = (req.query.filename as string) || "attachment"
    const mimeType = (req.query.mimeType as string) || att.data?.mimeType || "application/octet-stream"

    res.json({
      filename,
      mimeType,
      size: buffer.length,
      data: buffer.toString("base64"),
    })
  } catch (err: any) {
    console.error("Gmail attachment fetch error:", err)
    res.status(500).json({ message: err?.message || "Unable to fetch Gmail attachment" })
  }
})

export default router
