import { Router, type Router as RouterType } from "express"
import { logger } from "../../config/logger"
import { integrationGmailService } from "../services/integration-gmail-service"

const router: RouterType = Router()

/**
 * @route   POST /api/v1/webhook/gmail
 * @desc    Webhook endpoint for Google Pub/Sub Gmail notifications
 * @access  Public (no auth required - called by Google)
 * @note    Must respond within 10 seconds or Google will retry
 */
router.post("/gmail", async (req, res) => {
  try {
    logger.info({ body: req.body }, "Received Gmail Pub/Sub notification")

    // Validate Pub/Sub message format
    const message = req.body?.message
    if (!message) {
      logger.warn("Invalid Pub/Sub message format: missing message field")
      return res.status(400).json({ error: "Invalid message format" })
    }

    // Decode base64 data
    let data
    try {
      const decoded = Buffer.from(message.data, "base64").toString("utf-8")
      data = JSON.parse(decoded)
    } catch (error) {
      logger.error({ error }, "Failed to decode Pub/Sub message data")
      return res.status(400).json({ error: "Invalid message data" })
    }

    const { emailAddress, historyId } = data
    if (!emailAddress || !historyId) {
      logger.warn(
        { data },
        "Missing emailAddress or historyId in Pub/Sub message"
      )
      return res.status(400).json({ error: "Missing required fields" })
    }

    logger.info(
      { emailAddress, historyId },
      "Processing Gmail notification for email"
    )

    // Acknowledge receipt immediately (respond < 10s)
    res.status(200).json({ success: true })

    // Process notification asynchronously (don't block response)
    // This allows Google to move on while we handle the actual processing
    integrationGmailService
      .processGmailPushNotification(emailAddress, historyId)
      .catch((error) => {
        logger.error(
          { error, emailAddress, historyId },
          "Error processing Gmail push notification asynchronously"
        )
      })
  } catch (error) {
    logger.error({ error }, "Error in Gmail webhook handler")
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router

