import { z } from "zod"

export const organisationIdParamSchema = z.object({
  params: z.object({
    organisationId: z.string().min(1, "Organisation ID is required"),
  }),
})

export const memberIdParamSchema = z.object({
  params: z.object({
    organisationId: z.string().min(1, "Organisation ID is required"),
    memberId: z.string().min(1, "Member ID is required"),
  }),
})

export const updateMemberRoleSchema = z.object({
  params: z.object({
    organisationId: z.string().min(1, "Organisation ID is required"),
    memberId: z.string().min(1, "Member ID is required"),
  }),
  body: z.object({
    roleId: z.string().min(1, "Role ID is required"),
  }),
})

export const updateMemberPermissionsSchema = z.object({
  params: z.object({
    organisationId: z.string().min(1, "Organisation ID is required"),
    memberId: z.string().min(1, "Member ID is required"),
  }),
  body: z.object({
    extraPermissions: z.array(z.string()).default([]),
  }),
})
