"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useOrganisationStore, Organisation } from "@/stores/organisation-store"
import { useEffect } from "react"

// ========================================
// Types
// ========================================

interface CreateOrganisationInput {
    name: string
    slug: string
    logo?: string
}

interface UpdateOrganisationInput {
    name?: string
    slug?: string
    logo?: string | null
}

interface Member {
    _id: string
    organizationId: string
    userId: string
    role: "owner" | "admin" | "member"
    invitedBy?: string
    createdAt: string
    updatedAt: string
}

interface AddMemberInput {
    userId: string
    role: "owner" | "admin" | "member"
}

interface UpdateMemberRoleInput {
    role: "owner" | "admin" | "member"
}

// ========================================
// Organisation Hooks
// ========================================

/**
 * Fetch user's organisations and sync with store
 */
export const useOrganisations = () => {
    const setOrganisations = useOrganisationStore((s) => s.setOrganisations)
    const activeOrganisation = useOrganisationStore((s) => s.activeOrganisation)
    const setActiveOrganisation = useOrganisationStore(
        (s) => s.setActiveOrganisation
    )

    const query = useQuery({
        queryKey: ["organisations"],
        queryFn: async () => {
            const { data } = await api.get("/organisations")
            return data.data as Organisation[]
        },
    })

    // Sync with store when data changes
    useEffect(() => {
        if (query.data) {
            setOrganisations(query.data)

            // If we have a persisted active organisation ID but full data is missing,
            // restore it from the fetched data
            if (activeOrganisation && !activeOrganisation.name) {
                const fullOrg = query.data.find(
                    (o) => o._id === activeOrganisation._id
                )
                if (fullOrg) {
                    setActiveOrganisation(fullOrg)
                }
            }
        }
    }, [query.data, setOrganisations, activeOrganisation, setActiveOrganisation])

    return query
}

/**
 * Get single organisation by ID
 */
export const useOrganisation = (organisationId: string) => {
    return useQuery({
        queryKey: ["organisation", organisationId],
        queryFn: async () => {
            const { data } = await api.get(`/organisations/${organisationId}`)
            return data.data as Organisation & { role: string }
        },
        enabled: !!organisationId,
    })
}

/**
 * Check if slug is available
 */
export const useCheckSlug = (slug: string) => {
    return useQuery({
        queryKey: ["organisation-slug", slug],
        queryFn: async () => {
            const { data } = await api.get("/organisations/check-slug", {
                params: { slug },
            })
            return data.data.available as boolean
        },
        enabled: slug.length >= 3,
    })
}

/**
 * Create new organisation
 */
export const useCreateOrganisation = () => {
    const queryClient = useQueryClient()
    const addOrganisation = useOrganisationStore((s) => s.addOrganisation)
    const setActiveOrganisation = useOrganisationStore(
        (s) => s.setActiveOrganisation
    )

    return useMutation({
        mutationFn: async (input: CreateOrganisationInput) => {
            const { data } = await api.post("/organisations", input)
            return data.data as { organisation: Organisation; member: Member }
        },
        onSuccess: (data) => {
            const orgWithRole: Organisation = {
                ...data.organisation,
                role: null, // Will be populated on next fetch
                isOwner: data.member.role === "owner",
                memberId: data.member._id,
                extraPermissions: [],
            }
            addOrganisation(orgWithRole)
            setActiveOrganisation(orgWithRole)
            queryClient.invalidateQueries({ queryKey: ["organisations"] })
        },
    })
}

/**
 * Update organisation
 */
export const useUpdateOrganisation = () => {
    const queryClient = useQueryClient()
    const updateOrganisation = useOrganisationStore((s) => s.updateOrganisation)

    return useMutation({
        mutationFn: async ({
            id,
            input,
        }: {
            id: string
            input: UpdateOrganisationInput
        }) => {
            const { data } = await api.put(`/organisations/${id}`, input)
            return data.data as Organisation
        },
        onSuccess: (data) => {
            updateOrganisation(data._id, data)
            queryClient.invalidateQueries({ queryKey: ["organisations"] })
            queryClient.invalidateQueries({ queryKey: ["organisation", data._id] })
        },
    })
}

/**
 * Delete organisation
 */
export const useDeleteOrganisation = () => {
    const queryClient = useQueryClient()
    const removeOrganisation = useOrganisationStore((s) => s.removeOrganisation)

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/organisations/${id}`)
            return id
        },
        onSuccess: (id) => {
            removeOrganisation(id)
            queryClient.invalidateQueries({ queryKey: ["organisations"] })
        },
    })
}

// ========================================
// Member Hooks
// ========================================

/**
 * Get members of an organisation
 */
export const useOrganisationMembers = (organisationId: string) => {
    return useQuery({
        queryKey: ["organisation-members", organisationId],
        queryFn: async () => {
            const { data } = await api.get(`/organisations/${organisationId}/members`)
            return data.data as Member[]
        },
        enabled: !!organisationId,
    })
}

/**
 * Add member to organisation
 */
export const useAddMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            organisationId,
            input,
        }: {
            organisationId: string
            input: AddMemberInput
        }) => {
            const { data } = await api.post(
                `/organisations/${organisationId}/members`,
                input
            )
            return data.data as Member
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["organisation-members", variables.organisationId],
            })
        },
    })
}

/**
 * Update member role
 */
export const useUpdateMemberRole = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            organisationId,
            memberId,
            input,
        }: {
            organisationId: string
            memberId: string
            input: UpdateMemberRoleInput
        }) => {
            const { data } = await api.put(
                `/organisations/${organisationId}/members/${memberId}`,
                input
            )
            return data.data as Member
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["organisation-members", variables.organisationId],
            })
        },
    })
}

/**
 * Remove member from organisation
 */
export const useRemoveMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            organisationId,
            memberId,
        }: {
            organisationId: string
            memberId: string
        }) => {
            await api.delete(`/organisations/${organisationId}/members/${memberId}`)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["organisation-members", variables.organisationId],
            })
        },
    })
}

/**
 * Leave organisation
 */
export const useLeaveOrganisation = () => {
    const queryClient = useQueryClient()
    const removeOrganisation = useOrganisationStore((s) => s.removeOrganisation)

    return useMutation({
        mutationFn: async (organisationId: string) => {
            await api.post(`/organisations/${organisationId}/leave`)
            return organisationId
        },
        onSuccess: (id) => {
            removeOrganisation(id)
            queryClient.invalidateQueries({ queryKey: ["organisations"] })
        },
    })
}

// ========================================
// Custom Hooks for Active Organisation
// ========================================

/**
 * Switch active organisation
 */
export const useSwitchOrganisation = () => {
    const setActiveOrganisation = useOrganisationStore(
        (s) => s.setActiveOrganisation
    )
    const getOrganisationById = useOrganisationStore((s) => s.getOrganisationById)

    return (organisationId: string) => {
        const org = getOrganisationById(organisationId)
        if (org) {
            setActiveOrganisation(org)
        }
    }
}

/**
 * Get active organisation from store
 */
export const useActiveOrganisation = () => {
    return useOrganisationStore((s) => s.activeOrganisation)
}
