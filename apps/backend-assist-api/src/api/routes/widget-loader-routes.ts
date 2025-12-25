import { Router, Request, Response } from "express"

const router: Router = Router()

const chatWidgetScript = `(function () {
  "use strict"

  // ✅ Basic safety check (avoid multiple loads)
  if (window.__MYCHAT_LOADED__) return
  window.__MYCHAT_LOADED__ = true

  const INTEGRATION_ID = window.MYCHAT_INTEGRATION_ID || null
  const ORG_ID = window.MYCHAT_ORG_ID || null
  const chatWidgetUrl = "__CHAT_WIDGET_BASE_URL__" // Will be replaced at runtime

  if (!INTEGRATION_ID) {
    console.warn("[MyChat] Integration ID missing!")
    return
  }
  if (!ORG_ID) {
    console.warn("[MyChat] Organization ID missing!")
    return
  }
  if (!chatWidgetUrl) {
    console.warn("[MyChat] Chat Widget Base URL missing!")
    return
  }

  // ✅ Generate or retrieve sessionId from sessionStorage
  let sessionId = sessionStorage.getItem("mychat_session_id")
  let sessionCreated = parseInt(
    sessionStorage.getItem("mychat_session_created") || "0"
  )

  // Check if session expired (2 hours)
  const twoHours = 2 * 60 * 60 * 1000
  const now = Date.now()

  if (!sessionId || now - sessionCreated > twoHours) {
    // Generate new session ID: timestamp + random string
    sessionId = \`session_\${now}_\${Math.random().toString(36).substr(2, 9)}\`
    sessionStorage.setItem("mychat_session_id", sessionId)
    sessionStorage.setItem("mychat_session_created", now.toString())
    console.log("[MyChat] New session created:", sessionId)
  } else {
    console.log("[MyChat] Existing session loaded:", sessionId)
  }

  // ✅ Optional: basic bot / crawler detection
  const userAgent = navigator.userAgent
  const bots = [
    "Googlebot",
    "Bingbot",
    "Slurp",
    "DuckDuckBot",
    "HeadlessChrome",
  ]
  if (bots.some((bot) => userAgent.includes(bot))) {
    console.log("[MyChat] Bot detected, not loading widget.")
    return
  }

  // ✅ Preconnect for performance (optional)
  const preconnect = (url) => {
    const link = document.createElement("link")
    link.rel = "preconnect"
    link.href = url
    link.crossOrigin = ""
    document.head.appendChild(link)
  }
  preconnect(chatWidgetUrl)

  // ✅ Wait for DOM Ready
  const ready = (fn) => {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      fn()
    } else {
      document.addEventListener("DOMContentLoaded", fn)
    }
  }

  ready(() => {
    console.log("🚀 MyChat Widget Loader Started")

    // Create iframe
    const iframe = document.createElement("iframe")
    iframe.id = "mychat-widget-iframe"
    iframe.src = \`\${chatWidgetUrl}?integrationId=\${INTEGRATION_ID}&orgId=\${ORG_ID}&sessionId=\${sessionId}\` // Your chat-ui URL
    iframe.style.cssText = \`
    position: fixed;
    bottom: 20px;
    right: 20px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    width: 80px;
    height: 80px;
    transition: width 0.3s ease, height 0.3s ease;
  \`

    document.body.appendChild(iframe)

    // Listen for resize messages from iframe
    window.addEventListener("message", function (event) {
      // Security: verify origin in production
      // if (event.origin !== "http://localhost:3001") return;

      if (event.data.type === "MYCHAT_RESIZE") {
        const { width, height } = event.data
        iframe.style.width = width + "px"
        iframe.style.height = height + "px"
        console.log(\`📐 Iframe resized to: \${width}x\${height}\`)
      }
    })

    console.log("✅ MyChat Widget Loaded")
  })
})()`

/**
 * @route   GET /api/v1/widget/loader.js
 * @desc    Serve the widget loader script
 * @access  Public
 */
router.get("/loader.js", (req: Request, res: Response) => {
  // Replace placeholder with actual base URL from env varsss
  // const chatWidgetUrl = process.env.CHAT_WIDGET_BASE_URL!
  const chatWidgetUrl = "https://p2.veblika.com/"
  const loaderScript = chatWidgetScript.replace("__CHAT_WIDGET_BASE_URL__", chatWidgetUrl)

  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/javascript; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=3600")

  res.send(loaderScript)
})

// Handle OPTIONS preflight request
router.options("/loader.js", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.sendStatus(204)
})

export default router
