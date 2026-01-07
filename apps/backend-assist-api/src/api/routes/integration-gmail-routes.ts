import { Router, Request, Response } from "express"
import { integrationGmailService } from "../services/integration-gmail-service"
import isAuth from "../../middleware/authenticate"
import { loadMemberAbility } from "../../middleware/authorize"
import { logger } from "../../config/logger"

const router: Router = Router({ mergeParams: true })

// All routes require authentication and organisation membership
router.use(isAuth, loadMemberAbility)

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/gmail/auth-url
 * @desc    Generate Gmail OAuth authorization URL
 * @access  Private (org members)
 */
router.post("/auth-url", async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId
    const userId = req.user?.id

    if (!orgId || !userId) {
      res.status(400).json({
        success: false,
        error: "Missing orgId or userId",
      })
      return
    }

    const result = integrationGmailService.generateAuthUrl(orgId, userId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    logger.error({ error }, "Error generating Gmail auth URL")
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate authorization URL",
    })
  }
})

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/gmail/callback
 * @desc    Handle Gmail OAuth callback and create integration
 * @access  Private (org members)
 */
router.post("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body
    const orgId = req.params.orgId
    const userId = req.user?.id

    if (!code || !state || !orgId || !userId) {
      res.status(400).json({
        success: false,
        error: "Missing required parameters",
      })
      return
    }

    const integration = await integrationGmailService.handleOAuthCallback(
      code,
      state,
      orgId,
      userId
    )

    res.json({
      success: true,
      data: integration,
    })
  } catch (error: any) {
    logger.error({ error }, "Error handling Gmail OAuth callback")
    res.status(500).json({
      success: false,
      error: error.message || "Failed to connect Gmail account",
    })
  }
})

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/gmail/:integrationId/verify
 * @desc    Verify Gmail integration connection
 * @access  Private (org members)
 */
router.post(
  "/:integrationId/verify",
  async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params

      if (!integrationId) {
        res.status(400).json({
          success: false,
          error: "Missing integrationId",
        })
        return
      }

      const result =
        await integrationGmailService.verifyIntegration(integrationId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error({ error }, "Error verifying Gmail integration")
      res.status(500).json({
        success: false,
        error: error.message || "Failed to verify Gmail integration",
      })
    }
  }
)

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/gmail/:integrationId/watch
 * @desc    Start Gmail Push Notifications (Pub/Sub)
 * @access  Private (org members)
 */
router.post(
  "/:integrationId/watch",
  async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params

      if (!integrationId) {
        res.status(400).json({
          success: false,
          error: "Missing integrationId",
        })
        return
      }

      const result = await integrationGmailService.startWatch(integrationId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error({ error }, "Error starting Gmail watch")
      res.status(500).json({
        success: false,
        error: error.message || "Failed to start Gmail watch",
      })
    }
  }
)

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/gmail/:integrationId/stop-watch
 * @desc    Stop Gmail Push Notifications
 * @access  Private (org members)
 */
router.post(
  "/:integrationId/stop-watch",
  async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params

      if (!integrationId) {
        res.status(400).json({
          success: false,
          error: "Missing integrationId",
        })
        return
      }

      const result = await integrationGmailService.stopWatch(integrationId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error({ error }, "Error stopping Gmail watch")
      res.status(500).json({
        success: false,
        error: error.message || "Failed to stop Gmail watch",
      })
    }
  }
)

/**
 * @route   POST /api/v1/organisations/:orgId/integrations/gmail/:integrationId/send
 * @desc    Send an email via Gmail API
 * @access  Private (org members)
 */
router.post(
  "/:integrationId/send",
  async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params
      const {
        to,
        subject,
        body,
        htmlBody,
        threadId,
        inReplyTo,
        references,
        cc,
        bcc,
      } = req.body

      if (!integrationId) {
        res.status(400).json({
          success: false,
          error: "Missing integrationId",
        })
        return
      }

      if (!to || !subject || !body) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: to, subject, body",
        })
        return
      }

      const result = await integrationGmailService.sendGmailMessage({
        integrationId,
        to,
        subject,
        body,
        htmlBody,
        threadId,
        inReplyTo,
        references,
        cc,
        bcc,
      })

      res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error({ error }, "Error sending Gmail message")
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send Gmail message",
      })
    }
  }
)

/**
 * @route   DELETE /api/v1/organisations/:orgId/integrations/gmail/:integrationId
 * @desc    Disconnect Gmail integration
 * @access  Private (org members)
 */
router.delete(
  "/:integrationId",
  async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params

      if (!integrationId) {
        res.status(400).json({
          success: false,
          error: "Missing integrationId",
        })
        return
      }

      const integration =
        await integrationGmailService.deleteIntegration(integrationId)

      res.json({
        success: true,
        data: integration,
      })
    } catch (error: any) {
      logger.error({ error }, "Error disconnecting Gmail integration")
      res.status(500).json({
        success: false,
        error: error.message || "Failed to disconnect Gmail integration",
      })
    }
  }
)

export default router
