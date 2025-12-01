import { Router } from 'express';
import { widgetController } from '../controllers/widget-controller';
import { validate } from '../../middleware/validator';
import {
  verifyIntegrationSchema,
  getWidgetConfigSchema,
  sendWidgetMessageSchema,
  getConversationHistorySchema,
} from '../validators/widget-validator';

const router: Router = Router();

/**
 * @route   GET /api/v1/widget/verify
 * @desc    Verify integration exists and is active
 * @access  Public
 * @query   ?integrationId=xxx&orgId=yyy
 */
router.get(
  '/verify',
  validate(verifyIntegrationSchema),
  widgetController.verifyIntegration
);

/**
 * @route   GET /api/v1/widget/config/:integrationId
 * @desc    Get widget configuration
 * @access  Public
 */
router.get(
  '/config/:integrationId',
  validate(getWidgetConfigSchema),
  widgetController.getWidgetConfig
);

/**
 * @route   POST /api/v1/widget/messages
 * @desc    Send message from widget
 * @access  Public
 */
router.post(
  '/messages',
  validate(sendWidgetMessageSchema),
  widgetController.sendMessage
);

/**
 * @route   GET /api/v1/widget/conversations/:conversationId/messages
 * @desc    Get conversation message history
 * @access  Public
 */
router.get(
  '/conversations/:conversationId/messages',
  validate(getConversationHistorySchema),
  widgetController.getConversationHistory
);

export default router;
