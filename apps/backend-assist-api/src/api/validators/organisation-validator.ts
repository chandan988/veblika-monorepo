import { z } from 'zod';

// ========================================
// Organisation Validators
// ========================================

export const createOrganisationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Organisation name is required').max(100, 'Name cannot exceed 100 characters'),
        slug: z.string()
            .min(1, 'Slug is required')
            .max(50, 'Slug cannot exceed 50 characters')
            .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
        logo: z.string().url('Invalid logo URL').optional(),
    }),
});

export const updateOrganisationSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z.string()
            .min(1)
            .max(50)
            .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
            .optional(),
        logo: z.string().url('Invalid logo URL').optional().nullable(),
    }),
});

export const orgIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Organisation ID is required'),
    }),
});

export const checkSlugSchema = z.object({
    query: z.object({
        slug: z.string().min(1, 'Slug is required'),
    }),
});

// ========================================
// Type Exports
// ========================================

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>['body'];
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>['body'];

// Role Types
export type OrganisationRole = 'owner' | 'admin' | 'member';
