import { Router } from "express"
import { google } from "googleapis"
import { config } from "../../config/index"
import { User } from "../models/previous-user-model"
import { parseGmailMessage } from "../../utils/gmail-parser"
import { createTicketFromEmail } from "../../services/email-ticket-service"
import { notifications } from "../../utils/notifications"

const router = Router()

const getSafeStartHistoryId = (userHistoryId?: string, fallbackHistoryId?: string) => {
if (userHistoryId) return userHistoryId
if (!fallbackHistoryId) return undefined
try {
  const numeric = BigInt(fallbackHistoryId)
  if (numeric > 1n) {
    return (numeric - 1n).toString()
  }
} catch {
  //
}
return fallbackHistoryId
}

router.post("/gmail/push", async (req, res) => {
  try {
    console.log("[gmail-webhook] Push received")
    const { message } = req.body || {}
    if (!message || !message.data) {
      console.warn("[gmail-webhook] Invalid message payload")
      return res.status(400).send("Invalid Pub/Sub message")
    }

    const decodedData = Buffer.from(message.data, "base64").toString("utf8")
    const parsed = JSON.parse(decodedData)

    const { emailAddress, historyId } = parsed || {}
    if (!emailAddress || !historyId) {
      console.warn("[gmail-webhook] Missing emailAddress or historyId, skipping")
      return res.status(200).send("No-op")
    }

    console.log("[gmail-webhook] Parsed message", { emailAddress, historyId })

    const user = await User.findOne({ email: emailAddress.toLowerCase() })
    if (!user || !user.gmailAccessToken) {
      console.warn("[gmail-webhook] Gmail push for unknown/unlinked user", emailAddress)
      return res.status(200).send("ACK")
    }

    if (!config.google.clientId || !config.google.clientSecret) {
      console.warn("[gmail-webhook] Missing Google config")
      return res.status(500).send("Server Misconfigured")
    }

    const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)
    oauth2Client.setCredentials({
      access_token: user.gmailAccessToken,
      refresh_token: user.gmailRefreshToken || undefined,
    })

    const gmail = google.gmail({ version: "v1", auth: oauth2Client })
    const startHistoryId = getSafeStartHistoryId(user.gmailHistoryId, historyId)
    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded", "labelAdded"],
      maxResults: 50,
    })

    const history = historyRes.data.history || []
    const messageIds: string[] = []
    const pushMessageId = (msg?: { id?: string }) => {
      if (msg?.id) {
        messageIds.push(msg.id)
      }
    }

    for (const h of history) {
      ;(h.messagesAdded || []).forEach((item) => pushMessageId(item.message))
      ;(h.labelsAdded || []).forEach((item) => pushMessageId(item.message))
    }

    console.log("[gmail-webhook] Message IDs to fetch", messageIds.length)

    for (const id of messageIds) {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "full",
        })
        const parsedMsg = parseGmailMessage(msgRes.data)

        let bodyRaw = parsedMsg.html || parsedMsg.text || ""
        if (!bodyRaw) {
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
          collectParts(msgRes.data?.payload)

          for (const b of bodiesToFetch) {
            try {
              const att = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId: id,
                id: b.attachmentId,
              })
              const base64Data = att.data?.data || ""
              const norm = base64Data.replace(/-/g, "+").replace(/_/g, "/")
              const padLen = (4 - (norm.length % 4)) % 4
              const padded = norm + "=".repeat(padLen)
              const decoded = Buffer.from(padded, "base64").toString("utf8")
              if (b.type === "text/html") bodyRaw += decoded
              if (b.type === "text/plain") bodyRaw += decoded
            } catch (attachmentErr) {
              console.error("[gmail-webhook] Attachment fetch failed", attachmentErr)
            }
          }
        }

        const MAX_LEN = 65536
        const bodyWasTruncated = bodyRaw.length > MAX_LEN
        const body = bodyWasTruncated ? bodyRaw.slice(0, MAX_LEN) : bodyRaw
        const attachmentsMeta = (parsedMsg.attachments || []).map((att: any) => ({
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          attachmentId: att.attachmentId,
        }))

        const payload = {
          type: "gmail:new_message",
          userId: user.authUserId,
          email: emailAddress,
          messageId: parsedMsg.id,
          threadId: parsedMsg.threadId,
          internetMessageId: parsedMsg.messageIdHeader || "",
          references: parsedMsg.referencesHeader || "",
          inReplyTo: parsedMsg.inReplyToHeader || "",
          subject: parsedMsg.subject || "(no subject)",
          from: parsedMsg.from || "",
          snippet: parsedMsg.snippet || "",
          body,
          bodyFormat: parsedMsg.html || /<\w+[^>]*>/.test(body) ? "html" : "text",
          receivedAt: new Date().toISOString(),
          attachments: attachmentsMeta,
          bodyTruncated: bodyWasTruncated,
        }

        await createTicketFromEmail({
          user,
          payload: {
            subject: payload.subject,
            body: payload.body,
            bodyFormat: payload.bodyFormat as "text" | "html",
            from: payload.from,
            snippet: payload.snippet,
            attachments: payload.attachments,
            messageId: payload.messageId!,
            threadId: payload.threadId,
            receivedAt: payload.receivedAt,
            internetMessageId: payload.internetMessageId,
            references: payload.references,
            inReplyTo: payload.inReplyTo,
          },
        })

        notifications.emit("notification", payload)
        console.log("[gmail-webhook] Notification emitted", {
          userId: user.authUserId,
          messageId: payload.messageId,
        })
      } catch (innerErr) {
        console.error("[gmail-webhook] Message fetch error", innerErr)
      }
    }

    const newHistoryId = historyRes.data.historyId || String(historyId)
    if (newHistoryId && newHistoryId !== user.gmailHistoryId) {
      user.gmailHistoryId = String(newHistoryId)
      await user.save()
      console.log("[gmail-webhook] Updated historyId", newHistoryId)
    }

    return res.status(200).send("ACK")
  } catch (err) {
    console.error("[gmail-webhook] Processing error", err)
    return res.status(500).send("Internal Server Error")
  }
})

export default router
