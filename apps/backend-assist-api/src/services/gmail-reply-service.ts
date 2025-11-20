import { google } from "googleapis"
import { config } from "../config/index"
import { User } from "../api/models/user-model"

const encodeMessage = (lines: string[]) =>
  Buffer.from(lines.join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

const getOAuthClient = () => {
  if (!config.google.clientId || !config.google.clientSecret) {
    throw new Error("Google OAuth is not configured.")
  }
  return new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)
}

const getHeader = (headers: Array<{ name?: string; value?: string }> = [], name: string) =>
  headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value

const looksLikeInternetMessageId = (value = "") => /@/.test(value)

const resolveInternetMessageHeaders = async (gmail: any, messageIdCandidate?: string) => {
  if (!messageIdCandidate) {
    return { messageId: undefined, references: undefined }
  }

  if (looksLikeInternetMessageId(messageIdCandidate)) {
    return { messageId: messageIdCandidate, references: undefined }
  }

  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageIdCandidate,
      format: "metadata",
      metadataHeaders: ["Message-ID", "References"],
    })
    const headers = response.data?.payload?.headers || []
    return {
      messageId: getHeader(headers, "Message-ID"),
      references: getHeader(headers, "References"),
    }
  } catch {
    return { messageId: undefined, references: undefined }
  }
}

interface GmailReplyInput {
  userId: string
  to: string
  subject?: string
  body: string
  threadId?: string
  inReplyTo?: string
  references?: string
}

export const sendGmailReply = async ({ userId, to, subject, body, threadId, inReplyTo, references }: GmailReplyInput) => {
  if (!userId) throw new Error("User context required to send Gmail reply.")
  if (!to) throw new Error("Recipient email is required.")

  const user = await User.findOne({ authUserId: userId })
  if (!user) {
    throw new Error("User not found for Gmail reply.")
  }

  if (!user.gmailAccessToken || !user.gmailRefreshToken) {
    const err = new Error("Gmail account not connected.")
    ;(err as any).code = "GMAIL_NOT_CONNECTED"
    throw err
  }

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken,
  })

  const gmail = google.gmail({ version: "v1", auth: oauth2Client })
  const normalizedSubject = subject?.startsWith("Re:") ? subject : `Re: ${subject ?? ""}`.trim()

  const referenceHeaders = looksLikeInternetMessageId(inReplyTo)
    ? { messageId: inReplyTo, references }
    : await resolveInternetMessageHeaders(gmail, inReplyTo)

  const headers = [`To: ${to}`, `Subject: ${normalizedSubject}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"']

  if (referenceHeaders.messageId) {
    headers.push(`In-Reply-To: ${referenceHeaders.messageId}`)
  }

  const referencesHeader = referenceHeaders.references || referenceHeaders.messageId || references
  if (referencesHeader) {
    headers.push(`References: ${referencesHeader}`)
  }

  const raw = encodeMessage([...headers, "", body || ""])

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId,
    },
  })
}
