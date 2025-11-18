import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    description: z.string().min(1, 'Description is required'),
    status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional().default('open'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    category: z.string().optional(),
    assignedTo: z.string().optional(),
    customerId: z.string().optional(),
    customerEmail: z.string().email('Invalid email format').optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    category: z.string().optional(),
    assignedTo: z.string().optional(),
    customerId: z.string().optional(),
    customerEmail: z.string().email().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const ticketIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Ticket ID is required'),
  }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>['body'];
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>['body'];
