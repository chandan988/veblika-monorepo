import { z } from 'zod';

export const getConversationsQuerySchema = z.object({
  query: z.object({
    orgId: z.string().optional(),
    status: z.enum(['open', 'pending', 'closed']).optional(),
    channel: z.enum(['gmail', 'imap', 'smtp', 'slack', 'whatsapp', 'webchat']).optional(),
    assignedMemberId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const conversationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Conversation ID is required'),
  }),
});

export const updateConversationSchema = z.object({
  body: z.object({
    status: z.enum(['open', 'pending', 'closed']).optional(),
    assignedMemberId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Message text is required').max(5000, 'Message too long'),
  }),
});

export const getMessagesQuerySchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    before: z.string().optional(),
  }),
});

export type GetConversationsQuery = z.infer<typeof getConversationsQuerySchema>['query'];
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>['body'];
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>['query'];
