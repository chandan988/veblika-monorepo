import { Router, Request, Response } from "express";
import { integrationGmailService } from "../services/integration-gmail-service";
import isAuth from "../../middleware/authenticate";
import { logger } from "../../config/logger";

const router: Router = Router();

/**
 * @route   POST /api/v1/integrations/gmail/auth-url
 * @desc    Generate Gmail OAuth authorization URL
 * @access  Private
 */
router.post("/auth-url", isAuth, async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body;
    const userId = req.user?.id;

    if (!orgId || !userId) {
      res.status(400).json({
        success: false,
        error: "Missing orgId or userId",
      });
      return;
    }

    const result = integrationGmailService.generateAuthUrl(orgId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating Gmail auth URL");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate authorization URL",
    });
  }
});

/**
 * @route   POST /api/v1/integrations/gmail/callback
 * @desc    Handle Gmail OAuth callback and create integration
 * @access  Private
 */
router.post("/callback", isAuth, async (req: Request, res: Response) => {
  try {
    const { code, state, orgId } = req.body;
    const userId = req.user?.id;

    if (!code || !state || !orgId || !userId) {
      res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
      return;
    }

    const integration = await integrationGmailService.handleOAuthCallback(
      code,
      state,
      orgId,
      userId
    );

    res.json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    logger.error({ error }, "Error handling Gmail OAuth callback");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to connect Gmail account",
    });
  }
});

/**
 * @route   POST /api/v1/integrations/gmail/:integrationId/verify
 * @desc    Verify Gmail integration connection
 * @access  Private
 */
router.post("/:integrationId/verify", isAuth, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    if (!integrationId) {
      res.status(400).json({
        success: false,
        error: "Missing integrationId",
      });
      return;
    }

    const result = await integrationGmailService.verifyIntegration(integrationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, "Error verifying Gmail integration");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify Gmail integration",
    });
  }
});

/**
 * @route   POST /api/v1/integrations/gmail/:integrationId/watch
 * @desc    Start Gmail Push Notifications (Pub/Sub)
 * @access  Private
 */
router.post("/:integrationId/watch", isAuth, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    if (!integrationId) {
      res.status(400).json({
        success: false,
        error: "Missing integrationId",
      });
      return;
    }

    const result = await integrationGmailService.startWatch(integrationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, "Error starting Gmail watch");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to start Gmail watch",
    });
  }
});

/**
 * @route   POST /api/v1/integrations/gmail/:integrationId/stop-watch
 * @desc    Stop Gmail Push Notifications
 * @access  Private
 */
router.post("/:integrationId/stop-watch", isAuth, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    if (!integrationId) {
      res.status(400).json({
        success: false,
        error: "Missing integrationId",
      });
      return;
    }

    const result = await integrationGmailService.stopWatch(integrationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error }, "Error stopping Gmail watch");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to stop Gmail watch",
    });
  }
});

/**
 * @route   DELETE /api/v1/integrations/gmail/:integrationId
 * @desc    Disconnect Gmail integration
 * @access  Private
 */
router.delete("/:integrationId", isAuth, async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;

    if (!integrationId) {
      res.status(400).json({
        success: false,
        error: "Missing integrationId",
      });
      return;
    }

    const integration = await integrationGmailService.deleteIntegration(integrationId);

    res.json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    logger.error({ error }, "Error disconnecting Gmail integration");
    res.status(500).json({
      success: false,
      error: error.message || "Failed to disconnect Gmail integration",
    });
  }
});

export default router;
