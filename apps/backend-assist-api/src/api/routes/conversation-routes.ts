import { Router } from 'express';
import { conversationController } from '../controllers/conversation-controller';
import { validate } from '../../middleware/validator';
import {
  getConversationsQuerySchema,
  conversationIdSchema,
  updateConversationSchema,
  sendMessageSchema,
  getMessagesQuerySchema,
} from '../validators/conversation-validator';
import isAuth from '../../middleware/authenticate';
import { loadMemberAbility } from '../../middleware/authorize';

const router: Router = Router({ mergeParams: true });

// All routes require authentication and organisation membership
router.use(isAuth, loadMemberAbility);

/**
 * @route   GET /api/v1/organisations/:orgId/conversations
 * @desc    Get all conversations with filters
 * @access  Private (org members)
 * @query   ?status=open&channel=webchat&page=1&limit=50
 */
router.get(
  '/',
  validate(getConversationsQuerySchema),
  conversationController.getConversations
);

/**
 * @route   GET /api/v1/organisations/:orgId/conversations/stats
 * @desc    Get conversation statistics
 * @access  Private (org members)
 */
router.get(
  '/stats',
  conversationController.getConversationStats
);

/**
 * @route   GET /api/v1/organisations/:orgId/conversations/:id
 * @desc    Get conversation by ID
 * @access  Private (org members)
 */
router.get(
  '/:id',
  validate(conversationIdSchema),
  conversationController.getConversationById
);

/**
 * @route   PUT /api/v1/organisations/:orgId/conversations/:id
 * @desc    Update conversation
 * @access  Private (org members)
 */
router.put(
  '/:id',
  validate(conversationIdSchema.merge(updateConversationSchema)),
  conversationController.updateConversation
);

/**
 * @route   GET /api/v1/organisations/:orgId/conversations/:id/messages
 * @desc    Get messages for a conversation
 * @access  Private (org members)
 * @query   ?limit=50&before=2024-01-01T00:00:00.000Z
 */
router.get(
  '/:id/messages',
  validate(conversationIdSchema.merge(getMessagesQuerySchema)),
  conversationController.getConversationMessages
);

/**
 * @route   POST /api/v1/organisations/:orgId/conversations/:id/messages
 * @desc    Send message to conversation
 * @access  Private (org members)
 */
router.post(
  '/:id/messages',
  validate(conversationIdSchema.merge(sendMessageSchema)),
  conversationController.sendMessage
);

export default router;
