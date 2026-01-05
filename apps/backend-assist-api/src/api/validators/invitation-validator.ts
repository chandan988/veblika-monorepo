import { z } from "zod"

export const createInvitationSchema = z.object({
    params: z.object({
        orgId: z.string().min(1, "Organisation ID is required"),
    }),
    body: z.object({
        email: z.string().email("Invalid email address"),
        roleId: z.string().min(1, "Role ID is required"),
    }),
})

export const invitationIdParamSchema = z.object({
    params: z.object({
        invitationId: z.string().min(1, "Invitation ID is required"),
    }),
})

export const organisationInvitationParamSchema = z.object({
    params: z.object({
        orgId: z.string().min(1, "Organisation ID is required"),
        invitationId: z.string().min(1, "Invitation ID is required"),
    }),
})

export const acceptInvitationSchema = z.object({
    params: z.object({
        invitationId: z.string().min(1, "Invitation ID is required"),
    }),
})
