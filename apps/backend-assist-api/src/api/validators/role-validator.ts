import { z } from "zod"

export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Role name is required")
      .max(50, "Role name must be 50 characters or less")
      .trim(),
    description: z
      .string()
      .max(200, "Description must be 200 characters or less")
      .trim()
      .optional(),
    permissions: z
      .array(z.string())
      .min(1, "At least one permission is required"),
  }),
  params: z.object({
    orgId: z.string().min(1, "Organisation ID is required"),
  }),
})

export const updateRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Role name is required")
      .max(50, "Role name must be 50 characters or less")
      .trim()
      .optional(),
    description: z
      .string()
      .max(200, "Description must be 200 characters or less")
      .trim()
      .optional(),
    permissions: z.array(z.string()).optional(),
  }),
  params: z.object({
    orgId: z.string().min(1, "Organisation ID is required"),
    roleId: z.string().min(1, "Role ID is required"),
  }),
})

export const roleIdSchema = z.object({
  params: z.object({
    orgId: z.string().min(1, "Organisation ID is required"),
    roleId: z.string().min(1, "Role ID is required"),
  }),
})

export const orgIdParamSchema = z.object({
  params: z.object({
    orgId: z.string().min(1, "Organisation ID is required"),
  }),
})

export const assignRoleSchema = z.object({
  body: z.object({
    memberId: z.string().min(1, "Member ID is required"),
    roleId: z.string().min(1, "Role ID is required"),
  }),
  params: z.object({
    orgId: z.string().min(1, "Organisation ID is required"),
  }),
})

export const updateMemberPermissionsSchema = z.object({
  body: z.object({
    extraPermissions: z.array(z.string()),
  }),
  params: z.object({
    orgId: z.string().min(1, "Organisation ID is required"),
    memberId: z.string().min(1, "Member ID is required"),
  }),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>["body"]
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>["body"]
export type AssignRoleInput = z.infer<typeof assignRoleSchema>["body"]
export type UpdateMemberPermissionsInput = z.infer<
  typeof updateMemberPermissionsSchema
>["body"]
