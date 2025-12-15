import { Router, Request, Response } from "express"
import path from "path"
import fs from "fs"

const router: Router = Router()

/**
 * @route   GET /api/v1/widget/loader.js
 * @desc    Serve the widget loader script
 * @access  Public
 */
router.get("/loader.js", (req: Request, res: Response) => {
  // Resolve path from monorepo root
  const loaderPath = path.resolve(process.cwd(), "src/loaders/web-chat.js")

  // Check if file exists
  if (!fs.existsSync(loaderPath)) {
    console.error("Loader not found at:", loaderPath)
    return res.status(404).json({
      success: false,
      error: "Loader script not found",
      path: loaderPath,
    })
  }

  // Read and inject environment variable
  let loaderScript = fs.readFileSync(loaderPath, "utf-8")
  const chatWidgetUrl = process.env.CHAT_WIDGET_BASE_URL!
  loaderScript = loaderScript.replace("__CHAT_WIDGET_BASE_URL__", chatWidgetUrl)

  // Set headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/javascript; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=3600")

  res.send(loaderScript)

  // Set CORS headers for public access
  // res.setHeader("Access-Control-Allow-Origin", "*")
  // res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  // res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  // res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")

  // Set content headers
  // res.setHeader("Content-Type", "application/javascript; charset=utf-8")
  // res.setHeader("Cache-Control", "public, max-age=3600")
  // res.setHeader("X-Content-Type-Options", "nosniff")

  // Send the file
  // res.sendFile(loaderPath, (err) => {
  //   if (err) {
  //     console.error("Error sending loader.js:", err)
  //     res.status(500).json({
  //       success: false,
  //       error: "Failed to send loader script",
  //     })
  //   }
  // })
})

// Handle OPTIONS preflight request
router.options("/loader.js", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.sendStatus(204)
})

export default router
