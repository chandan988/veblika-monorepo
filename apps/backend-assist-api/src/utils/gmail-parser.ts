const b64urlDecode = (str = "") => {
  try {
    const norm = str.replace(/-/g, "+").replace(/_/g, "/")
    const padLen = (4 - (norm.length % 4)) % 4
    const padded = norm + "=".repeat(padLen)
    return Buffer.from(padded, "base64").toString("utf8")
  } catch {
    return ""
  }
}

const getHeader = (headers: Array<{ name?: string; value?: string }> = [], name: string) => {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ""
}

const walkParts = (part: any, acc: { text: string; html: string; attachments: any[] }) => {
  if (!part) return
  const mime = part.mimeType || ""
  if (part.body?.data && mime === "text/plain") {
    acc.text += b64urlDecode(part.body.data) || ""
  }
  if (part.body?.data && mime === "text/html") {
    acc.html += b64urlDecode(part.body.data) || ""
  }
  if (part.filename) {
    acc.attachments.push({
      filename: part.filename,
      mimeType: mime,
      size: part.body?.size || 0,
      attachmentId: part.body?.attachmentId,
    })
  }
  if (Array.isArray(part.parts)) {
    part.parts.forEach((p: any) => walkParts(p, acc))
  }
}

export const parseGmailMessage = (msg: any) => {
  const headers = msg?.payload?.headers || []
  const acc = { text: "", html: "", attachments: [] as any[] }
  walkParts(msg?.payload, acc)

  if (!acc.text && !acc.html && msg?.snippet) {
    acc.text = msg.snippet
  }

  return {
    id: msg?.id,
    threadId: msg?.threadId,
    subject: getHeader(headers, "Subject") || msg?.snippet || "(no subject)",
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    date: getHeader(headers, "Date"),
    snippet: msg?.snippet || "",
    text: acc.text,
    html: acc.html,
    attachments: acc.attachments,
    labelIds: msg?.labelIds || [],
    internalDate: msg?.internalDate,
    messageIdHeader: getHeader(headers, "Message-ID"),
    referencesHeader: getHeader(headers, "References"),
    inReplyToHeader: getHeader(headers, "In-Reply-To"),
  }
}
