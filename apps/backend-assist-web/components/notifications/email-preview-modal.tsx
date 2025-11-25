"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Fragment, useEffect, useState } from "react"
import { api } from "@/services/api"
import { eventBus } from "@/utils/event-bus"

type AttachmentState = Record<
  string,
  { status: "idle" | "loading" | "ready" | "error"; url?: string; meta?: any }
>

export const EmailPreviewModal = () => {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<any>(null)
  const [attachmentState, setAttachmentState] = useState<AttachmentState>({})

  useEffect(() => {
    return eventBus.on("gmail:new_message", (payload) => {
      setEmail(payload)
      setAttachmentState({})
      setOpen(true)
    })
  }, [])

  const handleAttachmentAction = async (attachment: any) => {
    if (!email?.messageId || !attachment?.attachmentId) return
    const key = attachment.attachmentId
    setAttachmentState((prev) => ({
      ...prev,
      [key]: { status: "loading" },
    }))

    try {
      const { data } = await api.get(`/gmail/messages/${email.messageId}/attachments/${attachment.attachmentId}`, {
        params: {
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
        },
      })

      const dataUrl = `data:${data.mimeType};base64,${data.data}`
      setAttachmentState((prev) => ({
        ...prev,
        [key]: {
          status: "ready",
          url: dataUrl,
          meta: data,
        },
      }))

      if (!attachment.mimeType?.startsWith("image/")) {
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = data.filename || attachment.filename || "attachment"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error("Failed to fetch Gmail attachment", err)
      setAttachmentState((prev) => ({
        ...prev,
        [key]: { status: "error" },
      }))
    }
  }

  const bodyHtml = email?.bodyFormat === "html" ? email?.body : undefined
  const plain = email?.bodyFormat !== "html" ? email?.body : undefined
  const gmailLink = email?.threadId ? `https://mail.google.com/mail/u/0/#inbox/${email.threadId}` : undefined
  const hasAttachments = Array.isArray(email?.attachments) && email.attachments.length > 0

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                  <Dialog.Title className="text-base font-semibold text-slate-800">
                    {email?.subject || "(no subject)"}
                  </Dialog.Title>
                  <p className="mt-1 text-xs text-slate-500">From: {email?.from || ""}</p>
                </div>
                <div className="max-h-[60vh] overflow-auto px-4 py-4 sm:px-5 space-y-4">
                  {bodyHtml ? (
                    <iframe title="email-html" sandbox="" srcDoc={bodyHtml} className="h-[50vh] w-full rounded border border-slate-200" />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-sm text-slate-700">{plain || email?.snippet || ""}</pre>
                  )}
                  {email?.bodyTruncated ? (
                    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Message truncated to 64 KB preview. Open in Gmail to read the full content.
                    </div>
                  ) : null}
                  {hasAttachments ? (
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-xs font-semibold text-slate-600">Attachments</div>
                      <ul className="mt-2 space-y-2 text-xs text-slate-600">
                        {email.attachments.map((att: any, idx: number) => {
                          const key = att.attachmentId || `${att.filename}-${idx}`
                          const state = attachmentState[key]
                          const isImage = att.mimeType?.startsWith("image/")
                          return (
                            <li key={key} className="rounded border border-slate-200 bg-white p-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-semibold text-slate-700">{att.filename || "Attachment"}</div>
                                  <div className="text-[11px] text-slate-400">
                                    {att.mimeType || "application/octet-stream"} • {formatSize(att.size)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
                                  onClick={() => handleAttachmentAction(att)}
                                  disabled={state?.status === "loading"}
                                >
                                  {state?.status === "loading"
                                    ? "Loading..."
                                    : isImage
                                        ? state?.status === "ready"
                                          ? "Reload Preview"
                                          : "Preview"
                                        : "Download"}
                                </button>
                              </div>
                              {state?.status === "error" ? (
                                <p className="mt-2 text-[11px] text-red-500">Unable to load this attachment.</p>
                              ) : null}
                              {isImage && state?.url ? (
                                <div className="mt-2 overflow-hidden rounded border border-slate-200 bg-slate-100">
                                  <img src={state.url} alt={att.filename} className="max-h-64 w-full object-contain" />
                                </div>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
                  <div className="text-xs text-slate-500">New Gmail message</div>
                  <div className="flex gap-2">
                    {gmailLink ? (
                      <a
                        href={gmailLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                      >
                        Open in Gmail
                      </a>
                    ) : null}
                    <button
                      className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => setOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

const formatSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(Number(bytes))) return ""
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`
}
