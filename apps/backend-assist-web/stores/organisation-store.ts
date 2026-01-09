import { create } from "zustand"
import { devtools } from "zustand/middleware"

export interface OrganisationRole {
    _id: string
    name: string
    slug: string
    permissions: string[]
}

export interface Organisation {
    _id: string
    name: string
    slug: string
    logo?: string
    metadata?: Record<string, unknown>
    createdAt: string
    updatedAt: string
    role: OrganisationRole | null
    isOwner: boolean
    memberId: string
    extraPermissions: string[]
}

interface OrganisationStore {
    // State
    organisations: Organisation[]
    activeOrganisation: Organisation | null
    isLoaded: boolean

    // Actions
    setOrganisations: (organisations: Organisation[]) => void
    setActiveOrganisation: (organisation: Organisation | null) => void
    addOrganisation: (organisation: Organisation) => void
    updateOrganisation: (id: string, updates: Partial<Organisation>) => void
    removeOrganisation: (id: string) => void
    clearStore: () => void

    // Getters
    getOrganisationById: (id: string) => Organisation | undefined
}

export const useOrganisationStore = create<OrganisationStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            organisations: [],
            activeOrganisation: null,
            isLoaded: false,

            // Actions
            setOrganisations: (organisations) => {
                set({ organisations, isLoaded: true })

                // Auto-select first organisation if no active organisation
                const state = get()
                if (!state.activeOrganisation && organisations.length > 0) {
                    set({ activeOrganisation: organisations[0] })
                }
            },

            setActiveOrganisation: (organisation) => {
                set({ activeOrganisation: organisation })
            },

            addOrganisation: (organisation) => {
                set((state) => {
                    const exists = state.organisations.some(
                        (o) => o._id === organisation._id
                    )
                    if (exists) return state

                    const newOrganisations = [organisation, ...state.organisations]
                    return {
                        organisations: newOrganisations,
                        // If this is the first organisation, set it as active
                        activeOrganisation:
                            state.organisations.length === 0
                                ? organisation
                                : state.activeOrganisation,
                    }
                })
            },

            updateOrganisation: (id, updates) => {
                set((state) => {
                    const updatedOrganisations = state.organisations.map((org) =>
                        org._id === id ? { ...org, ...updates } : org
                    )

                    // Also update activeOrganisation if it's the one being updated
                    const updatedActive =
                        state.activeOrganisation?._id === id
                            ? { ...state.activeOrganisation, ...updates }
                            : state.activeOrganisation

                    return {
                        organisations: updatedOrganisations,
                        activeOrganisation: updatedActive,
                    }
                })
            },

            removeOrganisation: (id) => {
                set((state) => {
                    const filtered = state.organisations.filter((o) => o._id !== id)

                    // If removing active organisation, select the first available one
                    const newActive =
                        state.activeOrganisation?._id === id
                            ? filtered.length > 0
                                ? filtered[0]
                                : null
                            : state.activeOrganisation

                    return {
                        organisations: filtered,
                        activeOrganisation: newActive,
                    }
                })
            },

            clearStore: () => {
                set({
                    organisations: [],
                    activeOrganisation: null,
                    isLoaded: false,
                })
            },

            // Getters
            getOrganisationById: (id) => {
                return get().organisations.find((o) => o._id === id)
            },
        }),
        { name: "OrganisationStore" }
    )
)
