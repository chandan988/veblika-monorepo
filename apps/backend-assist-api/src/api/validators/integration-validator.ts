import { z } from 'zod';

export const createWebchatIntegrationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Integration name is required').max(200, 'Name cannot exceed 200 characters'),
    orgId: z.string().min(1, 'Organization ID is required'),
  }),
});

export const updateIntegrationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    status: z.enum(['connected', 'disconnected', 'error', 'expired', 'active']).optional(),
    credentials: z.record(z.any()).optional(),
  }),
});

export const integrationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Integration ID is required'),
  }),
});

export const getIntegrationsQuerySchema = z.object({
  query: z.object({
    orgId: z.string().optional(),
    channel: z.enum(['gmail', 'imap', 'smtp', 'slack', 'whatsapp', 'webchat']).optional(),
    status: z.enum(['connected', 'disconnected', 'error', 'expired', 'active']).optional(),
  }),
});

export type CreateWebchatIntegrationInput = z.infer<typeof createWebchatIntegrationSchema>['body'];
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>['body'];
export type GetIntegrationsQuery = z.infer<typeof getIntegrationsQuerySchema>['query'];
