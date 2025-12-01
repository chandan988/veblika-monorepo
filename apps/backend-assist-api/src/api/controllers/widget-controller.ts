import { Request, Response } from 'express';
import { widgetService } from '../services/widget-service';
import { asyncHandler } from '../../utils/async-handler';
import { VerifyIntegrationQuery, SendWidgetMessageInput } from '../validators/widget-validator';

export class WidgetController {
  /**
   * Verify integration exists (public endpoint)
   */
  verifyIntegration = asyncHandler(async (req: Request, res: Response) => {
    const { integrationId, orgId } = req.query as VerifyIntegrationQuery;
    const isValid = await widgetService.verifyIntegration(integrationId, orgId);

    return res.status(200).json({
      success: true,
      data: {
        valid: isValid,
      },
    });
  });

  /**
   * Get widget configuration (public endpoint)
   */
  getWidgetConfig = asyncHandler(async (req: Request, res: Response) => {
    const { integrationId } = req.params;
    const config = await widgetService.getWidgetConfig(integrationId);

    return res.status(200).json({
      success: true,
      data: config,
    });
  });

  /**
   * Send message from widget (public endpoint)
   */
  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const data: SendWidgetMessageInput = req.body;
    const result = await widgetService.saveVisitorMessage(data);

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: result.message._id,
        conversationId: result.conversation._id,
        isNewConversation: result.isNewConversation,
      },
    });
  });

  /**
   * Get conversation history (public endpoint)
   */
  getConversationHistory = asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { limit, before } = req.query;

    const messages = await widgetService.getConversationHistory(
      conversationId,
      limit ? parseInt(limit as string) : 50,
      before as string
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  });
}

export const widgetController = new WidgetController();
