import { useEffect } from "react"
import { toast } from "sonner"
import { eventBus } from "@/utils/event-bus"

const sanitizeHtml = (html: string) =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")

const escapeHtml = (text: string) => {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

const extractEmailName = (from?: string) => {
  if (!from) return "Unknown"
  const match = from.match(/^(.*?)\s*<.*>$/)
  if (match && match[1]) {
    return match[1].replace(/["']/g, "").trim()
  }
  return from
}

const playNotificationSound = () => {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYELIHO8diJOAcZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYELIHO8diJOAcZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYELIHO8diJOAcZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYELIHO8diJOAcZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYELIHO8diJOAcZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYELIHO8diJOAcZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCN0/LBdSYE"
    )
    audio.volume = 0.3
    void audio.play()
  } catch {
    // ignore
  }
}

const showEmailToast = (payload: any) => {
  toast.custom((t) => {
    const { from, subject, body, bodyFormat } = payload
    const isHtml = bodyFormat === "html"
    return (
      <div
        className={`bg-white p-4 border rounded-lg shadow-lg max-w-md w-full transition-all ${
          t.visible ? "animate-in fade-in" : "animate-out fade-out"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            Mail
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-sm font-medium text-slate-800">
              New email from <strong>{extractEmailName(from)}</strong>
            </div>
            <div className="mb-2 truncate text-sm font-semibold text-slate-900">{subject || "(no subject)"}</div>
            {body ? (
              <div
                className="max-h-32 overflow-auto border-t pt-2 text-xs text-slate-700"
                dangerouslySetInnerHTML={{
                  __html: isHtml ? sanitizeHtml(body) : `<pre class="whitespace-pre-wrap">${escapeHtml(body)}</pre>`,
                }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 text-xs font-medium text-primary hover:text-primary/80"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    )
  })
}

export const useNotifications = () => {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1").replace(/\/$/, "")
    const url = `${base}/notifications/stream`
    const es = new EventSource(url, { withCredentials: true })

    const onMessage = (event: MessageEvent<string>) => {
      if (!event.data) return
      try {
        const payload = JSON.parse(event.data)
        if (payload?.type === "gmail:new_message") {
          showEmailToast(payload)
          playNotificationSound()
          eventBus.emit("gmail:new_message", payload)
        }
      } catch (err) {
        console.warn("[Notifications] Failed to parse SSE payload", err)
      }
    }

    es.addEventListener("message", onMessage)
    es.addEventListener("error", (err) => {
      console.error("[Notifications] Stream error", err)
    })

    return () => {
      es.removeEventListener("message", onMessage)
      es.close()
    }
  }, [])
}
