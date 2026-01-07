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

const router: Router = Router();

/**
 * @route   GET /api/v1/conversations
 * @desc    Get all conversations with filters
 * @access  Private
 * @query   ?orgId=xxx&status=open&channel=webchat&page=1&limit=50
 */
router.get(
  '/',
  isAuth,
  validate(getConversationsQuerySchema),
  conversationController.getConversations
);

/**
 * @route   GET /api/v1/conversations/stats
 * @desc    Get conversation statistics
 * @access  Private
 * @query   ?orgId=xxx
 */
router.get(
  '/stats',
  isAuth,
  conversationController.getConversationStats
);

/**
 * @route   GET /api/v1/conversations/:id
 * @desc    Get conversation by ID
 * @access  Private
 */
router.get(
  '/:id',
  isAuth,
  validate(conversationIdSchema),
  conversationController.getConversationById
);

/**
 * @route   PUT /api/v1/conversations/:id
 * @desc    Update conversation
 * @access  Private
 * @note    Requires orgId in query/body for member context
 */
router.put(
  '/:id',
  isAuth,
  loadMemberAbility,
  validate(conversationIdSchema.merge(updateConversationSchema)),
  conversationController.updateConversation
);

/**
 * @route   GET /api/v1/conversations/:id/messages
 * @desc    Get messages for a conversation
 * @access  Private
 * @query   ?limit=50&before=2024-01-01T00:00:00.000Z
 */
router.get(
  '/:id/messages',
  isAuth,
  validate(conversationIdSchema.merge(getMessagesQuerySchema)),
  conversationController.getConversationMessages
);

/**
 * @route   POST /api/v1/conversations/:id/messages
 * @desc    Send message to conversation
 * @access  Private
 */
router.post(
  '/:id/messages',
  isAuth,
  validate(conversationIdSchema.merge(sendMessageSchema)),
  conversationController.sendMessage
);

export default router;
