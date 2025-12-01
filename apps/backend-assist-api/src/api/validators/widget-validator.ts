import { z } from 'zod';

export const verifyIntegrationSchema = z.object({
  query: z.object({
    integrationId: z.string().min(1, 'Integration ID is required'),
    orgId: z.string().min(1, 'Organization ID is required'),
  }),
});

export const getWidgetConfigSchema = z.object({
  params: z.object({
    integrationId: z.string().min(1, 'Integration ID is required'),
  }),
});

export const sendWidgetMessageSchema = z.object({
  body: z.object({
    integrationId: z.string().min(1, 'Integration ID is required'),
    orgId: z.string().min(1, 'Organization ID is required'),
    sessionId: z.string().min(1, 'Session ID is required'),
    message: z.object({
      text: z.string().min(1, 'Message text is required').max(5000, 'Message too long'),
    }),
    visitorInfo: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
    }).optional(),
  }),
});

export const getConversationHistorySchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, 'Conversation ID is required'),
  }),
  query: z.object({
    limit: z.string().optional(),
    before: z.string().optional(),
  }),
});

export type VerifyIntegrationQuery = z.infer<typeof verifyIntegrationSchema>['query'];
export type SendWidgetMessageInput = z.infer<typeof sendWidgetMessageSchema>['body'];
export type GetConversationHistoryQuery = z.infer<typeof getConversationHistorySchema>['query'];
