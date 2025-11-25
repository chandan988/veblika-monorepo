import { Ticket } from "../api/models/previous-ticket-model"
import { IUser } from "../api/models/previous-user-model"

const MAX_DESCRIPTION_LENGTH = 2000

const stripHtml = (html = "") => {
  const normalized = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n")
  return normalized.replace(/<\/?[^>]+(>|$)/g, "").replace(/\u00a0/g, " ").replace(/\r?\n\s*\r?\n/g, "\n\n").trim()
}

const truncate = (value: string, limit: number) => {
  if (!value) return value
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value
}

const parseAddress = (input = "") => {
  const match = input.match(/^(.*)<(.+@.+)>$/)
  if (match) {
    return {
      name: match[1].replace(/(^"|"$)/g, "").trim() || match[2],
      email: match[2].trim().toLowerCase(),
    }
  }
  const trimmed = input.trim()
  return {
    name: trimmed,
    email: trimmed.includes("@") ? trimmed.toLowerCase() : undefined,
  }
}

export interface GmailTicketPayload {
  subject: string
  body: string
  bodyFormat: "text" | "html"
  from: string
  snippet: string
  attachments: Array<{
    filename?: string
    mimeType?: string
    size?: number
    attachmentId?: string
  }>
  messageId: string
  threadId?: string
  receivedAt?: string
  internetMessageId?: string
  references?: string
  inReplyTo?: string
}

export const createTicketFromEmail = async ({ user, payload }: { user: IUser; payload: GmailTicketPayload }) => {
  const {
    subject,
    body,
    bodyFormat,
    from,
    snippet,
    attachments,
    messageId,
    threadId,
    receivedAt,
    internetMessageId,
    references,
    inReplyTo,
  } = payload

  const parsedAddress = parseAddress(from)
  const printableSubject = subject || `Email from ${parsedAddress.name || parsedAddress.email || "unknown contact"}`
  const plainBody = bodyFormat === "html" ? stripHtml(body) : body
  const description = truncate(plainBody || snippet || "No body provided", MAX_DESCRIPTION_LENGTH)

  const existing = await Ticket.findOne({
    "sourceMetadata.gmail.messageId": messageId,
    createdBy: user.authUserId,
  })

  if (existing) {
    return existing
  }

  const ticket = await Ticket.create({
    title: truncate(printableSubject, 200),
    description,
    priority: "medium",
    category: "general",
    createdBy: user.authUserId,
    requesterName: parsedAddress.name,
    requesterEmail: parsedAddress.email,
    tags: ["gmail", "email-ingest"],
    source: "gmail",
    sourceMetadata: {
      gmail: {
        messageId,
        internetMessageId,
        threadId,
        receivedAt,
        snippet,
        attachments,
        references,
        inReplyTo,
      },
    },
    externalBody: body,
    externalBodyFormat: bodyFormat,
    attachments,
  })

  return ticket
}
