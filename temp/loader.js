;(function () {
  "use strict"

  // ✅ Basic safety check (avoid multiple loads)
  if (window.__MYCHAT_LOADED__) return
  window.__MYCHAT_LOADED__ = true

  const INTEGRATION_ID = window.MYCHAT_INTEGRATION_ID || null
  const ORG_ID = window.MYCHAT_ORG_ID || null

  if (!INTEGRATION_ID) {
    console.warn("[MyChat] Integration ID missing!")
    return
  }
  if (!ORG_ID) {
    console.warn("[MyChat] Organization ID missing!")
    return
  }

  // ✅ Generate or retrieve sessionId from localStorage
  let sessionId = localStorage.getItem('mychat_session_id')
  let sessionCreated = parseInt(localStorage.getItem('mychat_session_created') || '0')
  
  // Check if session expired (24 hours)
  const twentyFourHours = 24 * 60 * 60 * 1000
  const now = Date.now()
  
  if (!sessionId || (now - sessionCreated > twentyFourHours)) {
    // Generate new session ID: timestamp + random string
    sessionId = `session_${now}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('mychat_session_id', sessionId)
    localStorage.setItem('mychat_session_created', now.toString())
    console.log('[MyChat] New session created:', sessionId)
  } else {
    console.log('[MyChat] Existing session loaded:', sessionId)
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
  preconnect("http://localhost:5173/")

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
    iframe.src = `http://localhost:5173?integrationId=${INTEGRATION_ID}&orgId=${ORG_ID}&sessionId=${sessionId}` // Your chat-ui URL
    iframe.style.cssText = `
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
  `

    document.body.appendChild(iframe)

    // Listen for resize messages from iframe
    window.addEventListener("message", function (event) {
      // Security: verify origin in production
      // if (event.origin !== "http://localhost:3001") return;

      if (event.data.type === "MYCHAT_RESIZE") {
        const { width, height } = event.data
        iframe.style.width = width + "px"
        iframe.style.height = height + "px"
        console.log(`📐 Iframe resized to: ${width}x${height}`)
      }
    })

    console.log("✅ MyChat Widget Loaded")
  })
})()
